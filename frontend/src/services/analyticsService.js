import { apiClient, API_ENDPOINTS } from '../api/index.js';

/**
 * Analytics Service
 * Retrieves enforcement statistics, compliance metrics, and rule violation frequencies.
 */
export const analyticsService = {
  /**
   * Fetches aggregate analytics summary from SQLite database
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary() {
    return apiClient.get(API_ENDPOINTS.ANALYTICS);
  }
};

export default analyticsService;
