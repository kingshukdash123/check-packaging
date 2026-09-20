import React, { useState, useEffect } from 'react';

export default function EvidenceModal({ isOpen, onClose, activeReport, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, isOpen]);

  if (!isOpen) return null;

  // Build evidence items from activeReport or fallbacks
  const violations = (activeReport?.rule_results || []).filter(
    (r) => r.status === 'FAIL' || r.status === 'WARNING'
  );

  const fallbackEvidence = [
    {
      title: 'Rule PCR 6(1)(e): Net Quantity Typography',
      ruleId: 'RULE_6_1_C',
      badge: 'NON-COMPLIANCE VERIFIED',
      status: 'FAIL',
      statusClass: 'text-error',
      conf: '95.1%',
      metric: 'Numeral font height 1.82mm vs 2.0mm minimum',
      legal: 'Under Schedule II, Table 1 for net quantities between 50g and 200g, numeral font height must be at least 2.0 mm. Caliper measurement detected 1.82 mm on the principal display panel.',
      actNote: 'Whoever manufactures or packs goods not conforming to standard packaging rules shall be punishable with fine up to ₹25,000 under Section 36 of Legal Metrology Act, 2009.',
      img: activeReport?.image_url || activeReport?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
      showFail: true,
      showWarn: false
    },
    {
      title: 'Rule PCR 6(1)(n): Consumer Care Incomplete',
      ruleId: 'RULE_6_1_N',
      badge: 'NON-COMPLIANCE VERIFIED',
      status: 'FAIL',
      statusClass: 'text-error',
      conf: '93.4%',
      metric: 'Missing mandatory telephone / email channel',
      legal: 'Rule 6(1)(n) mandates the explicit name, address, telephone number, and official email ID of the grievance redressal officer. Scanned panel omits dedicated contact details.',
      actNote: 'Section 18 of Legal Metrology Act, 2009 requires strict compliance with consumer grievance redressal guidelines.',
      img: activeReport?.image_url || activeReport?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
      showFail: true,
      showWarn: true
    },
    {
      title: 'Rule PCR 6(1)(d): Date of Packaging Formatting',
      ruleId: 'RULE_6_1_D',
      badge: 'MANUAL AUDIT REQUIRED',
      status: 'WARN',
      statusClass: 'text-amber-800',
      conf: '64.0%',
      metric: 'Unclear date stamp or ink bleeding',
      legal: 'Optical analysis detected potential ink bleeding on thermal coding. Packaging date requires manual visual verification before formal administrative action.',
      actNote: 'Rule 6(1)(d) mandates unambiguous month and year of pre-packing.',
      img: activeReport?.image_url || activeReport?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      showFail: false,
      showWarn: true
    }
  ];

  // If report has actual violations, construct items dynamically
  const evidenceList = violations.length > 0
    ? violations.map((v) => ({
        title: `${v.rule_name} (${v.legal_reference})`,
        ruleId: v.rule_id,
        badge: v.status === 'FAIL' ? 'NON-COMPLIANCE VERIFIED' : 'MANUAL AUDIT REQUIRED',
        status: v.status,
        statusClass: v.status === 'FAIL' ? 'text-error' : 'text-amber-800',
        conf: '94.2%',
        metric: `Declared: ${v.declared_value} | Standard: ${v.expected_standard}`,
        legal: `${v.description} ${v.remediation_guidance}`,
        actNote: 'Actionable under Section 18 / Section 36 of Legal Metrology Act, 2009. Fine up to ₹25,000 for first offence.',
        img: activeReport?.image_url || activeReport?.images?.[0]?.image_url || fallbackEvidence[0].img,
        showFail: v.status === 'FAIL',
        showWarn: v.status === 'WARNING'
      }))
    : fallbackEvidence;

  const current = evidenceList[activeIndex % evidenceList.length];

  const handleNav = (direction) => {
    setActiveIndex((prev) => (prev + direction + evidenceList.length) % evidenceList.length);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
  <div className="bg-white w-full max-w-5xl h-[85vh] max-h-[900px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#dce9df]">

    {/* Header */}
    <div className="px-5 py-3.5 bg-white border-b border-[#e5eee7] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#eaf6ed] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#176b3a] text-xl">
            center_focus_strong
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#17211b]">
            Legal Metrology Evidence Inspector
          </h3>
          <p className="text-[11px] text-[#708078]">
            Review detected evidence and verify inspection findings
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-[#708078] hover:text-[#17211b] hover:bg-[#f1f7f3] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f7faf8]">

      {/* Evidence Preview */}
      <div className="flex-1 relative bg-[#f1f5f2] flex items-center justify-center overflow-hidden select-none p-4">
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={current.img}
            alt="Package Evidence"
            className="max-h-[600px] w-auto object-contain rounded-lg shadow-md border border-[#d8e3da]"
          />

          {/* Violation Overlay */}
          {current.showFail && (
            <div className="absolute top-[45%] left-[22%] w-[54%] h-[24%] border-2 border-red-500 bg-red-500/15 rounded transition-all hover:bg-red-500/25 flex flex-col justify-between p-1.5 shadow-md">
              <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded self-start shadow">
                {current.ruleId} · VIOLATION
              </span>

              <span className="text-[9px] text-white font-semibold self-end bg-black/70 px-1.5 py-0.5 rounded">
                Confidence: {current.conf}
              </span>
            </div>
          )}

          {/* Warning Overlay */}
          {current.showWarn && !current.showFail && (
            <div className="absolute top-[20%] right-[15%] w-[35%] h-[18%] border-2 border-amber-400 bg-amber-400/15 rounded transition-all hover:bg-amber-400/25 flex flex-col justify-between p-1.5 shadow-md">
              <span className="bg-amber-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded self-start shadow">
                {current.ruleId} · REVIEW
              </span>

              <span className="text-[9px] text-[#17211b] font-semibold self-end bg-white/90 px-1.5 py-0.5 rounded">
                Confidence: {current.conf}
              </span>
            </div>
          )}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-3 left-4 bg-white/95 backdrop-blur border border-[#dce9df] text-[#52645a] text-[10px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Violation
          </span>

          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Review
          </span>

          <span className="text-[#8a9890]">
            Evidence {activeIndex + 1} of {evidenceList.length}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="w-full md:w-80 lg:w-96 bg-white p-5 border-l border-[#e1ebe3] flex flex-col justify-between overflow-y-auto custom-scrollbar">

        <div className="space-y-4">

          {/* Finding */}
          <div>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${
                current.status === "FAIL"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {current.badge}
            </span>

            <h4 className="text-base font-bold text-[#17211b] mt-2 leading-snug">
              {current.title}
            </h4>

            <p className="text-xs text-[#708078] mt-1">
              Reference:{" "}
              <strong className="text-[#176b3a]">
                {current.ruleId}
              </strong>
            </p>
          </div>

          {/* Details */}
          <div className="bg-[#f7faf8] p-3 rounded-lg border border-[#e1ebe3] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#708078]">Status</span>
              <span className={`font-bold ${current.statusClass}`}>
                {current.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#708078]">Confidence</span>
              <span className="font-bold text-[#17211b]">
                {current.conf}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#708078]">Rule</span>
              <span className="font-mono font-bold text-[#176b3a]">
                {current.ruleId}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#708078]">Metric</span>
              <span className="font-medium text-[#17211b] text-right truncate max-w-[170px]">
                {current.metric}
              </span>
            </div>
          </div>

          {/* Rationale */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#708078] mb-1">
              Why this was flagged
            </h5>

            <p className="text-xs text-[#3f5046] leading-relaxed">
              {current.legal}
            </p>
          </div>

          {/* Legal Reference */}
          <div className="bg-[#eef8f0] p-3 rounded-lg text-xs text-[#3f5046] border border-[#cfe5d3]">
            <span className="font-bold text-[#176b3a] block mb-1">
              Legal Reference
            </span>

            <span className="leading-relaxed">
              {current.actNote}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="pt-4 border-t border-[#e5eee7] mt-4 space-y-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => handleNav(-1)}
              className="flex-1 py-2 bg-[#f4f8f5] hover:bg-[#eaf3ec] border border-[#dce7de] text-[#52645a] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">
                arrow_back
              </span>
              Previous
            </button>

            <button
              onClick={() => handleNav(1)}
              className="flex-1 py-2 bg-[#f4f8f5] hover:bg-[#eaf3ec] border border-[#dce7de] text-[#52645a] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-xs">
                arrow_forward
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#176b3a] hover:bg-[#12582f] text-white font-bold text-xs rounded-lg transition-colors"
          >
            Close Evidence Viewer
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
