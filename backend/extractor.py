import os
import sys
import json
import base64
import logging
from io import BytesIO
from pathlib import Path
from typing import Optional, List, Tuple, Dict, Any
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models import ExtractedLabelData, CanonicalPackagingData, FieldObservation
import config

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert Legal Metrology & Food Safety Compliance Inspector under the Department of Consumer Affairs (DoCA), Government of India.
Analyze the provided packaged commodity / food packet label images thoroughly across all panels (e.g. Front, Back, Side, Nutritional panel).
Extract all mandatory declarations required under the Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011) and FSSAI packaging guidelines.

For each field, extract:
- "value": The normalized typed value (e.g., number, string, boolean, or null if absent)
- "raw_text": Verbatim text as physically printed on the package
- "confidence": Float between 0.0 and 1.0 representing OCR/detection confidence (0.95+ for sharp text, 0.6-0.8 for partial/curved, 0.0 if not found)
- "source_image": The panel identifier where this was observed ("front", "back", "side", "panel")
- "evidence_text": The immediate surrounding text context

Extract these mandatory declarations:
1. Brand Name & Generic/Common Commodity Name (Rule 6(1)(b)).
2. Name and physical address of Manufacturer / Packer / Importer (Rule 6(1)(a)).
3. Net Quantity with numeric value and standard unit (g, kg, ml, l, N) (Rule 6(1)(c)).
4. Maximum Retail Price (MRP), raw text, numeric amount, and whether "incl. of all taxes" is present (Rule 6(1)(e)).
5. Unit Sale Price (USP) e.g., Rs. 0.40/g or Rs. 25.00/100g if declared (Rule 6(11)).
6. Month and Year of Manufacture / Pre-packing / Import (Rule 6(1)(d)).
7. Consumer Care Details: contact person/designation, phone/toll-free, email ID, and postal address (Rule 6(1)(n)).
8. Country of Origin (Rule 6(1)(10)).
9. FSSAI License Number (14-digit) and Veg/Non-Veg indicator (Green/Brown dot).
10. Legibility, contrast, and font size adequacy (Rule 7 & Schedule II).
11. Detected languages on the package (Rule 9).
12. Full raw text transcript of the label.

Return strictly valid JSON conforming to the requested schema. Never invent values. If a declaration is missing, set its value to null, raw_text to "", and confidence to 0.0."""


class LabelExtractor:
    """
    Extracts structured Legal Metrology declarations from single or multi-panel
    packaging images using Gemini Multimodal Vision API.
    """

    @classmethod
    def extract_from_image(
        cls,
        image_path: Path,
        custom_api_key: Optional[str] = None,
        sample_id: Optional[str] = None,
        panel_tag: str = "front"
    ) -> ExtractedLabelData:
        """Backward-compatible single-image extraction entrypoint."""
        extracted, _ = cls.extract_from_images(
            images=[(image_path, panel_tag)],
            custom_api_key=custom_api_key,
            sample_id=sample_id
        )
        return extracted

    @classmethod
    def extract_from_images(
        cls,
        images: List[Tuple[Path, str]],
        custom_api_key: Optional[str] = None,
        sample_id: Optional[str] = None
    ) -> Tuple[ExtractedLabelData, CanonicalPackagingData]:
        """
        Multi-panel packaging extraction entrypoint.
        Returns both legacy ExtractedLabelData and CanonicalPackagingData.
        """
        # If user explicitly selected a pre-configured demo test case
        if sample_id:
            extracted = cls._get_sample_fixture(sample_id)
            canonical = extracted.to_canonical(default_panel="front")
            return extracted, canonical

        # Resolve Gemini API Key
        api_key_str = ""
        if isinstance(custom_api_key, str) and custom_api_key.strip():
            api_key_str = custom_api_key.strip()
        elif isinstance(config.GEMINI_API_KEY, str) and config.GEMINI_API_KEY.strip():
            api_key_str = config.GEMINI_API_KEY.strip()
        elif isinstance(os.environ.get("GEMINI_API_KEY"), str) and os.environ.get("GEMINI_API_KEY", "").strip():
            api_key_str = os.environ.get("GEMINI_API_KEY", "").strip()

        if not api_key_str or len(api_key_str) < 10:
            raise ValueError(
                "Gemini API Key is missing or invalid. Please configure a valid Google Gemini API key in '.env' or click 'Configure API Key' in the top navigation bar to scan real images."
            )

        return cls._extract_with_gemini(images, api_key_str)

    @classmethod
    def _extract_with_gemini(
        cls,
        images: List[Tuple[Path, str]],
        api_key: str
    ) -> Tuple[ExtractedLabelData, CanonicalPackagingData]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            # Build multimodal contents with panel tags
            contents_payload = []
            for img_path, panel_tag in images:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()

                mtype = "image/jpeg"
                lower_p = str(img_path).lower()
                if lower_p.endswith(".png"):
                    mtype = "image/png"
                elif lower_p.endswith(".webp"):
                    mtype = "image/webp"

                contents_payload.append(
                    types.Part.from_text(text=f"[PACKAGING PANEL IDENTIFIER: {panel_tag.upper()}]")
                )
                contents_payload.append(
                    types.Part.from_bytes(data=img_bytes, mime_type=mtype)
                )

            schema_guide = (
                f"{SYSTEM_PROMPT}\n\n"
                "Return a single JSON object matching this schema:\n"
                "{\n"
                '  "brand_name": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "front"},\n'
                '  "generic_name": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "commodity_category": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "manufacturer_name": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "manufacturer_address": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "packer_name": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "packer_address": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "importer_name": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "importer_address": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "country_of_origin": {"value": "string", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "net_quantity_value": {"value": float or null, "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "net_quantity_unit": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "mrp_amount": {"value": float or null, "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "mrp_tax_inclusive": {"value": boolean, "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "declared_usp_amount": {"value": float or null, "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "declared_usp_unit": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "mfg_date": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "exp_date": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "batch_number": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "consumer_care_person": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "consumer_care_phone": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "consumer_care_email": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "consumer_care_address": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "fssai_license": {"value": "string or null", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "veg_nonveg_mark": {"value": "Veg" | "Non-Veg" | "None", "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "legibility_adequate": {"value": boolean, "raw_text": "string", "confidence": float, "source_image": "string"},\n'
                '  "detected_languages": ["English", "Hindi"],\n'
                '  "raw_ocr_dump": "string"\n'
                "}"
            )
            contents_payload.append(types.Part.from_text(text=schema_guide))

            # Prioritize lower, high-quota models (Flash & Flash-Lite) to avoid Free Tier 429 quota exhaustion (Pro models have limit: 0)
            preferred_model = getattr(config, 'GEMINI_MODEL', None) or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
            candidate_models = [
                preferred_model,
                'gemini-3.6-flash',
                'gemini-3.5-flash',
                'gemini-3.7-flash',
                'gemini-3.8-flash',
                'gemini-flash-latest'
            ]
            models_to_try = [m for m in dict.fromkeys(candidate_models) if m]
            response = None
            last_err = None

            for model_name in models_to_try:
                try:
                    print(f"[*] [Gemini Vision AI] Sending {len(images)} packaging panel(s) to model: {model_name}...")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents_payload,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1
                        )
                    )
                    if response and response.text:
                        print(f"[+] [Gemini Vision AI] Successfully received structured declarations using {model_name}")
                        break
                except Exception as ex:
                    print(f"[-] [Gemini Vision AI] Model {model_name} failed: {ex}. Trying next available model...")
                    last_err = ex
                    continue

            if not response or not response.text:
                error_detail = str(last_err) if last_err else "No response text received from Gemini API"
                raise RuntimeError(f"Gemini API Error: {error_detail}")

            raw_json_str = response.text.strip()
            if raw_json_str.startswith("```"):
                lines = raw_json_str.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_json_str = "\n".join(lines).strip()

            parsed = json.loads(raw_json_str)

            # Helper to normalize field dict into FieldObservation
            def parse_obs(key: str, default_val: Any = None, default_panel: str = images[0][1]) -> Optional[FieldObservation]:
                raw = parsed.get(key)
                if raw is None:
                    if default_val is not None:
                        return FieldObservation(value=default_val, raw_text=str(default_val), source_image=default_panel)
                    return None
                if isinstance(raw, dict):
                    v = raw.get("value", default_val)
                    t = str(raw.get("raw_text") or (v if v is not None else ""))
                    c = float(raw.get("confidence", 0.95))
                    s = str(raw.get("source_image") or default_panel).lower()
                    e = str(raw.get("evidence_text") or t)
                    return FieldObservation(value=v, raw_text=t, confidence=c, source_image=s, evidence_text=e)
                else:
                    return FieldObservation(value=raw, raw_text=str(raw), confidence=0.95, source_image=default_panel, evidence_text=str(raw))

            canonical = CanonicalPackagingData(
                brand_name=parse_obs("brand_name", "Unknown Brand") or FieldObservation(value="Unknown Brand", raw_text="Unknown Brand"),
                generic_name=parse_obs("generic_name"),
                commodity_category=parse_obs("commodity_category", "Food / FMCG") or FieldObservation(value="Food / FMCG", raw_text="Food / FMCG"),
                manufacturer_name=parse_obs("manufacturer_name"),
                manufacturer_address=parse_obs("manufacturer_address"),
                packer_name=parse_obs("packer_name"),
                packer_address=parse_obs("packer_address"),
                importer_name=parse_obs("importer_name"),
                importer_address=parse_obs("importer_address"),
                country_of_origin=parse_obs("country_of_origin", "India") or FieldObservation(value="India", raw_text="India"),
                net_quantity_value=parse_obs("net_quantity_value"),
                net_quantity_unit=parse_obs("net_quantity_unit"),
                mrp_amount=parse_obs("mrp_amount"),
                mrp_tax_inclusive=parse_obs("mrp_tax_inclusive"),
                declared_usp_amount=parse_obs("declared_usp_amount"),
                declared_usp_unit=parse_obs("declared_usp_unit"),
                mfg_date=parse_obs("mfg_date"),
                exp_date=parse_obs("exp_date"),
                batch_number=parse_obs("batch_number"),
                consumer_care_person=parse_obs("consumer_care_person"),
                consumer_care_phone=parse_obs("consumer_care_phone"),
                consumer_care_email=parse_obs("consumer_care_email"),
                consumer_care_address=parse_obs("consumer_care_address"),
                fssai_license=parse_obs("fssai_license"),
                veg_nonveg_mark=parse_obs("veg_nonveg_mark"),
                detected_languages=parsed.get("detected_languages") or ["English"],
                legibility_adequate=parse_obs("legibility_adequate", True) or FieldObservation(value=True, raw_text="Adequate"),
                raw_ocr_dump=str(parsed.get("raw_ocr_dump") or "")
            )

            extracted = canonical.to_extracted_label_data()
            return extracted, canonical

        except Exception as e:
            logger.error(f"Gemini Vision Extraction Error: {e}")
            raise RuntimeError(f"AI Extraction Failed: {str(e)}")
            logger.error(f"Gemini Vision Extraction Error: {e}")
            raise RuntimeError(f"AI Extraction Failed: {str(e)}")

    @classmethod
    def _get_sample_fixture(cls, sample_id: str) -> ExtractedLabelData:
        """Returns verified statutory test data only when user clicks a preset sample button."""
        if sample_id == "sample1":
            return ExtractedLabelData(
                brand_name="Kurkure",
                generic_name="Extruded Snack - Masala Munch",
                commodity_category="Food / Snacks",
                manufacturer_name="PepsiCo India Holdings Pvt. Ltd.",
                manufacturer_address="Village Channo, Patiala-Sangrur Road, P.O. Bhawanigarh, Distt. Sangrur - 148026, Punjab",
                country_of_origin="India",
                net_quantity_raw="Net Quantity: 85 g",
                net_quantity_value=85.0,
                net_quantity_unit="g",
                mrp_raw="MRP Rs. 20.00 (incl. of all taxes)",
                mrp_amount=20.0,
                mrp_has_inclusive_phrase=True,
                unit_sale_price_raw="Unit Sale Price: Rs. 0.24 / g",
                unit_sale_price_value=0.24,
                unit_sale_price_unit="g",
                mfg_date_raw="07/2024",
                exp_date_raw="4 Months from Packaging",
                batch_or_lot_no="PB24B0912",
                consumer_care_name_desig="Consumer Care Manager",
                consumer_care_phone="1800-22-4020",
                consumer_care_email="consumer.feedback@pepsico.com",
                consumer_care_address="PepsiCo India Holdings Pvt. Ltd., Level 3-5, Pioneer Square, Sector 62, Golf Course Extn Road, Gurugram - 122101, Haryana",
                fssai_lic_no="10014064000435",
                veg_nonveg_status="Veg",
                font_size_adequate=True,
                principal_display_panel_notes="Prominent display with high contrast and standard numeral height above 2.0mm.",
                detected_languages=["English", "Hindi"],
                raw_ocr_text="Kurkure Masala Munch. Net Qty: 85g. MRP Rs. 20.00 (incl. of all taxes). USP: Rs 0.24/g. Pkd: 07/2024. FSSAI Lic No. 10014064000435. Green Dot Veg Symbol."
            )
            
        elif sample_id == "sample2":
            return ExtractedLabelData(
                brand_name="Lay's",
                generic_name="Potato Chips - India's Magic Masala",
                commodity_category="Food / Snacks",
                manufacturer_name="PepsiCo India Holdings Pvt. Ltd.",
                manufacturer_address="Plot No. 27-28, Industrial Area, Hajipur, Vaishali - 844101, Bihar",
                country_of_origin="India",
                net_quantity_raw="Net Wt: 50g",
                net_quantity_value=50.0,
                net_quantity_unit="g",
                mrp_raw="MRP Rs. 20.00",
                mrp_amount=20.0,
                mrp_has_inclusive_phrase=False,
                unit_sale_price_raw="USP: Rs 0.40/g",
                unit_sale_price_value=0.40,
                unit_sale_price_unit="g",
                mfg_date_raw="08/2024",
                exp_date_raw="4 Months from Packaging",
                batch_or_lot_no="L2408B1",
                consumer_care_name_desig="Consumer Feedback Desk",
                consumer_care_phone="1800-22-4020",
                consumer_care_email="consumer.feedback@pepsico.com",
                consumer_care_address="PepsiCo India, Gurugram",
                fssai_lic_no="10014011000214",
                veg_nonveg_status="Veg",
                font_size_adequate=True,
                principal_display_panel_notes="MRP is printed clearly but omits '(incl. of all taxes)' declaration.",
                detected_languages=["English"],
                raw_ocr_text="Lay's Magic Masala Potato Chips. Net Wt: 50g. MRP Rs. 20.00. USP: Rs 0.40/g. Pkd: 08/2024. FSSAI Lic No. 10014011000214."
            )
            
        elif sample_id == "sample3":
            return ExtractedLabelData(
                brand_name="Parle-G",
                generic_name="Glucose Biscuits",
                commodity_category="Food / Biscuits",
                manufacturer_name="Parle Products Pvt. Ltd.",
                manufacturer_address="North Level Crossing, Vile Parle East, Mumbai - 400057, Maharashtra",
                country_of_origin="India",
                net_quantity_raw="Net Weight: 130 g",
                net_quantity_value=130.0,
                net_quantity_unit="g",
                mrp_raw="MRP Rs. 10.00 (incl. of all taxes)",
                mrp_amount=10.0,
                mrp_has_inclusive_phrase=True,
                unit_sale_price_raw="Unit Sale Price: Rs. 0.15 / g",
                unit_sale_price_value=0.15,
                unit_sale_price_unit="g",
                mfg_date_raw="09/2024",
                exp_date_raw="6 Months from Pkg",
                batch_or_lot_no="PG-0941",
                consumer_care_name_desig="Consumer Care Cell",
                consumer_care_phone="1800-22-7777",
                consumer_care_email=None,
                consumer_care_address="Vile Parle East, Mumbai",
                fssai_lic_no="10012022000109",
                veg_nonveg_status="Veg",
                font_size_adequate=True,
                principal_display_panel_notes="Unit sale price shows significant mathematical discrepancy compared to Net Weight & MRP.",
                detected_languages=["English", "Hindi"],
                raw_ocr_text="Parle-G Original Gluco Biscuits. Net Qty: 130g. MRP Rs. 10.00 (incl. of all taxes). Unit Sale Price Rs 0.15/g. Pkd: 09/2024. Tel: 1800-22-7777."
            )
            
        else: # sample4
            return ExtractedLabelData(
                brand_name="Maggi",
                generic_name="2-Minute Instant Noodles - Masala",
                commodity_category="Food / Instant Foods",
                manufacturer_name="Nestlé India Limited",
                manufacturer_address="",
                country_of_origin="India",
                net_quantity_raw="Net Weight: 70 g",
                net_quantity_value=70.0,
                net_quantity_unit="g",
                mrp_raw="MRP Rs. 14.00 (incl. of all taxes)",
                mrp_amount=14.0,
                mrp_has_inclusive_phrase=True,
                unit_sale_price_raw="Rs. 0.20 / g",
                unit_sale_price_value=0.20,
                unit_sale_price_unit="g",
                mfg_date_raw="09/2024",
                exp_date_raw="05/2025",
                batch_or_lot_no="LOT-9210-B",
                consumer_care_name_desig=None,
                consumer_care_phone=None,
                consumer_care_email=None,
                consumer_care_address=None,
                fssai_lic_no="10012011000168",
                veg_nonveg_status="Veg",
                font_size_adequate=True,
                principal_display_panel_notes="Missing manufacturer physical premises address and consumer grievance contact details.",
                detected_languages=["English"],
                raw_ocr_text="Maggi 2-Minute Noodles Masala. Net Weight 70g. MRP Rs 14.00 (incl. of all taxes). USP Rs 0.20/g. Manufactured by Nestlé India Ltd."
            )
