export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  SAMPLES: `${API_BASE_URL}/api/samples`,
  SCAN: `${API_BASE_URL}/api/scan`,
  SCAN_BY_ID: (scanId) => `${API_BASE_URL}/api/scan/${scanId}`,
  HISTORY: `${API_BASE_URL}/api/history`,
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
  EXPORT_PDF: (scanId) => `${API_BASE_URL}/api/export-pdf/${scanId}`
};
