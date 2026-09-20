import { apiClient, API_ENDPOINTS } from '../api/index.js';

/**
 * Health Service
 * Verifies backend engine connectivity and Gemini API configuration.
 */
export const healthService = {
  /**
   * Checks health of Legal Metrology Rule Engine
   * @returns {Promise<Object>} { status: 'healthy', system: '...', gemini_api_configured: bool }
   */
  async checkHealth() {
    return apiClient.get(API_ENDPOINTS.HEALTH);
  }
};

export default healthService;
