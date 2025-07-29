import { useState, useCallback } from 'react';

/**
 * Custom hook for managing async operations with loading, error, and data states
 * @param {*} initialState - Initial data state
 * @returns {Object} { data, loading, error, execute, reset }
 */
const useAsyncState = (initialState = null) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction, ...args) => {
    if (typeof asyncFunction !== 'function') {
      throw new Error('useAsyncState: First argument must be a function');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Async operation failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
    setError(null);
    setLoading(false);
  }, [initialState]);

  const setSuccess = useCallback((result) => {
    setData(result);
    setError(null);
    setLoading(false);
  }, []);

  const setFailure = useCallback((errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setSuccess,
    setFailure,
    // Convenience getters
    isLoading: loading,
    hasError: !!error,
    hasData: data !== null && data !== undefined,
    isEmpty: data === null || data === undefined || (Array.isArray(data) && data.length === 0)
  };
};

export default useAsyncState;