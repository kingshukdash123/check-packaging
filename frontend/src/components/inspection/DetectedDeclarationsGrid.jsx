import React from 'react';

/**
 * Detected Statutory Declarations Grid Component (PCR Rule 6)
 */
export default function DetectedDeclarationsGrid({ scanner, ...directProps }) {
  const s = scanner || directProps;
  const { decl = {}, productName, getRuleResult } = s;

  // Net Quantity
  const netQtyRule = getRuleResult?.('RULE_6_1_C');
  const netQuantity = decl.net_quantity_raw || (decl.net_quantity_value ? `${decl.net_quantity_value} ${decl.net_quantity_unit || 'g'}` : 'Not Declared');

  // MRP
  const mrpRule = getRuleResult?.('RULE_6_1_E_MRP');
  const mrpText = decl.mrp_raw || (decl.mrp_amount ? `₹${decl.mrp_amount}` : 'Not Declared');

  // Manufacturer
  const mfrRule = getRuleResult?.('RULE_6_1_A');
  const manufacturer = decl.manufacturer_name || 'Not Declared';

  // Packaging Date
  const dateRule = getRuleResult?.('RULE_6_1_D');
  const mfgDate = decl.mfg_date_raw || decl.exp_date_raw || 'Not Declared';

  // Country of Origin
  const countryOrigin = decl.country_of_origin || 'India';

  // Consumer Care
  const careRule = getRuleResult?.('RULE_6_1_N');
  let consumerCare = 'Missing Phone/Email';
  if (decl.consumer_care_phone && decl.consumer_care_email) {
    consumerCare = `${decl.consumer_care_phone} | ${decl.consumer_care_email}`;
  } else if (decl.consumer_care_phone) {
    consumerCare = decl.consumer_care_phone;
  } else if (decl.consumer_care_email) {
    consumerCare = decl.consumer_care_email;
  }

  // FSSAI / Dietary
  const fssaiNumber = decl.fssai_lic_no ? `${decl.fssai_lic_no} (${decl.veg_nonveg_status || 'Veg'})` : (decl.veg_nonveg_status ? `Mark: ${decl.veg_nonveg_status}` : 'Not Declared');

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">fact_check</span>
          <span>Detected Declarations (PCR Rule 6)</span>
        </h4>
        <span className="text-[11px] text-outline font-medium">
          {Object.keys(decl).length > 0 ? 'Live Extracted Fields' : 'Default Model Fields'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Product Name */}
        <div className="p-2.5 rounded bg-surface-bright border border-outline-variant/30 flex items-center justify-between">
          <span className="text-outline">Product Name:</span>
          <span className="font-bold text-on-surface flex items-center gap-1 truncate max-w-[200px]" title={productName}>
            {productName} <span className="text-secondary font-bold">✓</span>
          </span>
        </div>

        {/* Net Quantity */}
        <div className={`p-2.5 rounded border flex items-center justify-between ${
          netQtyRule?.status === 'FAIL'
            ? 'bg-error-container/20 border-error/40'
            : netQtyRule?.status === 'WARNING'
            ? 'bg-amber-50/50 border-amber-300'
            : 'bg-surface-bright border-outline-variant/30'
        }`}>
          <span className="text-outline">Net Quantity:</span>
          <span className="font-bold text-on-surface flex items-center gap-1">
            {netQuantity}
            {netQtyRule?.status === 'FAIL' ? (
              <span className="text-error font-bold">✕ Violates Rule 6(1)(c)</span>
            ) : netQtyRule?.status === 'WARNING' ? (
              <span className="text-amber-700 font-semibold">⚠ Review</span>
            ) : (
              <span className="text-secondary font-bold">✓</span>
            )}
          </span>
        </div>

        {/* MRP */}
        <div className={`p-2.5 rounded border flex items-center justify-between ${
          mrpRule?.status === 'FAIL'
            ? 'bg-error-container/20 border-error/40'
            : 'bg-surface-bright border-outline-variant/30'
        }`}>
          <span className="text-outline">MRP:</span>
          <span className="font-bold text-on-surface flex items-center gap-1">
            {mrpText}
            {mrpRule?.status === 'FAIL' ? (
              <span className="text-error font-bold" title={mrpRule.description}>✕ Missing Taxes</span>
            ) : (
              <span className="text-secondary font-bold">✓</span>
            )}
          </span>
        </div>

        {/* Manufacturer */}
        <div className={`p-2.5 rounded border flex items-center justify-between ${
          mfrRule?.status === 'FAIL'
            ? 'bg-error-container/20 border-error/40'
            : 'bg-surface-bright border-outline-variant/30'
        }`}>
          <span className="text-outline">Manufacturer:</span>
          <span className="font-bold text-on-surface truncate max-w-[160px] flex items-center gap-1" title={manufacturer}>
            {manufacturer}
            {mfrRule?.status === 'FAIL' ? (
              <span className="text-error font-bold">✕ Incomplete</span>
            ) : (
              <span className="text-secondary font-bold">✓</span>
            )}
          </span>
        </div>

        {/* Date of Packaging */}
        <div className={`p-2.5 rounded border flex items-center justify-between ${
          dateRule?.status === 'WARNING'
            ? 'bg-amber-50/50 border-amber-300'
            : dateRule?.status === 'FAIL'
            ? 'bg-error-container/20 border-error/40'
            : 'bg-surface-bright border-outline-variant/30'
        }`}>
          <span className="text-outline">Date of Packaging:</span>
          <span className="font-bold text-on-surface flex items-center gap-1">
            {mfgDate}
            {dateRule?.status === 'WARNING' ? (
              <span className="text-amber-700 font-semibold">⚠ Review</span>
            ) : dateRule?.status === 'FAIL' ? (
              <span className="text-error font-bold">✕ Missing</span>
            ) : (
              <span className="text-secondary font-bold">✓</span>
            )}
          </span>
        </div>

        {/* Country of Origin */}
        <div className="p-2.5 rounded bg-surface-bright border border-outline-variant/30 flex items-center justify-between">
          <span className="text-outline">Country of Origin:</span>
          <span className="font-bold text-on-surface flex items-center gap-1">
            {countryOrigin} <span className="text-secondary font-bold">✓</span>
          </span>
        </div>

        {/* Consumer Care */}
        <div className={`p-2.5 rounded border flex items-center justify-between ${
          careRule?.status === 'FAIL'
            ? 'bg-error-container/20 border-error/40'
            : 'bg-surface-bright border-outline-variant/30'
        }`}>
          <span className="text-outline">Consumer Care:</span>
          <span className={`font-bold flex items-center gap-1 truncate max-w-[170px] ${
            careRule?.status === 'FAIL' ? 'text-error' : 'text-on-surface'
          }`} title={consumerCare}>
            {consumerCare}
            {careRule?.status === 'FAIL' ? (
              <span className="text-error font-bold">✕ Missing</span>
            ) : (
              <span className="text-secondary font-bold">✓</span>
            )}
          </span>
        </div>

        {/* FSSAI License / USP */}
        <div className="p-2.5 rounded bg-surface-bright border border-outline-variant/30 flex items-center justify-between">
          <span className="text-outline">FSSAI / Standard:</span>
          <span className="font-bold text-on-surface flex items-center gap-1 truncate max-w-[160px]" title={fssaiNumber}>
            {fssaiNumber} <span className="text-secondary font-bold">✓</span>
          </span>
        </div>
      </div>
    </div>
  );
}
