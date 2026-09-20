import React from 'react';

/**
 * Right Column Inspection Summary Aside Component
 * Conditionally renders:
 * 1. Empty State (No media attached yet)
 * 2. Media Ready State (Media uploaded, ready to analyze)
 * 3. Processing State (Active scan in progress)
 * 4. Active Report State (Completed statutory inspection summary)
 */
export default function InspectionSummaryAside({ scanner, ...directProps }) {
  const s = scanner || directProps;
  const {
    score,
    productName,
    decl = {},
    activeReport,
    rules = [],
    hasMedia,
    isScanning,
    handleExportPdf,
    onExportPdf
  } = s;

  const exportHandler = handleExportPdf || onExportPdf;

  // Case 1: Active inspection report is loaded and verified
  if (activeReport && !isScanning) {
    return (
      <aside className="space-y-5">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface">Inspection Summary</h3>
            {score >= 90 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed">
                Compliant
              </span>
            ) : score >= 75 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Review Required
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error-container text-on-error-container">
                Non-Compliant
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-outline">Screening Score:</span>
              <span className="font-bold text-on-surface font-mono">{score} / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Product:</span>
              <span className="font-bold text-on-surface truncate max-w-[170px] text-right" title={productName}>
                {productName || 'Unspecified Product'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Category:</span>
              <span className="font-medium text-on-surface">{decl.commodity_category || 'Food / FMCG'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Images Evaluated:</span>
              <span className="font-medium text-on-surface">
                {activeReport?.images?.length || 1} Surface(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Checks Evaluated:</span>
              <span className="font-medium text-on-surface">
                {rules.length > 0 ? `${rules.length} Rules` : '10 Rules'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={exportHandler}
              className="w-full py-2 bg-primary hover:bg-on-primary-fixed-variant text-surface-container-lowest font-bold text-xs rounded transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Generate PDF Report</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Case 2: Scan is actively running (Processing State)
  if (isScanning) {
    return (
      <aside className="space-y-5">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface">Inspection Summary</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed animate-pulse">
              Processing
            </span>
          </div>

          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-container text-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl animate-spin">refresh</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Analyzing Commodity Package...</p>
              <p className="text-[11px] text-outline mt-1 leading-relaxed">
                Extracting statutory declarations & running PCR 2011 rule engine.
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Case 3: Media uploaded, waiting for user to click "Analyze Package" (Preview State)
  if (hasMedia) {
    return (
      <aside className="space-y-5">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface">Inspection Summary</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed">
              Media Ready
            </span>
          </div>

          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-container text-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Package Surfaces Attached</p>
              <p className="text-[11px] text-outline mt-1 leading-relaxed">
                Click &quot;Analyze Package&quot; in the workspace to evaluate declarations against Legal Metrology Rules, 2011.
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Case 4: Initial Clean State (No media uploaded yet)
  return (
    <aside className="space-y-5">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface">Inspection Summary</h3>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container text-outline">
            Awaiting Media
          </span>
        </div>

        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-container text-outline mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">document_scanner</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">No Inspection in Progress</p>
            <p className="text-[11px] text-outline mt-1 leading-relaxed">
              Upload commodity packaging images or select a preset sample from the sidebar to view statutory compliance metrics.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
