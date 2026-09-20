import io
import os
import sys
import unittest
from unittest.mock import patch
from pathlib import Path
from PIL import Image

# Ensure backend directory is in sys.path
TEST_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TEST_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from models import (
    FieldObservation,
    CanonicalPackagingData,
    UploadedImageMetadata,
    ExtractedLabelData,
    ComplianceReport
)
from extractor import LabelExtractor
from image_validator import validate_panel_tag, MAX_IMAGE_SIZE_BYTES
import config


def create_test_image_bytes(width: int = 100, height: int = 100, color: str = "red", fmt: str = "PNG") -> bytes:
    """Helper to create valid in-memory image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=color)
    img.save(buf, format=fmt)
    return buf.getvalue()


class TestPhase1CoreDataContractAndMultiImage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # ----------------------------------------------------------------------
    # 1. Pydantic Models & Canonical Schema Tests
    # ----------------------------------------------------------------------
    def test_field_observation_creation_and_defaults(self):
        obs = FieldObservation(
            value=85.0,
            raw_text="Net Qty: 85 g",
            confidence=0.98,
            source_image="front",
            evidence_text="Net Qty: 85 g (MRP Rs. 20.00)"
        )
        self.assertEqual(obs.value, 85.0)
        self.assertEqual(obs.raw_text, "Net Qty: 85 g")
        self.assertEqual(obs.confidence, 0.98)
        self.assertEqual(obs.source_image, "front")
        self.assertIn("Net Qty", obs.evidence_text)

    def test_canonical_packaging_data_defaults_and_roundtrip(self):
        extracted = ExtractedLabelData(
            brand_name="Test Brand",
            generic_name="Potato Chips",
            commodity_category="Food / Snacks",
            manufacturer_name="Test Foods Ltd",
            manufacturer_address="123 Industrial Area, New Delhi - 110001",
            country_of_origin="India",
            net_quantity_raw="50 g",
            net_quantity_value=50.0,
            net_quantity_unit="g",
            mrp_raw="MRP Rs. 20.00 (incl. of all taxes)",
            mrp_amount=20.0,
            mrp_has_inclusive_phrase=True,
            unit_sale_price_raw="Rs. 0.40 / g",
            unit_sale_price_value=0.40,
            unit_sale_price_unit="g",
            mfg_date_raw="08/2024",
            consumer_care_phone="1800-11-2233",
            consumer_care_email="care@test.com",
            fssai_lic_no="10012011000168",
            veg_nonveg_status="Veg"
        )
        # Convert to Canonical
        canonical = extracted.to_canonical(default_panel="front")
        self.assertIsInstance(canonical, CanonicalPackagingData)
        self.assertEqual(canonical.brand_name.value, "Test Brand")
        self.assertEqual(canonical.brand_name.source_image, "front")
        self.assertEqual(canonical.net_quantity_value.value, 50.0)
        self.assertEqual(canonical.mrp_amount.value, 20.0)
        self.assertTrue(canonical.mrp_tax_inclusive.value)

        # Convert back to ExtractedLabelData
        projected = canonical.to_extracted_label_data()
        self.assertEqual(projected.brand_name, "Test Brand")
        self.assertEqual(projected.generic_name, "Potato Chips")
        self.assertEqual(projected.net_quantity_value, 50.0)
        self.assertEqual(projected.net_quantity_unit, "g")
        self.assertEqual(projected.mrp_amount, 20.0)
        self.assertTrue(projected.mrp_has_inclusive_phrase)
        self.assertEqual(projected.unit_sale_price_value, 0.40)
        self.assertEqual(projected.fssai_lic_no, "10012011000168")

    def test_uploaded_image_metadata_model(self):
        meta = UploadedImageMetadata(
            filename="front_panel.jpg",
            panel="front",
            mime_type="image/jpeg",
            size_bytes=102400,
            width=800,
            height=1200,
            image_url="/static/uploads/front_panel.jpg"
        )
        self.assertEqual(meta.panel, "front")
        self.assertEqual(meta.width, 800)
        self.assertEqual(meta.height, 1200)

    # ----------------------------------------------------------------------
    # 2. Existing API Health & Samples Tests
    # ----------------------------------------------------------------------
    def test_api_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("gemini_api_configured", data)

    def test_api_samples_endpoint(self):
        res = self.client.get("/api/samples")
        self.assertEqual(res.status_code, 200)
        samples = res.json()
        self.assertEqual(len(samples), 4)
        sample_ids = [s["id"] for s in samples]
        self.assertListEqual(sample_ids, ["sample1", "sample2", "sample3", "sample4"])

    # ----------------------------------------------------------------------
    # 3. Existing Sample Scan Tests (Backward Compatibility)
    # ----------------------------------------------------------------------
    def test_sample1_compliant_kurkure_scan(self):
        res = self.client.post("/api/scan", data={"sample_id": "sample1"})
        self.assertEqual(res.status_code, 200)
        report = res.json()

        # Check compliance verdict
        self.assertEqual(report["overall_status"], "COMPLIANT")
        self.assertEqual(report["compliance_score"], 100)
        self.assertEqual(report["brand_name"], "Kurkure")

        # Check that extracted_data is present and backward compatible
        self.assertIn("extracted_data", report)
        self.assertEqual(report["extracted_data"]["brand_name"], "Kurkure")
        self.assertEqual(report["extracted_data"]["net_quantity_value"], 85.0)

        # Check that canonical_data is populated
        self.assertIn("canonical_data", report)
        self.assertIsNotNone(report["canonical_data"])
        self.assertEqual(report["canonical_data"]["brand_name"]["value"], "Kurkure")
        self.assertEqual(report["canonical_data"]["brand_name"]["source_image"], "front")

        # Check that images metadata is populated
        self.assertIn("images", report)
        self.assertGreaterEqual(len(report["images"]), 1)
        self.assertEqual(report["images"][0]["panel"], "front")

        # Check PDF report path is generated
        self.assertIn("/api/export-pdf/", report["pdf_report_path"])

    def test_sample2_missing_tax_scan(self):
        res = self.client.post("/api/scan", data={"sample_id": "sample2"})
        self.assertEqual(res.status_code, 200)
        report = res.json()
        self.assertEqual(report["overall_status"], "NON_COMPLIANT")
        mrp_check = next((c for c in report["rule_results"] if c["rule_id"] == "RULE_6_1_E"), None)
        self.assertIsNotNone(mrp_check)
        self.assertEqual(mrp_check["status"], "FAIL")

    def test_sample3_wrong_usp_scan(self):
        res = self.client.post("/api/scan", data={"sample_id": "sample3"})
        self.assertEqual(res.status_code, 200)
        report = res.json()
        usp_check = next((c for c in report["rule_results"] if c["rule_id"] == "RULE_6_11"), None)
        self.assertIsNotNone(usp_check)
        self.assertEqual(usp_check["status"], "FAIL")

    def test_sample4_missing_address_scan(self):
        res = self.client.post("/api/scan", data={"sample_id": "sample4"})
        self.assertEqual(res.status_code, 200)
        report = res.json()
        addr_check = next((c for c in report["rule_results"] if c["rule_id"] == "RULE_6_1_A"), None)
        self.assertIsNotNone(addr_check)
        self.assertEqual(addr_check["status"], "FAIL")

    # ----------------------------------------------------------------------
    # 4. Multi-Image Ingestion & Validation Tests
    # ----------------------------------------------------------------------
    def test_missing_api_key_returns_clear_error(self):
        img_bytes = create_test_image_bytes(120, 120, "blue", "PNG")
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}), patch.object(config, "GEMINI_API_KEY", ""):
            res = self.client.post(
                "/api/scan",
                files={"file": ("single_packet.png", img_bytes, "image/png")},
                headers={"X-Gemini-Api-Key": ""}
            )
            self.assertEqual(res.status_code, 400)
            detail = res.json().get("detail", "")
            self.assertIn("Gemini API Key is missing or invalid", detail)

    def test_single_image_upload_with_extraction(self):
        # Sending single image via legacy 'file' parameter
        img_bytes = create_test_image_bytes(120, 120, "blue", "PNG")
        mock_extracted = LabelExtractor._get_sample_fixture("sample1")
        mock_canonical = mock_extracted.to_canonical(default_panel="front")

        with patch.object(LabelExtractor, "extract_from_images", return_value=(mock_extracted, mock_canonical)):
            res = self.client.post(
                "/api/scan",
                files={"file": ("single_packet.png", img_bytes, "image/png")}
            )
            self.assertEqual(res.status_code, 200)
            report = res.json()
            self.assertEqual(report["brand_name"], "Kurkure")
            self.assertEqual(len(report["images"]), 1)
            self.assertEqual(report["images"][0]["panel"], "front")
            self.assertIsNotNone(report["canonical_data"])

    def test_two_images_multi_upload(self):
        front_bytes = create_test_image_bytes(200, 300, "green", "JPEG")
        back_bytes = create_test_image_bytes(200, 300, "yellow", "JPEG")

        mock_extracted = LabelExtractor._get_sample_fixture("sample1")
        mock_canonical = mock_extracted.to_canonical(default_panel="front")

        files = [
            ("files", ("front_panel.jpg", front_bytes, "image/jpeg")),
            ("files", ("back_panel.jpg", back_bytes, "image/jpeg"))
        ]
        data = {"panel_tags": ["front", "back"]}

        with patch.object(LabelExtractor, "extract_from_images", return_value=(mock_extracted, mock_canonical)):
            res = self.client.post("/api/scan", files=files, data=data)
            self.assertEqual(res.status_code, 200)
            report = res.json()
            self.assertEqual(len(report["images"]), 2)
            self.assertEqual(report["images"][0]["panel"], "front")
            self.assertEqual(report["images"][1]["panel"], "back")

    def test_four_images_multi_upload(self):
        img1 = create_test_image_bytes(100, 100, "red", "PNG")
        img2 = create_test_image_bytes(100, 100, "blue", "PNG")
        img3 = create_test_image_bytes(100, 100, "green", "PNG")
        img4 = create_test_image_bytes(100, 100, "white", "PNG")

        mock_extracted = LabelExtractor._get_sample_fixture("sample1")
        mock_canonical = mock_extracted.to_canonical(default_panel="front")

        files = [
            ("files", ("panel1.png", img1, "image/png")),
            ("files", ("panel2.png", img2, "image/png")),
            ("files", ("panel3.png", img3, "image/png")),
            ("files", ("panel4.png", img4, "image/png"))
        ]
        data = {"panel_tags": ["front", "back", "side", "panel"]}

        with patch.object(LabelExtractor, "extract_from_images", return_value=(mock_extracted, mock_canonical)):
            res = self.client.post("/api/scan", files=files, data=data)
            self.assertEqual(res.status_code, 200)
            report = res.json()
            self.assertEqual(len(report["images"]), 4)
            self.assertListEqual(
                [img["panel"] for img in report["images"]],
                ["front", "back", "side", "panel"]
            )

    def test_max_images_exceeded_rejected(self):
        # 5 images should be rejected with 400 Bad Request
        files = [
            ("files", (f"img_{i}.png", create_test_image_bytes(), "image/png"))
            for i in range(5)
        ]
        res = self.client.post("/api/scan", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Maximum 4 images allowed", res.json().get("detail", ""))

    def test_invalid_mime_type_rejected(self):
        # Disguised text file / executable
        fake_pdf = b"%PDF-1.4 Fake PDF content"
        res = self.client.post(
            "/api/scan",
            files={"file": ("malicious.pdf", fake_pdf, "application/pdf")}
        )
        self.assertEqual(res.status_code, 400)
        detail = res.json().get("detail", "")
        self.assertTrue("invalid MIME type" in detail or "corrupted" in detail)

    def test_corrupted_image_rejected(self):
        # Spoofed image header with junk bytes
        corrupt_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRcorruptedcontent"
        res = self.client.post(
            "/api/scan",
            files={"file": ("corrupt.png", corrupt_bytes, "image/png")}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("corrupted", res.json().get("detail", "").lower())

    def test_image_larger_than_15mb_rejected(self):
        # Simulate oversized payload (16 MB)
        oversized_bytes = b"0" * (16 * 1024 * 1024)
        res = self.client.post(
            "/api/scan",
            files={"file": ("oversized.jpg", oversized_bytes, "image/jpeg")}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("exceeds the 15 MB limit", res.json().get("detail", ""))

    def test_panel_tag_validation(self):
        # Valid tags
        self.assertEqual(validate_panel_tag("front"), "front")
        self.assertEqual(validate_panel_tag("BACK"), "back")
        self.assertEqual(validate_panel_tag("Side"), "side")
        self.assertEqual(validate_panel_tag("panel"), "panel")

        # Invalid tag raises HTTPException(400)
        with self.assertRaises(Exception):
            validate_panel_tag("top_diagonal")

    # ----------------------------------------------------------------------
    # 5. History and PDF Endpoints
    # ----------------------------------------------------------------------
    def test_history_and_analytics_endpoints(self):
        res_h = self.client.get("/api/history")
        self.assertEqual(res_h.status_code, 200)
        history = res_h.json()
        self.assertIsInstance(history, list)

        res_a = self.client.get("/api/analytics")
        self.assertEqual(res_a.status_code, 200)
        analytics = res_a.json()
        self.assertIn("total_inspections", analytics)
        self.assertIn("average_compliance_score", analytics)


if __name__ == "__main__":
    unittest.main()
