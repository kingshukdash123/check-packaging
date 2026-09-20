import { useState, useEffect, useCallback } from 'react';
import { sampleService, historyService, healthService } from '../services/index.js';

const FALLBACK_SAMPLES = [
  { id: 'sample1', title: 'Kurkure (85g)' },
  { id: 'sample2', title: 'Lay\'s (50g)' },
  { id: 'sample3', title: 'Parle-G (130g)' },
  { id: 'sample4', title: 'Maggi (70g)' }
];

/**
 * Custom Hook: useScanHistory
 * Manages commodity samples list, recent scans audit history, and backend health status.
 */
export function useScanHistory() {
  const [samplesList, setSamplesList] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [backendStatus, setBackendStatus] = useState(false);

  const loadHistory = useCallback(async (limit = 5) => {
    try {
      const data = await historyService.getHistory(limit);
      if (Array.isArray(data)) {
        setRecentScans(data.slice(0, limit));
      }
    } catch (err) {
      console.error("Error loading scan history:", err);
    }
  }, []);

  const checkBackendHealth = useCallback(async () => {
    try {
      const data = await healthService.checkHealth();
      if (data?.status === 'healthy') {
        setBackendStatus(true);
      }
    } catch {
      setBackendStatus(false);
    }
  }, []);

  const loadSamples = useCallback(async () => {
    try {
      const data = await sampleService.getSamples();
      if (Array.isArray(data) && data.length > 0) {
        setSamplesList(data);
      }
    } catch (err) {
      console.error("Error loading sample commodities:", err);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    loadSamples();
    loadHistory();
  }, [checkBackendHealth, loadSamples, loadHistory]);

  const displaySamples = samplesList.length > 0 ? samplesList : FALLBACK_SAMPLES;

  return {
    samplesList: displaySamples,
    recentScans,
    backendStatus,
    loadHistory,
    setRecentScans
  };
}

export default useScanHistory;
