// API request utilities
export const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return { data, success: true };
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      error: error.message || 'An unexpected error occurred', 
      success: false 
    };
  }
};

// HTTP method helpers
export const get = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'GET' });
};

export const post = (url, data, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const put = (url, data, options = {}) => {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const del = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'DELETE' });
};

// Form submission helper
export const handleFormSubmission = async (apiCall, setLoading, setError, setSuccess, onSuccess) => {
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const result = await apiCall();
    
    if (result.success) {
      setSuccess(result.data.message || 'Operation completed successfully');
      if (onSuccess) {
        onSuccess(result.data);
      }
    } else {
      setError(result.error);
    }
  } catch (error) {
    setError(error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};