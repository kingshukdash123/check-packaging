import React from 'react';

export default function Header({
  onToggleSidebar,
  isSidebarCollapsed,
  activeReport
}) {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-outline-variant/30 bg-surface-container-lowest px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-30 shadow-sm">
      {/* Left: Sidebar Toggle + Breadcrumb / Active Commodity */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle for Mobile or Desktop */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Toggle sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {isSidebarCollapsed ? 'left_panel_open' : 'menu'}
          </span>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-on-surface text-base font-bold leading-tight tracking-[-0.015em]">
              AI Compliance Assistant
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed">
              PCR 2011
            </span>
          </div>
          <p className="text-xs text-outline font-medium">
            {activeReport?.product_name
              ? `Auditing: ${activeReport.product_name}`
              : 'Automated Legal Metrology Compliance Inspection'}
          </p>
        </div>
      </div>

      
    </header>
  );
}
