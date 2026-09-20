import { apiClient, API_ENDPOINTS } from '../api/index.js';

/**
 * History Service
 * Retrieves audit log of historical commodity scans.
 */
export const historyService = {
  /**
   * Fetches scan history records
   * @param {number} [limit=50] - Maximum records to retrieve
   * @returns {Promise<Array>} List of historical inspection records
   */
  async getHistory(limit = 50) {
    const url = `${API_ENDPOINTS.HISTORY}?limit=${limit}`;
    return apiClient.get(url);
  }
};

export default historyService;
