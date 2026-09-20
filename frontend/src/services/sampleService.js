import { apiClient, API_ENDPOINTS } from '../api/index.js';

/**
 * Sample Service
 * Fetches pre-configured packaged commodity fixtures bundled with the system.
 */
export const sampleService = {
  /**
   * Fetches available preset sample commodities
   * @returns {Promise<Array>} List of bundled sample datasets
   */
  async getSamples() {
    return apiClient.get(API_ENDPOINTS.SAMPLES);
  }
};

export default sampleService;
