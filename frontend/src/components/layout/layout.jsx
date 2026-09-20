import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import {
  ApiKeyModal,
  AuditHistoryModal
} from '../modals/index.js';

/**
 * Layout Component
 * Encapsulates the application shell, responsive sidebar toggle/collapse logic,
 * header actions, and sidebar dialog modals (History, Settings/API Key).
 */
export default function Layout({
  children,
  scanner = {},
  ...props
}) {
  // Self-contained sidebar responsive & collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('LMPC_SIDEBAR_COLLAPSED') === 'true';
  });

  // Modal dialog states triggered directly from the sidebar
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('LMPC_SIDEBAR_COLLAPSED', String(next));
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(prev => !prev);
    } else {
      handleToggleCollapse();
    }
  };

  // Merge scanner instance with any direct props for flexibility
  const s = { ...scanner, ...props };

  return (
    <div className="bg-background text-on-surface font-sans antialiased h-screen max-h-screen flex flex-row overflow-hidden">
      {/* Sidebar Component: Fixed 100vh */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onNewScan={s.handleNewScan}
        recentScans={s.recentScans}
        onSelectRecentScan={s.handleSelectRecentScan}
        samplesList={s.samplesList}
        onSelectSample={s.handleSelectSample}
        activeReport={s.activeReport}
        activeSampleId={s.activeSampleId}
        backendStatus={s.backendStatus}
        hasApiKey={Boolean(s.apiKey)}
      />

      {/* Main Column (Right Part): Fixed height 100vh and scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onExportPdf={s.handleExportPdf}
          activeReport={s.activeReport}
        />

        <main className="flex-1 w-full bg-background p-4 sm:p-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Modals triggered from Sidebar */}
      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectScanId={(scanId) => {
          setIsHistoryOpen(false);
          s.handleSelectRecentScan?.(scanId);
        }}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        apiKey={s.apiKey}
        onSaveApiKey={s.handleSaveApiKey}
      />
    </div>
  );
}