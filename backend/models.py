from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator


class FieldObservation(BaseModel):
    """
    Canonical unit of observed information extracted from packaging panels.
    Decouples observation from regulatory compliance decisions.
    """
    value: Any = Field(default=None, description="Normalized typed value (e.g. float, string, bool)")
    raw_text: str = Field(default="", description="Verbatim text observed on packaging")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)")
    source_image: str = Field(default="front", description="Panel tag: 'front', 'back', 'side', 'panel'")
    evidence_text: Optional[str] = Field(default=None, description="Surrounding contextual text snippet")


class UploadedImageMetadata(BaseModel):
    """
    Internal representation of uploaded packaging panel images.
    """
    filename: str
    panel: str = Field(default="front", description="'front', 'back', 'side', or 'panel'")
    mime_type: str = Field(default="image/jpeg")
    size_bytes: int = Field(default=0)
    width: Optional[int] = None
    height: Optional[int] = None
    image_url: Optional[str] = None


class CanonicalPackagingData(BaseModel):
    """
    Canonical structured observation contract for Legal Metrology compliance checking.
    """
    # IDENTITY
    brand_name: FieldObservation = Field(
        default_factory=lambda: FieldObservation(value="Unknown Brand", raw_text="Unknown Brand", source_image="front")
    )
    generic_name: Optional[FieldObservation] = None
    commodity_category: FieldObservation = Field(
        default_factory=lambda: FieldObservation(value="Food / FMCG", raw_text="Food / FMCG", source_image="front")
    )

    # MANUFACTURER / PACKER / IMPORTER (Rule 6(1)(a))
    manufacturer_name: Optional[FieldObservation] = None
    manufacturer_address: Optional[FieldObservation] = None
    packer_name: Optional[FieldObservation] = None
    packer_address: Optional[FieldObservation] = None
    importer_name: Optional[FieldObservation] = None
    importer_address: Optional[FieldObservation] = None
    country_of_origin: FieldObservation = Field(
        default_factory=lambda: FieldObservation(value="India", raw_text="India", source_image="front")
    )

    # NET QUANTITY (Rule 6(1)(c))
    net_quantity_value: Optional[FieldObservation] = None
    net_quantity_unit: Optional[FieldObservation] = None
    net_quantity_qualifiers: Optional[FieldObservation] = None

    # PRICING (Rule 6(1)(e) & Rule 6(11))
    mrp_amount: Optional[FieldObservation] = None
    mrp_tax_inclusive: Optional[FieldObservation] = None
    declared_usp_amount: Optional[FieldObservation] = None
    declared_usp_unit: Optional[FieldObservation] = None

    # DATES / BATCH (Rule 6(1)(d))
    mfg_date: Optional[FieldObservation] = None
    exp_date: Optional[FieldObservation] = None
    batch_number: Optional[FieldObservation] = None

    # CONSUMER CARE (Rule 6(1)(n))
    consumer_care_person: Optional[FieldObservation] = None
    consumer_care_phone: Optional[FieldObservation] = None
    consumer_care_email: Optional[FieldObservation] = None
    consumer_care_address: Optional[FieldObservation] = None

    # FOOD / CATEGORY SPECIFIC
    fssai_license: Optional[FieldObservation] = None
    veg_nonveg_mark: Optional[FieldObservation] = None

    # DISPLAY (Rule 7, 8, 9)
    detected_languages: List[str] = Field(default_factory=lambda: ["English"])
    legibility_adequate: FieldObservation = Field(
        default_factory=lambda: FieldObservation(value=True, raw_text="Adequate", source_image="front")
    )
    raw_ocr_dump: str = ""

    def to_extracted_label_data(self) -> "ExtractedLabelData":
        """Projects canonical observations back into backward-compatible ExtractedLabelData."""
        net_raw = ""
        if self.net_quantity_value and self.net_quantity_value.raw_text:
            net_raw = self.net_quantity_value.raw_text
        elif self.net_quantity_value and self.net_quantity_value.value is not None:
            unit_str = self.net_quantity_unit.value if self.net_quantity_unit else "g"
            net_raw = f"{self.net_quantity_value.value} {unit_str}"

        mrp_raw = ""
        if self.mrp_amount and self.mrp_amount.raw_text:
            mrp_raw = self.mrp_amount.raw_text
        elif self.mrp_amount and self.mrp_amount.value is not None:
            mrp_raw = f"MRP Rs. {self.mrp_amount.value:.2f}"
            if self.mrp_tax_inclusive and self.mrp_tax_inclusive.value:
                mrp_raw += " (incl. of all taxes)"

        return ExtractedLabelData(
            brand_name=self.brand_name.value if self.brand_name and self.brand_name.value else "Unknown Brand",
            generic_name=self.generic_name.value if self.generic_name and self.generic_name.value else "",
            commodity_category=self.commodity_category.value if self.commodity_category and self.commodity_category.value else "Food / FMCG",
            manufacturer_name=self.manufacturer_name.value if self.manufacturer_name and self.manufacturer_name.value else "",
            manufacturer_address=self.manufacturer_address.value if self.manufacturer_address and self.manufacturer_address.value else "",
            packer_name=self.packer_name.value if self.packer_name else None,
            packer_address=self.packer_address.value if self.packer_address else None,
            importer_name=self.importer_name.value if self.importer_name else None,
            importer_address=self.importer_address.value if self.importer_address else None,
            country_of_origin=self.country_of_origin.value if self.country_of_origin and self.country_of_origin.value else "India",
            net_quantity_raw=net_raw,
            net_quantity_value=float(self.net_quantity_value.value) if self.net_quantity_value and self.net_quantity_value.value is not None else None,
            net_quantity_unit=str(self.net_quantity_unit.value) if self.net_quantity_unit and self.net_quantity_unit.value else None,
            mrp_raw=mrp_raw,
            mrp_amount=float(self.mrp_amount.value) if self.mrp_amount and self.mrp_amount.value is not None else None,
            mrp_has_inclusive_phrase=bool(self.mrp_tax_inclusive.value) if self.mrp_tax_inclusive and self.mrp_tax_inclusive.value is not None else False,
            unit_sale_price_raw=self.declared_usp_amount.raw_text if self.declared_usp_amount and self.declared_usp_amount.raw_text else None,
            unit_sale_price_value=float(self.declared_usp_amount.value) if self.declared_usp_amount and self.declared_usp_amount.value is not None else None,
            unit_sale_price_unit=str(self.declared_usp_unit.value) if self.declared_usp_unit and self.declared_usp_unit.value else None,
            mfg_date_raw=str(self.mfg_date.raw_text or self.mfg_date.value) if self.mfg_date else None,
            exp_date_raw=str(self.exp_date.raw_text or self.exp_date.value) if self.exp_date else None,
            batch_or_lot_no=str(self.batch_number.raw_text or self.batch_number.value) if self.batch_number else None,
            consumer_care_name_desig=str(self.consumer_care_person.value) if self.consumer_care_person and self.consumer_care_person.value else None,
            consumer_care_phone=str(self.consumer_care_phone.value) if self.consumer_care_phone and self.consumer_care_phone.value else None,
            consumer_care_email=str(self.consumer_care_email.value) if self.consumer_care_email and self.consumer_care_email.value else None,
            consumer_care_address=str(self.consumer_care_address.value) if self.consumer_care_address and self.consumer_care_address.value else None,
            fssai_lic_no=str(self.fssai_license.value) if self.fssai_license and self.fssai_license.value else None,
            veg_nonveg_status=str(self.veg_nonveg_mark.value) if self.veg_nonveg_mark and self.veg_nonveg_mark.value else None,
            font_size_adequate=bool(self.legibility_adequate.value) if self.legibility_adequate and self.legibility_adequate.value is not None else True,
            principal_display_panel_notes=self.legibility_adequate.evidence_text or "",
            detected_languages=self.detected_languages or ["English"],
            raw_ocr_text=self.raw_ocr_dump or ""
        )


class ExtractedLabelData(BaseModel):
    brand_name: Optional[str] = Field(default="Unknown Brand", description="Brand or trade name")
    generic_name: Optional[str] = Field(default="", description="Common or generic name of commodity (Rule 6(1)(b))")
    commodity_category: Optional[str] = Field(default="Food / FMCG", description="Category of commodity")
    
    # Manufacturer / Packer / Importer (Rule 6(1)(a))
    manufacturer_name: Optional[str] = Field(default="", description="Name of manufacturer")
    manufacturer_address: Optional[str] = Field(default="", description="Complete factory or registered address")
    packer_name: Optional[str] = Field(default=None, description="Name of packer if separate from manufacturer")
    packer_address: Optional[str] = Field(default=None, description="Address of packer")
    importer_name: Optional[str] = Field(default=None, description="Name of importer if imported")
    importer_address: Optional[str] = Field(default=None, description="Address of importer")
    country_of_origin: Optional[str] = Field(default="India", description="Country of manufacture or assembly")
    
    # Net Quantity (Rule 6(1)(c))
    net_quantity_raw: Optional[str] = Field(default="", description="Raw net quantity text as printed on package")
    net_quantity_value: Optional[float] = Field(default=None, description="Parsed numeric net quantity value")
    net_quantity_unit: Optional[str] = Field(default=None, description="Parsed net quantity unit (g, kg, ml, l, N, U)")
    
    # Maximum Retail Price (Rule 6(1)(e))
    mrp_raw: Optional[str] = Field(default="", description="Raw MRP text as printed on label")
    mrp_amount: Optional[float] = Field(default=None, description="Numeric MRP value in INR")
    mrp_has_inclusive_phrase: Optional[bool] = Field(default=False, description="True if 'incl. of all taxes' or 'inclusive of all taxes' is present")
    
    # Unit Sale Price (Rule 6(11))
    unit_sale_price_raw: Optional[str] = Field(default=None, description="Raw declared unit sale price e.g. Rs 0.40/g")
    unit_sale_price_value: Optional[float] = Field(default=None, description="Parsed unit sale price numeric value")
    unit_sale_price_unit: Optional[str] = Field(default=None, description="Unit for USP e.g. g, 100g, kg, ml, 100ml, l, N")
    
    # Dates (Rule 6(1)(d))
    mfg_date_raw: Optional[str] = Field(default=None, description="Month & Year of manufacture or packing")
    exp_date_raw: Optional[str] = Field(default=None, description="Best before or expiry date if printed")
    batch_or_lot_no: Optional[str] = Field(default=None, description="Batch / Lot / Code Number")
    
    # Consumer Care Details (Rule 6(1)(n))
    consumer_care_name_desig: Optional[str] = Field(default=None, description="Name or designation of contact person")
    consumer_care_phone: Optional[str] = Field(default=None, description="Consumer care phone or toll-free number")
    consumer_care_email: Optional[str] = Field(default=None, description="Consumer care email address")
    consumer_care_address: Optional[str] = Field(default=None, description="Consumer care postal address")
    
    # Allied & Regulatory
    fssai_lic_no: Optional[str] = Field(default=None, description="14-digit FSSAI license number if applicable")
    veg_nonveg_status: Optional[str] = Field(default=None, description="'Veg' (Green dot), 'Non-Veg' (Brown dot), or 'None'")
    
    # Display & Readability
    font_size_adequate: Optional[bool] = Field(default=True, description="Whether declarations meet minimum font height guidelines")
    principal_display_panel_notes: Optional[str] = Field(default="", description="Observations on display panel placement and contrast")
    detected_languages: Optional[List[str]] = Field(default_factory=lambda: ["English"], description="Languages detected on the label")
    raw_ocr_text: Optional[str] = Field(default="", description="Full extracted text from label")

    @model_validator(mode="before")
    @classmethod
    def sanitize_null_values(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get("brand_name") is None:
                values["brand_name"] = "Unknown Brand"
            if values.get("generic_name") is None:
                values["generic_name"] = ""
            if values.get("commodity_category") is None:
                values["commodity_category"] = "Food / FMCG"
            if values.get("manufacturer_name") is None:
                values["manufacturer_name"] = ""
            if values.get("manufacturer_address") is None:
                values["manufacturer_address"] = ""
            if values.get("country_of_origin") is None:
                values["country_of_origin"] = "India"
            if values.get("net_quantity_raw") is None:
                values["net_quantity_raw"] = ""
            if values.get("mrp_raw") is None:
                values["mrp_raw"] = ""
            if values.get("mrp_has_inclusive_phrase") is None:
                values["mrp_has_inclusive_phrase"] = False
            if values.get("font_size_adequate") is None:
                values["font_size_adequate"] = True
            if values.get("principal_display_panel_notes") is None:
                values["principal_display_panel_notes"] = ""
            if values.get("detected_languages") is None:
                values["detected_languages"] = ["English"]
            if values.get("raw_ocr_text") is None:
                values["raw_ocr_text"] = ""
        return values

    def to_canonical(self, default_panel: str = "front", default_confidence: float = 1.0) -> CanonicalPackagingData:
        """Converts ExtractedLabelData into canonical structured observations."""
        def make_obs(val, raw=None, conf=default_confidence, panel=default_panel):
            if val is None and (raw is None or raw == ""):
                return None
            raw_str = str(raw if raw is not None and raw != "" else (val if val is not None else ""))
            return FieldObservation(
                value=val,
                raw_text=raw_str,
                confidence=conf,
                source_image=panel,
                evidence_text=raw_str
            )

        return CanonicalPackagingData(
            brand_name=FieldObservation(
                value=self.brand_name or "Unknown Brand",
                raw_text=self.brand_name or "Unknown Brand",
                confidence=default_confidence,
                source_image=default_panel
            ),
            generic_name=make_obs(self.generic_name, self.generic_name),
            commodity_category=FieldObservation(
                value=self.commodity_category or "Food / FMCG",
                raw_text=self.commodity_category or "Food / FMCG",
                confidence=default_confidence,
                source_image=default_panel
            ),
            manufacturer_name=make_obs(self.manufacturer_name, self.manufacturer_name),
            manufacturer_address=make_obs(self.manufacturer_address, self.manufacturer_address),
            packer_name=make_obs(self.packer_name, self.packer_name),
            packer_address=make_obs(self.packer_address, self.packer_address),
            importer_name=make_obs(self.importer_name, self.importer_name),
            importer_address=make_obs(self.importer_address, self.importer_address),
            country_of_origin=FieldObservation(
                value=self.country_of_origin or "India",
                raw_text=self.country_of_origin or "India",
                confidence=default_confidence,
                source_image=default_panel
            ),
            net_quantity_value=make_obs(self.net_quantity_value, self.net_quantity_raw),
            net_quantity_unit=make_obs(self.net_quantity_unit, self.net_quantity_raw),
            net_quantity_qualifiers=None,
            mrp_amount=make_obs(self.mrp_amount, self.mrp_raw),
            mrp_tax_inclusive=make_obs(self.mrp_has_inclusive_phrase, "incl. of all taxes" if self.mrp_has_inclusive_phrase else ""),
            declared_usp_amount=make_obs(self.unit_sale_price_value, self.unit_sale_price_raw),
            declared_usp_unit=make_obs(self.unit_sale_price_unit, self.unit_sale_price_raw),
            mfg_date=make_obs(self.mfg_date_raw, self.mfg_date_raw),
            exp_date=make_obs(self.exp_date_raw, self.exp_date_raw),
            batch_number=make_obs(self.batch_or_lot_no, self.batch_or_lot_no),
            consumer_care_person=make_obs(self.consumer_care_name_desig, self.consumer_care_name_desig),
            consumer_care_phone=make_obs(self.consumer_care_phone, self.consumer_care_phone),
            consumer_care_email=make_obs(self.consumer_care_email, self.consumer_care_email),
            consumer_care_address=make_obs(self.consumer_care_address, self.consumer_care_address),
            fssai_license=make_obs(self.fssai_lic_no, self.fssai_lic_no),
            veg_nonveg_mark=make_obs(self.veg_nonveg_status, self.veg_nonveg_status),
            detected_languages=self.detected_languages or ["English"],
            legibility_adequate=FieldObservation(
                value=self.font_size_adequate if self.font_size_adequate is not None else True,
                raw_text=self.principal_display_panel_notes or "Adequate",
                confidence=default_confidence,
                source_image=default_panel,
                evidence_text=self.principal_display_panel_notes or ""
            ),
            raw_ocr_dump=self.raw_ocr_text or ""
        )


class RuleCheckResult(BaseModel):
    rule_id: str
    rule_name: str
    legal_reference: str
    status: str = Field(description="'PASS', 'FAIL', 'WARNING', or 'INFO'")
    severity: str = Field(description="'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'")
    declared_value: str
    expected_standard: str
    description: str
    remediation_guidance: str


class USPMathCheck(BaseModel):
    declared_usp: Optional[str] = None
    calculated_usp: Optional[float] = None
    standard_unit: str = ""
    is_match: bool = True
    discrepancy_percentage: float = 0.0
    formula_used: str = ""
    commentary: str = ""


class ComplianceReport(BaseModel):
    scan_id: str
    timestamp: str
    image_filename: str
    image_url: Optional[str] = None
    product_name: str
    brand_name: str
    overall_status: str = Field(description="'COMPLIANT', 'NON_COMPLIANT', 'FLAGGED_FOR_REVIEW'")
    compliance_score: int = Field(description="Score between 0 and 100")
    summary: str
    total_checks: int
    passed_count: int
    failed_count: int
    warning_count: int
    rule_results: List[RuleCheckResult]
    usp_check: Optional[USPMathCheck] = None
    extracted_data: ExtractedLabelData
    canonical_data: Optional[CanonicalPackagingData] = None
    images: List[UploadedImageMetadata] = Field(default_factory=list)
    pdf_report_path: Optional[str] = None


class ScanHistoryItem(BaseModel):
    scan_id: str
    timestamp: str
    product_name: str
    brand_name: str
    overall_status: str
    compliance_score: int
    failed_count: int
    image_url: Optional[str] = None
