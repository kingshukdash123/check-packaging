import { apiClient, API_ENDPOINTS } from '../api/index.js';

/**
 * Scan Service
 * Handles package image ingestion, rule evaluation, report fetching, and PDF export.
 */
export const scanService = {
  /**
   * Scans uploaded image files or a preset sample ID
   * @param {Object} params
   * @param {File[]} [params.files] - Array of package surface image files
   * @param {string[]} [params.panelTags] - Array of surface tags ('front', 'back', etc.)
   * @param {string} [params.sampleId] - Preset sample identifier ('sample1', etc.)
   * @param {string} [params.apiKey] - Optional custom Gemini API key
   * @returns {Promise<Object>} Compliance report object
   */
  async scanPackage({ files = [], panelTags = [], sampleId = null, apiKey = null } = {}) {
    const formData = new FormData();

    if (sampleId) {
      formData.append('sample_id', sampleId);
    } else if (files.length > 0) {
      files.forEach((file, index) => {
        formData.append('files', file);
        const tag = panelTags[index] || (index === 0 ? 'front' : 'back');
        formData.append('panel_tags', tag);
      });
    } else {
      throw new Error('Please select an image file or choose a sample dataset.');
    }

    const headers = {};
    if (apiKey) {
      headers['X-Gemini-Api-Key'] = apiKey;
    }

    return apiClient.postFormData(API_ENDPOINTS.SCAN, formData, { headers });
  },

  /**
   * Retrieves an existing compliance report by scan ID
   * @param {string} scanId
   * @returns {Promise<Object>}
   */
  async getScanById(scanId) {
    if (!scanId) throw new Error('scanId is required');
    return apiClient.get(API_ENDPOINTS.SCAN_BY_ID(scanId));
  },

  /**
   * Returns the direct URL to download the official ReportLab inspection notice PDF
   * @param {string} scanId
   * @returns {string}
   */
  getPdfExportUrl(scanId) {
    return API_ENDPOINTS.EXPORT_PDF(scanId);
  }
};

export default scanService;
