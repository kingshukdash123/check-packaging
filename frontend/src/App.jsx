import React, { useState } from 'react';
import Layout from './components/layout/layout.jsx';
import { usePackageScanner } from './hooks/usePackageScanner.js';
import MediaUploadSection from './components/upload/MediaUploadSection.jsx';
import {
  ProcessingIndicator,
  AutomatedScorecard,
  PotentialIssuesList,
  DetectedDeclarationsGrid,
  InspectionSummaryAside,
  ChatAssistant
} from './components/inspection/index.js';
import { EvidenceModal } from './components/modals/index.js';
import {
  ToastNotification,
  ErrorBanner,
  HowItWorksSection
} from './components/common/index.js';

/**
 * App Root Component
 * Ultra-clean entry point & composition layer.
 * Zero prop drilling: delegates layout state to Layout and inspection state to feature components.
 */
export default function App() {
  const scanner = usePackageScanner();

  // Modal state for inspecting high-res visual evidence
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [evidenceInitialIndex, setEvidenceInitialIndex] = useState(0);

  const openEvidenceModal = (index = 0) => {
    setEvidenceInitialIndex(index);
    setIsEvidenceOpen(true);
  };

  return (
    <>
      {/* Hidden File Input for Real Image Uploads */}
      <input
        type="file"
        ref={scanner.fileInputRef}
        onChange={scanner.handleFilesChosen}
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Main Application Layout (Encapsulates Sidebar, Header, and Sidebar Modals) */}
      <Layout scanner={scanner}>
        {(() => {
          const hasResults = Boolean(scanner.activeReport && !scanner.isScanning);

          return (
            <div className={`${hasResults ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : ''} max-w-7xl mx-auto items-start`}>
              
              {/* LEFT / MAIN WORKSPACE */}
              <section className={`${hasResults ? 'lg:col-span-8' : ''} space-y-5 w-full`}>
             

                {/* Error Banner */}
                <ErrorBanner message={scanner.errorMsg} onDismiss={() => scanner.setErrorMsg(null)} />

                {/* Media Upload & Preview Section */}
                <MediaUploadSection
                  scanner={scanner}
                  onOpenEvidenceModal={openEvidenceModal}
                />
                  {hasResults || (<HowItWorksSection />)}

                {/* Processing Pipeline Indicator (Active while analysis is in flight) */}
                {scanner.isScanning && (
                  <ProcessingIndicator isScanning={true} />
                )}

                {/* Inspection Results (Only rendered after successful package analysis) */}
                {hasResults && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-outline">
                      <span className="material-symbols-outlined text-base text-primary">task_alt</span>
                      <span>Inspection completed.</span>
                    </div>

                    {/* Automated Screening Scorecard */}
                    <AutomatedScorecard scanner={scanner} />

                    {/* Potential Issues Section */}
                    <PotentialIssuesList
                      potentialIssues={scanner.potentialIssues}
                      onOpenEvidenceModal={openEvidenceModal}
                    />

                    {/* Detected Declarations Grid (PCR Rule 6) */}
                    <DetectedDeclarationsGrid scanner={scanner} />

                    {/* Context-Aware AI Chat Assistant */}
                    <ChatAssistant
                      activeReport={scanner.activeReport}
                      onShowToast={scanner.showToast}
                    />
                  </div>
                )}
              </section>

              
              <aside className={`${hasResults ? 'lg:col-span-4' : 'lg:col-span-5'} w-full space-y-5`}>
               {hasResults && <InspectionSummaryAside scanner={scanner} />}
              </aside>

            </div>
          );
        })()}
      </Layout>

      {/* Visual Inspection Evidence Modal */}
      <EvidenceModal
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        activeReport={scanner.activeReport}
        initialIndex={evidenceInitialIndex}
      />

      {/* Floating Toast Notification */}
      <ToastNotification
        isVisible={scanner.isToastVisible}
        message={scanner.toastMessage}
      />
    </>
  );
}
