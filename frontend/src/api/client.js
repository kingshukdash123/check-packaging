/**
 * HTTP Client Wrapper
 * Centralizes request execution, headers injection, response parsing, and error normalization.
 */

class ApiClient {
  /**
   * Generic GET request
   */
  async get(url, options = {}) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    return this._handleResponse(res);
  }

  /**
   * Generic POST request with JSON payload
   */
  async post(url, data = {}, options = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    });

    return this._handleResponse(res);
  }

  /**
   * POST request with FormData (for single/multi-panel image uploads)
   */
  async postFormData(url, formData, options = {}) {
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    return this._handleResponse(res);
  }

  /**
   * Helper to normalize response and extract error messages from backend
   */
  async _handleResponse(res) {
    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Response wasn't JSON
      }
      const error = new Error(errorMessage);
      error.status = res.status;
      throw error;
    }

    // Attempt JSON parse, fallback to text
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
