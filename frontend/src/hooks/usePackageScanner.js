import { useState, useCallback } from 'react';
import { scanService } from '../services/index.js';
import useToast from './useToast.js';
import useMediaUpload from './useMediaUpload.js';
import useScanHistory from './useScanHistory.js';

/**
 * Composite Hook: usePackageScanner
 * Composes dedicated sub-hooks (useToast, useMediaUpload, useScanHistory)
 * and coordinates Legal Metrology package analysis, scoring, and report state.
 */
export function usePackageScanner() {
  const [activeReport, setActiveReport] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('LMPC_GEMINI_API_KEY') || '');
  const [errorMsg, setErrorMsg] = useState(null);

  // Sub-hook: Toast feedback
  const { toastMessage, isToastVisible, showToast } = useToast();

  // Sub-hook: Samples & Audit History
  const {
    samplesList,
    recentScans,
    backendStatus,
    loadHistory
  } = useScanHistory();

  // Sub-hook: Package Media (Front & Back uploads, drag & drop)
  const {
    frontImage,
    setFrontImage,
    backImage,
    setBackImage,
    isDragging,
    fileInputRef,
    hasMedia,
    handleFilesChosen,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearMedia,
    handleRemoveImage,
    handleNewScan
  } = useMediaUpload({
    onMediaChanged: () => {
      setActiveSampleId(null);
      setActiveReport(null);
      setErrorMsg(null);
    },
    onMediaCleared: () => {
      setActiveReport(null);
      setActiveSampleId(null);
      setErrorMsg(null);
    },
    showToast
  });

  const handleSaveApiKey = useCallback((key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('LMPC_GEMINI_API_KEY', key);
      showToast('Gemini API key saved successfully.');
    } else {
      localStorage.removeItem('LMPC_GEMINI_API_KEY');
      showToast('Gemini API key removed.');
    }
  }, [showToast]);

  const handleSelectSample = useCallback(async (sampleId, triggerToast = true) => {
    setIsScanning(true);
    setErrorMsg(null);
    setActiveSampleId(sampleId);

    setFrontImage(prev => ({ ...prev, file: null }));
    setBackImage(prev => ({ ...prev, file: null }));

    try {
      const data = await scanService.scanPackage({ sampleId, apiKey });
      setActiveReport(data);

      if (triggerToast) {
        showToast(`Loaded ${data.product_name || sampleId} inspection.`);
      }

      const primaryUrl = data.image_url || `/static/uploads/${data.image_filename}`;
      setFrontImage({
        name: data.image_filename || `${data.product_name}_Front.png`,
        url: primaryUrl,
        loaded: true,
        file: null
      });

      setBackImage({
        name: data.image_filename ? `decl_${data.image_filename}` : `${data.product_name}_Back.png`,
        url: primaryUrl,
        loaded: true,
        file: null
      });

      loadHistory();
    } catch (err) {
      console.error("Sample scan error:", err);
      setErrorMsg(err.message || "Failed to load sample audit.");
    } finally {
      setIsScanning(false);
    }
  }, [apiKey, loadHistory, setBackImage, setFrontImage, showToast]);

  const runPackageAnalysis = useCallback(async () => {
    setIsScanning(true);
    setErrorMsg(null);

    try {
      if (frontImage.file) {
        const files = [frontImage.file];
        const panelTags = ['front'];
        if (backImage.file) {
          files.push(backImage.file);
          panelTags.push('back');
        }

        const data = await scanService.scanPackage({ files, panelTags, apiKey });
        setActiveReport(data);
        const fails = data.rule_results?.filter(r => r.status === 'FAIL').length || 0;
        showToast(`Analysis complete: ${fails} violation(s) detected.`);
        loadHistory();
      } else if (activeSampleId) {
        const data = await scanService.scanPackage({ sampleId: activeSampleId, apiKey });
        setActiveReport(data);
        const fails = data.rule_results?.filter(r => r.status === 'FAIL').length || 0;
        showToast(`Analysis complete: ${fails} violation(s) detected.`);
        loadHistory();
      } else {
        showToast("Please browse and select an image or choose a sample.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setErrorMsg(err.message || "Failed to analyze package.");
      showToast("Error during package inspection.");
    } finally {
      setIsScanning(false);
    }
  }, [activeSampleId, apiKey, backImage.file, frontImage.file, loadHistory, showToast]);

  const handleExportPdf = useCallback(() => {
    if (activeReport?.scan_id) {
      showToast('Generating official inspection PDF notice...');
      window.open(scanService.getPdfExportUrl(activeReport.scan_id), '_blank');
    } else {
      showToast('Please select or scan a commodity first.');
    }
  }, [activeReport?.scan_id, showToast]);

  const handleSelectRecentScan = useCallback(async (scanId) => {
    try {
      showToast(`Loading scan #${scanId.slice(0, 8)}...`);
      const data = await scanService.getScanById(scanId);
      setActiveReport(data);
      setActiveSampleId(null);
      if (data.image_url) {
        setFrontImage({
          name: data.image_filename || `${data.product_name}.png`,
          url: data.image_url,
          loaded: true,
          file: null
        });
        setBackImage({
          name: data.image_filename || `${data.product_name}.png`,
          url: data.image_url,
          loaded: true,
          file: null
        });
      }
    } catch (err) {
      console.error("Failed to load historical scan:", err);
      showToast("Failed to load historical inspection report.");
    }
  }, [setBackImage, setFrontImage, showToast]);

  const getRuleResult = useCallback((ruleId) => {
    return (activeReport?.rule_results || []).find(r => r.rule_id === ruleId);
  }, [activeReport?.rule_results]);

  // Derived metrics (only present after an inspection is completed)
  const score = activeReport ? Math.round(activeReport.compliance_score) : null;
  const rules = activeReport?.rule_results || [];
  const passCount = activeReport ? (activeReport.passed_count ?? rules.filter(r => r.status === 'PASS').length) : 0;
  const failCount = activeReport ? (activeReport.failed_count ?? rules.filter(r => r.status === 'FAIL').length) : 0;
  const warnCount = activeReport ? (activeReport.warning_count ?? rules.filter(r => r.status === 'WARNING').length) : 0;
  const potentialIssues = activeReport ? rules.filter(r => r.status === 'FAIL' || r.status === 'WARNING') : [];
  const decl = activeReport?.extracted_data || {};
  const productName = activeReport?.product_name || decl.brand_name || '';

  return {
    // State
    activeReport,
    isScanning,
    samplesList,
    activeSampleId,
    backendStatus,
    apiKey,
    errorMsg,
    frontImage,
    backImage,
    isDragging,
    recentScans,
    toastMessage,
    isToastVisible,
    fileInputRef,
    hasMedia,

    // Computed properties
    score,
    rules,
    passCount,
    failCount,
    warnCount,
    potentialIssues,
    decl,
    productName,
    getRuleResult,

    // Actions
    setErrorMsg,
    showToast,
    handleSaveApiKey,
    handleSelectSample,
    handleFilesChosen,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearMedia,
    handleRemoveImage,
    runPackageAnalysis,
    handleExportPdf,
    handleSelectRecentScan,
    handleNewScan
  };
}

export default usePackageScanner;
