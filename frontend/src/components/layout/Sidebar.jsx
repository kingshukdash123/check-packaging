import React from 'react';

/**
 * Sidebar Component
 * Minimal, professional Legal Metrology navigation shell.
 * Theme: White / Light theme matching the application UI.
 * Features:
 * - Single collapse control (managed via Main Header, with tooltip icons when collapsed)
 * - "New Inspection" as primary action
 * - Clean hierarchy for Sample Packages and Recent Inspections
 * - Uncluttered interface without unnecessary badges or non-functional analytics
 */
export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onOpenHistory,
  onOpenApiKey,
  onNewScan,
  recentScans = [],
  onSelectRecentScan,
  samplesList = [],
  onSelectSample,
  activeReport,
  activeSampleId,
  backendStatus = true,
  hasApiKey = false
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed height 100vh on desktop and mobile */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 h-screen max-h-screen overflow-hidden bg-surface-container-lowest text-on-surface border-r border-outline-variant/30 flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none shadow-xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-64 w-64'}`}
      >
        {/* Top Branding Section */}
        <div
          className={`py-3.5 border-b border-outline-variant/30 flex items-center transition-all duration-200 ${
            isCollapsed
              ? 'px-2 justify-center'
              : 'px-4 justify-between'
          }`}
        >
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            onClick={isCollapsed ? onToggleCollapse : undefined}
            title={isCollapsed ? 'Legal Metrology — Click to expand' : 'Legal Metrology Compliance'}
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">policy</span>
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold text-on-surface tracking-tight truncate block leading-tight">
                  Legal Metrology
                </span>
                <span className="text-[10px] text-outline font-medium tracking-tight block">
                  PCR 2011 Compliance
                </span>
              </div>
            )}
          </div>

          {/* Mobile Drawer Close Button (Only on small screens) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Primary Action & Navigation */}
        <div className={`py-3 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {/* Primary Sidebar Action: New Inspection */}
          <button
            onClick={() => {
              onNewScan?.();
              if (window.innerWidth < 1024) onClose?.();
            }}
            title="New Inspection"
            className={`w-full flex items-center rounded-xl font-semibold transition-all cursor-pointer shadow-xs ${
              isCollapsed
                ? 'justify-center p-2.5 bg-primary hover:bg-on-primary-fixed-variant text-white'
                : 'gap-2 px-3 py-2 bg-primary hover:bg-on-primary-fixed-variant text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base text-primary-fixed shrink-0">add_circle</span>
            {!isCollapsed && <span className="text-xs font-bold tracking-wide">New Inspection</span>}
          </button>

          {/* Secondary Nav: Audit History */}
          <button
            onClick={() => {
              onOpenHistory?.();
              if (window.innerWidth < 1024) onClose?.();
            }}
            title="Inspection History"
            className={`w-full flex items-center rounded-xl text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer ${
              isCollapsed
                ? 'justify-center p-2.5'
                : 'justify-between px-3 py-2'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-base text-outline shrink-0">
                history
              </span>
              {!isCollapsed && <span className="truncate">Inspection History</span>}
            </div>
          </button>
        </div>

        {/* Sample Packages Section */}
        {!isCollapsed ? (
          samplesList && samplesList.length > 0 && (
            <div className="px-3 pt-2 pb-2 border-t border-outline-variant/30">
              <div className="px-2 pt-1 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  Sample Packages
                </span>
                <span className="text-[10px] text-outline font-mono bg-surface-container-low px-1.5 py-0.2 rounded">
                  {samplesList.length}
                </span>
              </div>
              <div className="space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
                {samplesList.map((sample) => {
                  const isSelected = activeSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onSelectSample?.(sample.id);
                        if (window.innerWidth < 1024) onClose?.();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      }`}
                      title={sample.expected_verdict || sample.title}
                    >
                      <span className="truncate flex-1">
                        {sample.title?.split('-')[0]?.trim() || sample.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-low text-outline shrink-0 font-medium">
                        {sample.category || 'Preset'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Collapsed Mini Tooltip Trigger for Samples */
          <div className="flex flex-col items-center py-2 border-t border-outline-variant/30">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Sample Packages (Click to expand)"
            >
              <span className="material-symbols-outlined text-base">inventory_2</span>
            </button>
          </div>
        )}

        {/* Recent Inspections Section */}
        {!isCollapsed ? (
          <div className="flex-1 flex flex-col min-h-0 px-3 pt-2 border-t border-outline-variant/30">
            <div className="px-2 pt-1 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                Recent Inspections
              </span>
              {recentScans.length > 0 && (
                <span className="text-[10px] text-outline font-mono bg-surface-container-low px-1.5 py-0.2 rounded">
                  {recentScans.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {recentScans.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-outline italic">
                  No recent inspections yet.
                </div>
              ) : (
                recentScans.map((scan) => {
                  const isActive =
                    activeReport?.scan_id === scan.scan_id ||
                    (activeReport?.product_name && scan.product_name === activeReport.product_name);

                  return (
                    <button
                      key={scan.scan_id}
                      onClick={() => {
                        onSelectRecentScan?.(scan.scan_id);
                        if (window.innerWidth < 1024) onClose?.();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      }`}
                      title={scan.product_name}
                    >
                      <span className="truncate flex-1">
                        {scan.product_name || `Scan #${scan.scan_id?.slice(0, 8)}`}
                      </span>
                      {scan.compliance_score !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                            scan.compliance_score >= 90
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : scan.compliance_score >= 75
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {Math.round(scan.compliance_score)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Mini Tooltip Trigger for Recents */
          <div className="flex-1 flex flex-col items-center py-2 border-t border-outline-variant/30">
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Recent Inspections"
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
            </button>
          </div>
        )}

        {/* Bottom System Health & Settings */}
        <div className={`p-2.5 border-t border-outline-variant/30 bg-surface-container-lowest text-[11px] ${
          isCollapsed ? 'flex flex-col items-center gap-2' : ''
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1 rounded bg-surface-container-low/70 border border-outline-variant/20">
              <div className="flex items-center gap-2 min-w-0" title="PCR 2011 Automated Inspection Engine">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    backendStatus ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-on-surface font-medium text-xs truncate">PCR 2011 Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenApiKey}
                  className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  title="Configure Gemini API Key"
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="p-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-center cursor-pointer"
                title={backendStatus ? 'PCR 2011 Engine Active' : 'PCR Engine Offline'}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    backendStatus ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={onOpenApiKey}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                title="Configure Gemini API Key"
              >
                <span className="material-symbols-outlined text-sm">key</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}