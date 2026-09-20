import os
import sys
import uuid
import shutil
from pathlib import Path

# Ensure backend directory is in python search path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

import config
from models import (
    ComplianceReport,
    ScanHistoryItem,
    ExtractedLabelData,
    CanonicalPackagingData,
    UploadedImageMetadata,
    FieldObservation
)
from extractor import LabelExtractor
from rules_engine import LegalMetrologyRulesEngine
from pdf_generator import InspectionNoticePDFGenerator
from image_validator import validate_and_inspect_image, validate_panel_tag
from PIL import Image
import db

app = FastAPI(
    title="Legal Metrology Compliance Checking System (DoCA / SIH 26034)",
    description="Automated scanning, extraction & Legal Metrology (Packaged Commodities) Rules, 2011 compliance validator.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories
app.mount("/static/uploads", StaticFiles(directory=str(config.UPLOAD_DIR)), name="uploads")
app.mount("/static/reports", StaticFiles(directory=str(config.REPORTS_DIR)), name="reports")
app.mount("/static/samples", StaticFiles(directory=str(config.SAMPLES_DIR)), name="samples")

# Initialize Database on startup
@app.on_event("startup")
def startup_event():
    db.init_db()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Legal Metrology Compliance Engine (PCR 2011)",
        "gemini_api_configured": bool(config.GEMINI_API_KEY and len(config.GEMINI_API_KEY) > 5)
    }


@app.get("/api/samples")
def get_sample_datasets():
    """Returns bundled sample packaged commodity labels for quick testing."""
    return [
        {
            "id": "sample1",
            "filename": "sample1_compliant_kurkure.png",
            "title": "Kurkure - Masala Munch (85g)",
            "category": "Snacks",
            "expected_verdict": "Fully Compliant (100%)",
            "tags": ["Compliant", "Valid USP", "Full Tax Clause"],
            "image_url": "/static/samples/sample1_compliant_kurkure.png"
        },
        {
            "id": "sample2",
            "filename": "sample2_missing_tax_lays.png",
            "title": "Lay's - Magic Masala (50g)",
            "category": "Chips",
            "expected_verdict": "Non-Compliant: Missing Tax Clause in MRP",
            "tags": ["Rule 6(1)(e) Violation", "Missing 'incl. of all taxes'"],
            "image_url": "/static/samples/sample2_missing_tax_lays.png"
        },
        {
            "id": "sample3",
            "filename": "sample3_wrong_usp_parleg.png",
            "title": "Parle-G - Glucose Biscuits (130g)",
            "category": "Biscuits",
            "expected_verdict": "Non-Compliant: Math Discrepancy in USP + Missing Email",
            "tags": ["Rule 6(11) Math Error", "Rule 6(1)(n) Missing Email"],
            "image_url": "/static/samples/sample3_wrong_usp_parleg.png"
        },
        {
            "id": "sample4",
            "filename": "sample4_missing_address_maggi.png",
            "title": "Maggi - 2-Minute Noodles (70g)",
            "category": "Instant Food",
            "expected_verdict": "Critical: Missing Factory Address & Consumer Care",
            "tags": ["Rule 6(1)(a) Address Missing", "Rule 6(1)(n) No Grievance Cell"],
            "image_url": "/static/samples/sample4_missing_address_maggi.png"
        }
    ]


@app.post("/api/scan", response_model=ComplianceReport)
async def scan_label(
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    panel_tags: Optional[List[str]] = Form(None),
    sample_id: Optional[str] = Form(None),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key")
):
    """
    Scans 1 to 4 packaged commodity label images or pre-configured sample datasets.
    Extracts mandatory declarations into canonical field observations, evaluates
    statutory compliance under Legal Metrology Rules 2011, generates PDF notice,
    and stores audit record in SQLite database.
    """
    scan_id = str(uuid.uuid4())
    clean_sample_id = sample_id if (isinstance(sample_id, str) and sample_id.strip()) else None
    clean_api_key = x_gemini_api_key if (isinstance(x_gemini_api_key, str) and x_gemini_api_key.strip()) else None

    # Collect incoming files
    upload_list: List[UploadFile] = []
    if files:
        upload_list.extend([f for f in files if f and f.filename])
    if file and file.filename:
        # Avoid duplicate if same file object was provided in both file and files
        if not any(f.filename == file.filename for f in upload_list):
            upload_list.insert(0, file)

    uploaded_metadata_list: List[UploadedImageMetadata] = []
    images_to_extract: List[Tuple[Path, str]] = []

    if clean_sample_id:
        sample_map = {
            "sample1": "sample1_compliant_kurkure.png",
            "sample2": "sample2_missing_tax_lays.png",
            "sample3": "sample3_wrong_usp_parleg.png",
            "sample4": "sample4_missing_address_maggi.png"
        }
        filename = sample_map.get(clean_sample_id, "sample1_compliant_kurkure.png")
        src_path = config.SAMPLES_DIR / filename
        if not src_path.exists():
            raise HTTPException(status_code=404, detail="Sample image not found")

        image_filename = f"scan_{scan_id[:8]}_{filename}"
        saved_path = config.UPLOAD_DIR / image_filename
        shutil.copyfile(src_path, saved_path)
        image_url = f"/static/uploads/{image_filename}"

        with Image.open(saved_path) as s_img:
            s_w, s_h = s_img.size

        sample_meta = UploadedImageMetadata(
            filename=image_filename,
            panel="front",
            mime_type="image/png",
            size_bytes=saved_path.stat().st_size,
            width=s_w,
            height=s_h,
            image_url=image_url
        )
        uploaded_metadata_list = [sample_meta]
        images_to_extract = [(saved_path, "front")]

    elif upload_list:
        if len(upload_list) > 4:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum 4 images allowed per scan (received {len(upload_list)})."
            )

        # Parse panel_tags
        parsed_tags: List[str] = []
        if panel_tags:
            for item in panel_tags:
                if isinstance(item, str):
                    for part in item.split(","):
                        cleaned = part.strip()
                        if cleaned:
                            parsed_tags.append(validate_panel_tag(cleaned))

        default_panels = ["front", "back", "side", "panel"]
        assigned_tags: List[str] = []
        for i in range(len(upload_list)):
            if i < len(parsed_tags):
                assigned_tags.append(parsed_tags[i])
            else:
                assigned_tags.append(default_panels[min(i, 3)])

        # Validate and save each image
        for i, up_file in enumerate(upload_list):
            panel_tag = assigned_tags[i]
            content, meta = await validate_and_inspect_image(up_file, panel=panel_tag)

            file_ext = Path(up_file.filename).suffix or f".{meta.mime_type.split('/')[-1]}"
            if not file_ext.startswith("."):
                file_ext = f".{file_ext}"

            saved_filename = f"scan_{scan_id[:8]}_{panel_tag}_{Path(up_file.filename).stem}{file_ext}"
            saved_path = config.UPLOAD_DIR / saved_filename

            with open(saved_path, "wb") as buffer:
                buffer.write(content)

            meta.filename = saved_filename
            meta.image_url = f"/static/uploads/{saved_filename}"

            uploaded_metadata_list.append(meta)
            images_to_extract.append((saved_path, panel_tag))

    else:
        raise HTTPException(
            status_code=400,
            detail="Either 'file', 'files', or 'sample_id' must be provided."
        )

    # 1. Extraction Layer (Single or Multi-panel Vision AI)
    try:
        extracted_data, canonical_data = LabelExtractor.extract_from_images(
            images=images_to_extract,
            custom_api_key=clean_api_key,
            sample_id=clean_sample_id
        )
    except Exception as e:
        print(f"[Extraction Error] {str(e).encode('ascii', errors='replace').decode('ascii')}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    primary_image_filename = uploaded_metadata_list[0].filename
    primary_image_url = uploaded_metadata_list[0].image_url

    # 2. Evaluation Layer (Legal Metrology Rules 2011 Engine)
    report = LegalMetrologyRulesEngine.evaluate(
        extracted=extracted_data,
        scan_id=scan_id,
        image_filename=primary_image_filename,
        image_url=primary_image_url,
        canonical_data=canonical_data,
        images=uploaded_metadata_list
    )

    # 3. PDF Generation Layer
    try:
        pdf_path = InspectionNoticePDFGenerator.generate_pdf(report)
        report.pdf_report_path = f"/api/export-pdf/{scan_id}"
    except Exception as e:
        print(f"[PDF Generation Error] {str(e).encode('ascii', errors='replace').decode('ascii')}")

    # 4. Persistence Layer
    db.save_scan_report(report)

    # 5. Print Detailed Audit to Console
    _print_scan_details_to_console(report, extracted_data)

    return report


def _print_scan_details_to_console(report: ComplianceReport, data: ExtractedLabelData):
    tax_status = "YES (Compliant)" if data.mrp_has_inclusive_phrase else "NO (VIOLATION - Missing mandatory 'incl. of all taxes')"
    usp_text = data.unit_sale_price_raw or "Not Declared"

    lines = [
        "",
        "=" * 80,
        f"[LEGAL METROLOGY PCR 2011 SCAN AUDIT]  ID: LMPC-{report.scan_id[:8].upper()}",
        "=" * 80,
        f"* Brand Name:           {data.brand_name}",
        f"* Generic Commodity:    {data.generic_name or 'Not Declared'}",
        f"* Category:             {data.commodity_category}",
        f"* Manufacturer / Pkd:   {data.manufacturer_name or 'Not Found'}",
        f"* Factory Address:      {data.manufacturer_address or 'Missing Address'}",
        f"* Net Quantity:         {data.net_quantity_raw} (Parsed: {data.net_quantity_value} {data.net_quantity_unit})",
        f"* Maximum Retail Price: {data.mrp_raw} [Tax Included: {tax_status}]",
        f"* Unit Sale Price (USP): {usp_text}",
        f"* Packing / Mfg Date:   {data.mfg_date_raw or 'N/A'} | Expiry: {data.exp_date_raw or 'N/A'}",
        f"* Consumer Care:        Tel: {data.consumer_care_phone or 'N/A'} | Email: {data.consumer_care_email or 'N/A'}",
        f"* Origin & FSSAI:       Origin: {data.country_of_origin} | FSSAI Lic: {data.fssai_lic_no or 'N/A'} | Dietary: {data.veg_nonveg_status}",
        "-" * 80,
        f"* OVERALL STATUS:       {report.overall_status} (Compliance Score: {report.compliance_score} / 100)",
        f"* Checks Breakdown:     PASSED: {report.passed_count} | VIOLATIONS: {report.failed_count} | ADVISORIES: {report.warning_count}",
    ]

    if report.usp_check:
        match_str = "YES (Verified Match)" if report.usp_check.is_match else f"NO (MISMATCH - {report.usp_check.discrepancy_percentage}% Discrepancy)"
        lines.append(f"* USP Math Engine:      Calculated: Rs {report.usp_check.calculated_usp} {report.usp_check.standard_unit} | Match: {match_str}")

    lines.append("-" * 80)
    lines.append("STATUTORY CLAUSE-BY-CLAUSE AUDIT:")
    for check in report.rule_results:
        symbol = "[PASS]     " if check.status == "PASS" else ("[VIOLATION]" if check.status == "FAIL" else "[WARNING]  ")
        lines.append(f"  {symbol} {check.rule_name} ({check.legal_reference})")
        if check.status != "PASS":
            lines.append(f"     -> Declared Value: {check.declared_value}")
            lines.append(f"     -> Standard:       {check.expected_standard}")
            lines.append(f"     -> Required Action: {check.remediation_guidance}")

    lines.append("=" * 80)
    lines.append("")

    for line in lines:
        try:
            print(line)
        except Exception:
            print(line.encode('ascii', errors='replace').decode('ascii'))


@app.get("/api/scan/{scan_id}", response_model=ComplianceReport)
def get_scan(scan_id: str):
    report = db.get_scan_report(scan_id)
    if not report:
        raise HTTPException(status_code=404, detail="Scan inspection not found.")
    return report


@app.get("/api/history", response_model=List[ScanHistoryItem])
def get_history(limit: int = 50):
    return db.get_scan_history(limit=limit)


@app.get("/api/analytics")
def get_analytics():
    return db.get_analytics_summary()


@app.get("/api/export-pdf/{scan_id}")
def export_pdf(scan_id: str):
    pdf_filename = f"Inspection_Notice_{scan_id}.pdf"
    pdf_path = config.REPORTS_DIR / pdf_filename

    if not pdf_path.exists():
        report = db.get_scan_report(scan_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        InspectionNoticePDFGenerator.generate_pdf(report)

    if pdf_path.exists():
        return FileResponse(
            str(pdf_path),
            media_type="application/pdf",
            filename=f"Legal_Metrology_Notice_{scan_id[:8].upper()}.pdf"
        )
    raise HTTPException(status_code=404, detail="PDF generation failed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
