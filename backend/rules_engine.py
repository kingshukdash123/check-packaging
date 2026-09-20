import os
import sys
import re
from pathlib import Path
from typing import List, Tuple, Optional

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models import (
    ExtractedLabelData,
    RuleCheckResult,
    USPMathCheck,
    ComplianceReport,
    CanonicalPackagingData,
    UploadedImageMetadata
)


class LegalMetrologyRulesEngine:
    """
    Deterministic Compliance Engine implementing Legal Metrology Act, 2009 
    and Legal Metrology (Packaged Commodities) Rules, 2011 (with amendments).
    """

    @staticmethod
    def evaluate(
        extracted: ExtractedLabelData,
        scan_id: str,
        image_filename: str,
        image_url: str = None,
        canonical_data: Optional[CanonicalPackagingData] = None,
        images: Optional[List[UploadedImageMetadata]] = None
    ) -> ComplianceReport:
        checks: List[RuleCheckResult] = []
        
        # 1. Rule 6(1)(a) - Manufacturer / Packer / Importer Details
        checks.append(LegalMetrologyRulesEngine._check_manufacturer_details(extracted))
        
        # 2. Rule 6(1)(b) - Generic Name of Commodity
        checks.append(LegalMetrologyRulesEngine._check_generic_name(extracted))
        
        # 3. Rule 6(1)(c) - Net Quantity & Metric Units
        checks.append(LegalMetrologyRulesEngine._check_net_quantity(extracted))
        
        # 4. Rule 6(1)(d) - Month & Year of Manufacture / Packing
        checks.append(LegalMetrologyRulesEngine._check_mfg_date(extracted))
        
        # 5. Rule 6(1)(e) - Maximum Retail Price (MRP) & Tax Declaration
        checks.append(LegalMetrologyRulesEngine._check_mrp_format(extracted))
        
        # 6. Rule 6(11) - Unit Sale Price (USP) Requirement & Math Validation
        usp_result, usp_math = LegalMetrologyRulesEngine._check_unit_sale_price(extracted)
        checks.append(usp_result)
        
        # 7. Rule 6(1)(n) - Consumer Care Complete 4-Point Details
        checks.append(LegalMetrologyRulesEngine._check_consumer_care(extracted))
        
        # 8. Rule 6(1)(10) - Country of Origin
        checks.append(LegalMetrologyRulesEngine._check_country_of_origin(extracted))
        
        # 9. Rule 7 & Schedule II - Font Size & Readability
        checks.append(LegalMetrologyRulesEngine._check_font_size_readability(extracted))
        
        # 10. Rule 9 - Language Requirement
        checks.append(LegalMetrologyRulesEngine._check_languages(extracted))
        
        # 11. Allied - FSSAI & Veg/Non-Veg Logo Check (if food)
        checks.append(LegalMetrologyRulesEngine._check_fssai_and_dietary(extracted))

        # Scoring & Aggregation
        passed = sum(1 for c in checks if c.status == "PASS")
        failed = sum(1 for c in checks if c.status == "FAIL")
        warnings = sum(1 for c in checks if c.status == "WARNING")
        total = len(checks)
        
        # Calculate weighted compliance score
        penalty_map = {"CRITICAL": 25, "HIGH": 15, "MEDIUM": 10, "LOW": 5}
        total_penalty = 0
        for c in checks:
            if c.status == "FAIL":
                total_penalty += penalty_map.get(c.severity, 10)
            elif c.status == "WARNING":
                total_penalty += penalty_map.get(c.severity, 10) * 0.4
                
        compliance_score = max(0, min(100, int(100 - total_penalty)))
        
        if failed == 0 and warnings <= 1:
            overall_status = "COMPLIANT"
            summary = f"All mandatory declarations are compliant under Legal Metrology (Packaged Commodities) Rules, 2011. Overall Score: {compliance_score}%."
        elif failed >= 2 or any(c.status == "FAIL" and c.severity == "CRITICAL" for c in checks):
            overall_status = "NON_COMPLIANT"
            summary = f"CRITICAL NON-COMPLIANCES DETECTED: {failed} statutory violations found. Actionable under Section 18/36 of Legal Metrology Act, 2009."
        else:
            overall_status = "FLAGGED_FOR_REVIEW"
            summary = f"Package contains {failed} violation(s) and {warnings} warning(s). Minor corrections or manual inspection recommended."

        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        brand = extracted.brand_name or "Unknown Brand"
        product_name = brand
        if extracted.generic_name:
            product_name = f"{brand} - {extracted.generic_name}"

        return ComplianceReport(
            scan_id=scan_id,
            timestamp=now_str,
            image_filename=image_filename,
            image_url=image_url,
            product_name=product_name,
            brand_name=brand,
            overall_status=overall_status,
            compliance_score=compliance_score,
            summary=summary,
            total_checks=total,
            passed_count=passed,
            failed_count=failed,
            warning_count=warnings,
            rule_results=checks,
            usp_check=usp_math,
            extracted_data=extracted,
            canonical_data=canonical_data or extracted.to_canonical(default_panel="front"),
            images=images or []
        )

    # ------------------ RULE IMPLEMENTATIONS ------------------ #

    @staticmethod
    def _check_manufacturer_details(data: ExtractedLabelData) -> RuleCheckResult:
        has_name = bool(data.manufacturer_name and len(data.manufacturer_name.strip()) > 2)
        has_addr = bool(data.manufacturer_address and len(data.manufacturer_address.strip()) > 5)
        
        # Check packer / importer fallback
        if not has_name and data.packer_name:
            has_name = bool(len(data.packer_name.strip()) > 2)
            has_addr = bool(data.packer_address and len(data.packer_address.strip()) > 5)
            
        declared_str = f"Name: {data.manufacturer_name or 'Not Found'} | Address: {data.manufacturer_address or 'Not Found'}"
        
        if has_name and has_addr:
            return RuleCheckResult(
                rule_id="RULE_6_1_A",
                rule_name="Manufacturer / Packer Name & Complete Address",
                legal_reference="PCR 2011, Rule 6(1)(a)",
                status="PASS",
                severity="HIGH",
                declared_value=declared_str,
                expected_standard="Complete name and physical factory/registered address of manufacturer or packer",
                description="Manufacturer/Packer name and address are prominently and completely declared.",
                remediation_guidance="Compliant. No action required."
            )
        elif has_name and not has_addr:
            return RuleCheckResult(
                rule_id="RULE_6_1_A",
                rule_name="Manufacturer / Packer Name & Complete Address",
                legal_reference="PCR 2011, Rule 6(1)(a)",
                status="FAIL",
                severity="HIGH",
                declared_value=declared_str,
                expected_standard="Complete address including street, city, state, and PIN code",
                description="Manufacturer name is present, but complete postal/factory address is missing or incomplete.",
                remediation_guidance="Print the full physical address of the manufacturing or packing unit on the label."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_A",
                rule_name="Manufacturer / Packer Name & Complete Address",
                legal_reference="PCR 2011, Rule 6(1)(a)",
                status="FAIL",
                severity="HIGH",
                declared_value=declared_str,
                expected_standard="Name and complete physical address of manufacturer/packer",
                description="Missing mandatory manufacturer/packer identification on the label.",
                remediation_guidance="Mandatory declaration under Rule 6(1)(a). Include 'Manufactured by' with full legal entity and address."
            )

    @staticmethod
    def _check_generic_name(data: ExtractedLabelData) -> RuleCheckResult:
        declared = data.generic_name.strip() if data.generic_name else ""
        if declared and len(declared) > 2:
            return RuleCheckResult(
                rule_id="RULE_6_1_B",
                rule_name="Common or Generic Name of Commodity",
                legal_reference="PCR 2011, Rule 6(1)(b)",
                status="PASS",
                severity="MEDIUM",
                declared_value=declared,
                expected_standard="Common or generic name (e.g. Potato Chips, Wafer, Biscuits)",
                description="Generic/common commodity name is present on the principal display panel.",
                remediation_guidance="Compliant."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_B",
                rule_name="Common or Generic Name of Commodity",
                legal_reference="PCR 2011, Rule 6(1)(b)",
                status="FAIL",
                severity="MEDIUM",
                declared_value=data.brand_name or "Not Found",
                expected_standard="Generic commodity description, distinct from brand trade name",
                description="Package only displays brand/trade name without declaring the generic nature of the commodity.",
                remediation_guidance="State the exact generic name of the product (e.g. 'Fried Potato Chips', 'Extruded Snack') under the brand."
            )

    @staticmethod
    def _check_net_quantity(data: ExtractedLabelData) -> RuleCheckResult:
        raw = data.net_quantity_raw.strip() if data.net_quantity_raw else ""
        unit = (data.net_quantity_unit or "").lower().strip()
        val = data.net_quantity_value
        
        valid_units = {"g", "kg", "ml", "l", "n", "u", "m", "cm", "sq m", "sq cm"}
        prohibited_phrases = ["gms", "gms.", "approx", "when packed", "net wt", "net weight", "kilos", "litres"]
        
        has_prohibited = any(p in raw.lower() for p in ["approx", "when packed", "minimum"])
        
        if val is not None and val > 0 and (unit in valid_units or any(u in raw.lower() for u in ["g", "kg", "ml", "l", "n"])):
            if has_prohibited:
                return RuleCheckResult(
                    rule_id="RULE_6_1_C",
                    rule_name="Net Quantity & Standard Metric Units",
                    legal_reference="PCR 2011, Rule 6(1)(c) & Rule 12",
                    status="WARNING",
                    severity="MEDIUM",
                    declared_value=raw,
                    expected_standard="Standard metric unit (g, kg, ml, l, N) without qualifying words like 'approx'",
                    description="Net quantity is present, but contains non-standard qualifying terms.",
                    remediation_guidance="Remove qualifying words like 'approx' or 'when packed'. Use strictly standard symbols 'g' or 'kg'."
                )
            return RuleCheckResult(
                rule_id="RULE_6_1_C",
                rule_name="Net Quantity & Standard Metric Units",
                legal_reference="PCR 2011, Rule 6(1)(c)",
                status="PASS",
                severity="CRITICAL",
                declared_value=raw or f"{val}{unit}",
                expected_standard="Standard metric measurement (e.g., 50 g, 1 kg, 200 ml)",
                description="Net quantity is accurately declared in standard metric units.",
                remediation_guidance="Compliant."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_C",
                rule_name="Net Quantity & Standard Metric Units",
                legal_reference="PCR 2011, Rule 6(1)(c)",
                status="FAIL",
                severity="CRITICAL",
                declared_value=raw or "Not Found",
                expected_standard="Unambiguous net quantity in standard metric units (g, kg, ml, l, N)",
                description="Missing or indecipherable net quantity declaration.",
                remediation_guidance="Declare clear Net Quantity in metric units (e.g. 'Net Quantity: 50 g') in the principal display panel."
            )

    @staticmethod
    def _check_mfg_date(data: ExtractedLabelData) -> RuleCheckResult:
        raw = data.mfg_date_raw or ""
        if not raw:
            # check exp date
            if data.exp_date_raw:
                raw = f"Exp/Best Before: {data.exp_date_raw}"
                
        if raw and len(raw.strip()) >= 4:
            # Check for month/year presence
            has_year = bool(re.search(r'20\d\d|\b\d{2}/\d{2}\b|\b\d{2}/\d{4}\b', raw))
            return RuleCheckResult(
                rule_id="RULE_6_1_D",
                rule_name="Month & Year of Manufacture / Pre-packing / Import",
                legal_reference="PCR 2011, Rule 6(1)(d)",
                status="PASS" if has_year else "WARNING",
                severity="HIGH",
                declared_value=raw,
                expected_standard="Month and year of manufacture/packing (e.g. 08/2024 or Aug 2024)",
                description="Manufacturing / packaging date is declared on the package." if has_year else "Date format is incomplete.",
                remediation_guidance="Compliant." if has_year else "Ensure date contains both month and 4-digit year format (MM/YYYY)."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_D",
                rule_name="Month & Year of Manufacture / Pre-packing / Import",
                legal_reference="PCR 2011, Rule 6(1)(d)",
                status="FAIL",
                severity="HIGH",
                declared_value="Not Found",
                expected_standard="Month and Year of manufacture or packing (e.g. 'Mfg Date: 09/2024')",
                description="Mandatory month & year of manufacture or pre-packing is missing.",
                remediation_guidance="Stamp month and year of packaging clearly (e.g. 'Pkd Date: 09/2024')."
            )

    @staticmethod
    def _check_mrp_format(data: ExtractedLabelData) -> RuleCheckResult:
        raw = data.mrp_raw or ""
        amount = data.mrp_amount
        has_tax = data.mrp_has_inclusive_phrase
        
        if not has_tax and raw:
            has_tax = bool(re.search(r'incl\.?\s*of\s*all\s*taxes|inclusive\s*of\s*all\s*taxes', raw, re.IGNORECASE))
            
        declared_str = raw or (f"Rs. {amount}" if amount else "Not Found")
        
        if amount is not None and amount > 0 and has_tax:
            return RuleCheckResult(
                rule_id="RULE_6_1_E",
                rule_name="Maximum Retail Price (MRP) & Tax Declaration",
                legal_reference="PCR 2011, Rule 6(1)(e)",
                status="PASS",
                severity="CRITICAL",
                declared_value=declared_str,
                expected_standard="MRP Rs. XX.XX (incl. of all taxes) or Maximum Retail Price Rs. XX.XX (inclusive of all taxes)",
                description="MRP is declared in the prescribed statutory format with mandatory tax inclusion clause.",
                remediation_guidance="Compliant."
            )
        elif amount is not None and amount > 0 and not has_tax:
            return RuleCheckResult(
                rule_id="RULE_6_1_E",
                rule_name="Maximum Retail Price (MRP) & Tax Declaration",
                legal_reference="PCR 2011, Rule 6(1)(e)",
                status="FAIL",
                severity="CRITICAL",
                declared_value=declared_str,
                expected_standard="Must include explicit wording '(incl. of all taxes)' or '(inclusive of all taxes)'",
                description="MRP is declared, but the mandatory statutory clause '(incl. of all taxes)' is MISSING.",
                remediation_guidance="Modify price declaration to: 'MRP Rs. XX.XX (incl. of all taxes)' as mandated by Rule 6(1)(e)."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_E",
                rule_name="Maximum Retail Price (MRP) & Tax Declaration",
                legal_reference="PCR 2011, Rule 6(1)(e)",
                status="FAIL",
                severity="CRITICAL",
                declared_value=declared_str,
                expected_standard="MRP Rs. XX.XX (incl. of all taxes)",
                description="Maximum Retail Price is missing, illegible, or not detected.",
                remediation_guidance="Clearly print Maximum Retail Price in Rupees with all taxes included."
            )

    @staticmethod
    def _check_unit_sale_price(data: ExtractedLabelData) -> Tuple[RuleCheckResult, USPMathCheck]:
        mrp = data.mrp_amount
        qty = data.net_quantity_value
        unit = (data.net_quantity_unit or "").lower()
        declared_usp_str = data.unit_sale_price_raw or ""
        declared_usp_val = data.unit_sale_price_value
        
        # Calculate expected USP
        calculated_usp = None
        std_unit = ""
        formula = ""
        is_match = True
        discrepancy = 0.0
        commentary = ""
        
        if mrp is not None and qty is not None and qty > 0:
            if unit in ["g", "gram", "grams"]:
                if qty > 1000:
                    calculated_usp = round((mrp / qty) * 1000, 2)
                    std_unit = "per kg"
                    formula = f"({mrp} / {qty}) * 1000"
                else:
                    calculated_usp = round(mrp / qty, 2)
                    std_unit = "per g"
                    formula = f"{mrp} / {qty}"
            elif unit in ["kg"]:
                calculated_usp = round(mrp / qty, 2)
                std_unit = "per kg"
                formula = f"{mrp} / {qty}"
            elif unit in ["ml", "millilitre"]:
                if qty > 1000:
                    calculated_usp = round((mrp / qty) * 1000, 2)
                    std_unit = "per L"
                    formula = f"({mrp} / {qty}) * 1000"
                else:
                    calculated_usp = round(mrp / qty, 2)
                    std_unit = "per ml"
                    formula = f"{mrp} / {qty}"
            elif unit in ["l", "litre"]:
                calculated_usp = round(mrp / qty, 2)
                std_unit = "per L"
                formula = f"{mrp} / {qty}"
            elif unit in ["n", "u", "item", "piece", "pieces"]:
                calculated_usp = round(mrp / qty, 2)
                std_unit = "per N"
                formula = f"{mrp} / {qty}"

        if declared_usp_val and calculated_usp:
            diff = abs(declared_usp_val - calculated_usp)
            discrepancy = round((diff / calculated_usp) * 100, 2) if calculated_usp > 0 else 0
            if discrepancy > 3.0:
                is_match = False
                commentary = f"Math Discrepancy: Declared USP (Rs {declared_usp_val}) deviates by {discrepancy}% from calculated USP (Rs {calculated_usp} {std_unit})."
            else:
                commentary = f"USP Verified: Declared (Rs {declared_usp_val}) accurately matches calculated rate (Rs {calculated_usp} {std_unit})."
        elif calculated_usp:
            commentary = f"Calculated Reference USP: Rs. {calculated_usp} {std_unit}."
            
        usp_math_obj = USPMathCheck(
            declared_usp=declared_usp_str or (f"Rs. {declared_usp_val}" if declared_usp_val else "Not Declared"),
            calculated_usp=calculated_usp,
            standard_unit=std_unit,
            is_match=is_match,
            discrepancy_percentage=discrepancy,
            formula_used=formula,
            commentary=commentary
        )

        # Rule evaluation: Under 2022 amendments, packages must declare USP
        if declared_usp_str or declared_usp_val:
            if not is_match:
                result = RuleCheckResult(
                    rule_id="RULE_6_11",
                    rule_name="Unit Sale Price (USP) Calculation & Declaration",
                    legal_reference="PCR 2011, Rule 6(11) (2022 Amendment)",
                    status="FAIL",
                    severity="HIGH",
                    declared_value=declared_usp_str or f"Rs. {declared_usp_val}",
                    expected_standard=f"Rs. {calculated_usp} {std_unit} (Formula: MRP / Net Qty)",
                    description=f"Declared Unit Sale Price is mathematically inconsistent with MRP and Net Quantity ({discrepancy}% discrepancy).",
                    remediation_guidance=f"Update Unit Sale Price declaration to exact rate: Rs. {calculated_usp} {std_unit}."
                )
            else:
                result = RuleCheckResult(
                    rule_id="RULE_6_11",
                    rule_name="Unit Sale Price (USP) Calculation & Declaration",
                    legal_reference="PCR 2011, Rule 6(11) (2022 Amendment)",
                    status="PASS",
                    severity="HIGH",
                    declared_value=declared_usp_str or f"Rs. {declared_usp_val} {std_unit}",
                    expected_standard=f"Rs. {calculated_usp} {std_unit}",
                    description="Unit Sale Price is correctly declared and mathematically accurate.",
                    remediation_guidance="Compliant."
                )
        else:
            # Check if Net Qty > 1g/ml where USP is mandatory
            status = "WARNING" if (qty and qty <= 100) else "FAIL"
            result = RuleCheckResult(
                rule_id="RULE_6_11",
                rule_name="Unit Sale Price (USP) Calculation & Declaration",
                legal_reference="PCR 2011, Rule 6(11) (2022 Amendment)",
                status=status,
                severity="HIGH" if status == "FAIL" else "MEDIUM",
                declared_value="Not Declared",
                expected_standard=f"Mandatory USP declaration: Rs. {calculated_usp or 'X.XX'} {std_unit or 'per g/ml/N'}",
                description="Unit Sale Price declaration is missing from the packaging label.",
                remediation_guidance=f"Mandatory under Rule 6(11). Declare 'Unit Sale Price: Rs. {calculated_usp or '0.XX'} {std_unit or 'per g'}'."
            )
            
        return result, usp_math_obj

    @staticmethod
    def _check_consumer_care(data: ExtractedLabelData) -> RuleCheckResult:
        has_phone = bool(data.consumer_care_phone and len(data.consumer_care_phone.strip()) >= 5)
        has_email = bool(data.consumer_care_email and "@" in data.consumer_care_email)
        has_addr = bool(data.consumer_care_address or data.manufacturer_address)
        has_person = bool(data.consumer_care_name_desig)

        channels_present = []
        if has_phone: channels_present.append(f"Phone: {data.consumer_care_phone}")
        if has_email: channels_present.append(f"Email: {data.consumer_care_email}")
        if has_addr: channels_present.append("Address: Provided")
        if has_person: channels_present.append(f"Contact: {data.consumer_care_name_desig}")

        declared_str = " | ".join(channels_present) if channels_present else "None Found"

        # Under Rule 6(1)(n), must have Name/Designation, Address, Telephone, and Email
        if has_phone and has_email and (has_addr or has_person):
            return RuleCheckResult(
                rule_id="RULE_6_1_N",
                rule_name="Consumer Care Details (4-Point Redressal)",
                legal_reference="PCR 2011, Rule 6(1)(n)",
                status="PASS",
                severity="HIGH",
                declared_value=declared_str,
                expected_standard="All 4 points: (1) Contact Person/Designation, (2) Address, (3) Telephone/Toll-Free, (4) Email ID",
                description="Comprehensive consumer grievance channels are declared (Phone, Email & Address).",
                remediation_guidance="Compliant."
            )
        elif has_phone or has_email:
            missing = []
            if not has_email: missing.append("Email ID")
            if not has_phone: missing.append("Telephone Number")
            return RuleCheckResult(
                rule_id="RULE_6_1_N",
                rule_name="Consumer Care Details (4-Point Redressal)",
                legal_reference="PCR 2011, Rule 6(1)(n)",
                status="FAIL",
                severity="HIGH",
                declared_value=declared_str,
                expected_standard="Both Email ID AND Telephone Number are strictly mandatory under Rule 6(1)(n)",
                description=f"Incomplete consumer care details. Missing: {', '.join(missing)}.",
                remediation_guidance=f"Add missing consumer contact channels ({', '.join(missing)}) on the consumer care panel."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_N",
                rule_name="Consumer Care Details (4-Point Redressal)",
                legal_reference="PCR 2011, Rule 6(1)(n)",
                status="FAIL",
                severity="CRITICAL",
                declared_value="Not Found",
                expected_standard="Designation, Postal Address, Toll-Free/Phone No, and Email ID",
                description="No consumer care or grievance redressal details found on the package.",
                remediation_guidance="Provide complete Consumer Care cell details: 'For feedback/complaints contact Consumer Care Exec at Tel: ..., Email: ...'."
            )

    @staticmethod
    def _check_country_of_origin(data: ExtractedLabelData) -> RuleCheckResult:
        origin = data.country_of_origin.strip() if data.country_of_origin else ""
        if origin and len(origin) >= 2:
            return RuleCheckResult(
                rule_id="RULE_6_1_10",
                rule_name="Country of Origin Declaration",
                legal_reference="PCR 2011, Rule 6(1)(10) (2017/2020 Amendment)",
                status="PASS",
                severity="MEDIUM",
                declared_value=f"Country of Origin: {origin}",
                expected_standard="Country of origin or manufacture clearly stated",
                description="Country of origin is clearly declared.",
                remediation_guidance="Compliant."
            )
        else:
            return RuleCheckResult(
                rule_id="RULE_6_1_10",
                rule_name="Country of Origin Declaration",
                legal_reference="PCR 2011, Rule 6(1)(10)",
                status="WARNING",
                severity="MEDIUM",
                declared_value="Not Explicitly Found",
                expected_standard="Explicit 'Country of Origin: India' or country of import",
                description="Explicit country of origin statement not identified.",
                remediation_guidance="Print 'Country of Origin: India' prominently on the label."
            )

    @staticmethod
    def _check_font_size_readability(data: ExtractedLabelData) -> RuleCheckResult:
        qty = data.net_quantity_value or 0
        min_height_mm = 1.0
        if qty <= 50: min_height_mm = 1.0
        elif qty <= 200: min_height_mm = 2.0
        elif qty <= 1000: min_height_mm = 4.0
        else: min_height_mm = 6.0
        
        if data.font_size_adequate is False:
            return RuleCheckResult(
                rule_id="RULE_7_SCHEDULE_II",
                rule_name="Font Size & Principal Display Panel (PDP) Readability",
                legal_reference="PCR 2011, Rule 7, Rule 8 & Schedule II",
                status="WARNING",
                severity="MEDIUM",
                declared_value="Substandard font height / Low contrast",
                expected_standard=f"Minimum numeral/letter height of {min_height_mm}mm for Net Qty of {qty}g/ml",
                description="Font size of mandatory declarations appears below prescribed Schedule II thresholds or has low contrast.",
                remediation_guidance=f"Increase font height of net quantity and MRP numerals to at least {min_height_mm}mm with high background contrast."
            )
        return RuleCheckResult(
            rule_id="RULE_7_SCHEDULE_II",
            rule_name="Font Size & Principal Display Panel (PDP) Readability",
            legal_reference="PCR 2011, Rule 7, Rule 8 & Schedule II",
            status="PASS",
            severity="LOW",
            declared_value=f"Compliant (Prescribed Min: {min_height_mm}mm)",
            expected_standard=f"Minimum {min_height_mm}mm numeral height under Schedule II",
            description="Font size, typography, and contrast meet minimum legibility criteria.",
            remediation_guidance="Compliant."
        )

    @staticmethod
    def _check_languages(data: ExtractedLabelData) -> RuleCheckResult:
        langs = data.detected_languages or ["English"]
        has_official = any(l.lower() in ["english", "hindi", "devanagari"] for l in langs)
        if has_official:
            return RuleCheckResult(
                rule_id="RULE_9",
                rule_name="Language of Declarations",
                legal_reference="PCR 2011, Rule 9",
                status="PASS",
                severity="MEDIUM",
                declared_value=", ".join(langs),
                expected_standard="Hindi in Devanagari script or English",
                description="Declarations are in an official recognized language (English / Hindi).",
                remediation_guidance="Compliant."
            )
        return RuleCheckResult(
            rule_id="RULE_9",
            rule_name="Language of Declarations",
            legal_reference="PCR 2011, Rule 9",
            status="WARNING",
            severity="MEDIUM",
            declared_value=", ".join(langs),
            expected_standard="English or Hindi (Devanagari)",
            description="Mandatory declarations should be in Hindi or English.",
            remediation_guidance="Ensure all mandatory clauses are printed in English or Hindi."
        )

    @staticmethod
    def _check_fssai_and_dietary(data: ExtractedLabelData) -> RuleCheckResult:
        has_fssai = bool(data.fssai_lic_no and len(re.sub(r'\D', '', data.fssai_lic_no)) >= 10)
        veg_status = data.veg_nonveg_status or "None"
        
        desc_list = []
        if has_fssai: desc_list.append(f"FSSAI Lic No: {data.fssai_lic_no}")
        if veg_status and veg_status != "None": desc_list.append(f"Dietary: {veg_status}")
        
        declared_str = " | ".join(desc_list) if desc_list else "Not Found"
        
        if has_fssai:
            return RuleCheckResult(
                rule_id="ALLIED_FSSAI",
                rule_name="FSSAI License & Dietary Logo (Food Packaging)",
                legal_reference="FSSAI (Packaging & Labelling) Regulations & Legal Metrology Harmonization",
                status="PASS",
                severity="LOW",
                declared_value=declared_str,
                expected_standard="14-digit FSSAI License No & Green/Brown Veg/Non-Veg Dot Symbol",
                description="FSSAI license number and dietary indicator identified.",
                remediation_guidance="Compliant."
            )
        else:
            return RuleCheckResult(
                rule_id="ALLIED_FSSAI",
                rule_name="FSSAI License & Dietary Logo (Food Packaging)",
                legal_reference="FSSAI (Packaging & Labelling) Regulations",
                status="INFO",
                severity="LOW",
                declared_value=declared_str,
                expected_standard="14-digit FSSAI License Number (For food commodities)",
                description="FSSAI license number not detected on this panel.",
                remediation_guidance="If this is a food commodity, display the 14-digit FSSAI license number and Veg/Non-Veg symbol."
            )
