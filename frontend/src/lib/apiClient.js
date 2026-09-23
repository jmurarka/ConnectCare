export const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('cc_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    let response;
    try {
      response = await fetch(endpoint, config);
    } catch (networkError) {
      throw new Error('Network error: Unable to connect to backend server. Please check your backend connection.');
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Fallback to text or default message
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }

    if (response.status === 240 || response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
