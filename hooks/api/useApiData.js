import { useState, useEffect, useCallback, useRef } from 'react';

// Simple in-memory cache for API responses
const apiCache = new Map();
const cacheTimestamps = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook for API data fetching with loading and error states
 * @param {string} url - API endpoint URL
 * @param {Array} dependencies - Dependencies array for refetching
 * @param {Object} options - Configuration options
 * @param {*} options.initialData - Initial data value
 * @param {Function} options.skip - Function to determine if fetch should be skipped
 * @param {Function} options.transform - Function to transform response data
 * @param {boolean} options.fetchOnMount - Whether to fetch on component mount (default: true)
 * @param {boolean} options.cache - Whether to cache the response (default: true)
 * @returns {Object} { data, loading, error, refetch }
 */
const useApiData = (url, dependencies = [], options = {}) => {
  const {
    initialData = null,
    skip,
    transform,
    fetchOnMount = true,
    cache = true
  } = options;

  // Check for cached data on initialization
  const getCachedInitialData = () => {
    if (!cache || !url) return initialData;
    
    const cachedData = apiCache.get(url);
    const cacheTime = cacheTimestamps.get(url);
    const now = Date.now();
    
    if (cachedData && cacheTime && (now - cacheTime) < CACHE_DURATION) {
      return cachedData;
    }
    
    return initialData;
  };

  const [data, setData] = useState(getCachedInitialData());
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    if (cache && url) {
      const cachedData = apiCache.get(url);
      const cacheTime = cacheTimestamps.get(url);
      const now = Date.now();
      
      if (cachedData && cacheTime && (now - cacheTime) < CACHE_DURATION) {
        return false;
      }
    }
    return fetchOnMount;
  });
  const [error, setError] = useState(null);

  // Use refs to avoid dependencies issues
  const skipRef = useRef(skip);
  const transformRef = useRef(transform);
  
  // Update refs when props change
  skipRef.current = skip;
  transformRef.current = transform;

  const fetchData = useCallback(async (force = false) => {
    if (skipRef.current && skipRef.current()) {
      setLoading(false);
      return;
    }

    if (!url) {
      setLoading(false);
      return;
    }

    // Check cache first (if enabled and not forcing refresh)
    if (cache && !force) {
      const cachedData = apiCache.get(url);
      const cacheTime = cacheTimestamps.get(url);
      const now = Date.now();
      
      if (cachedData && cacheTime && (now - cacheTime) < CACHE_DURATION) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      let finalData;
      if (transformRef.current) {
        finalData = transformRef.current(result);
      } else {
        finalData = result;
      }

      setData(finalData);

      // Cache the response (if enabled)
      if (cache) {
        apiCache.set(url, finalData);
        cacheTimestamps.set(url, Date.now());
      }
    } catch (err) {
      setError(err.message);
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [url, cache, ...dependencies]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount]);

  const refetch = useCallback(() => {
    return fetchData(true); // Force refresh when manually refetching
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

export default useApiData;