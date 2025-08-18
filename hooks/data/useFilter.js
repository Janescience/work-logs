import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for data filtering with multiple filter types
 * @param {Array} data - Array of data to filter
 * @param {Object} filterConfig - Configuration for filter functions
 * @returns {Object} Filtered data and filter control methods
 */
const useFilter = (data = [], filterConfig = {}) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get nested object values - moved up
  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((value, key) => {
      return value && value[key] !== undefined ? value[key] : null;
    }, obj);
  }, []);

  const setFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setSearchQuery('');
  }, []);

  const toggleFilter = useCallback((key, value) => {
    setActiveFilters(prev => {
      if (prev[key] === value) {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];

    // Apply search query first if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        if (filterConfig.searchFields) {
          return filterConfig.searchFields.some(field => {
            const value = getNestedValue(item, field);
            return value && value.toString().toLowerCase().includes(query);
          });
        } else {
          // Default search in common fields
          const searchableText = [
            item.name,
            item.title,
            item.description,
            item.jiraNumber,
            item.projectName,
            item.serviceName
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(query);
        }
      });
    }

    // Apply other filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      console.log(`Applying filter: ${key} = ${value}`);
      if (value === null || value === undefined || value === '' || value === 'all') {
        console.log(`Skipping filter ${key} because value is empty/all`);
        return; // Skip empty filters
      }

      const filterFn = filterConfig[key];
      
      if (typeof filterFn === 'function') {
        console.log(`Using custom filter function for ${key}`);
        filtered = filtered.filter(item => filterFn(item, value));
      } else {
        console.log(`Using default filter for ${key}`);
        // Default filter behavior
        filtered = filtered.filter(item => {
          const itemValue = getNestedValue(item, key);
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    return filtered;
  }, [data, activeFilters, searchQuery, filterConfig, getNestedValue]);

  // Get unique values for a specific field (useful for dropdowns)
  const getUniqueValues = useCallback((field) => {
    if (!Array.isArray(data)) return [];
    
    const values = data.map(item => getNestedValue(item, field))
      .filter(value => value !== null && value !== undefined && value !== '');
    
    return [...new Set(values)].sort();
  }, [data, getNestedValue]);

  // Get filter statistics
  const getFilterStats = useCallback(() => {
    return {
      totalItems: data.length,
      filteredItems: filteredData.length,
      activeFilterCount: Object.keys(activeFilters).length + (searchQuery ? 1 : 0),
      hasActiveFilters: Object.keys(activeFilters).length > 0 || searchQuery.trim() !== ''
    };
  }, [data.length, filteredData.length, activeFilters, searchQuery]);

  return {
    // Filtered data
    filteredData,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Filter state
    activeFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleFilter,
    
    // Utilities
    getUniqueValues,
    getFilterStats,
    
    // Convenience getters
    hasActiveFilters: Object.keys(activeFilters).length > 0 || searchQuery.trim() !== '',
    isEmpty: filteredData.length === 0,
    isFiltered: filteredData.length !== data.length
  };
};

/**
 * Hook for common JIRA filtering patterns
 * @param {Array} jiras - Array of JIRA items
 * @returns {Object} Filtered JIRAs with common filter methods
 */
export const useJiraFilter = (jiras = []) => {
  const filterConfig = {
    status: (jira, statusFilter) => {
      const status = (jira.actualStatus || '').toLowerCase();
      switch (statusFilter) {
        case 'active':
          return status === 'in progress';
        case 'done':
          return status === 'done';
        case 'todo':
          return status === 'to do' || status === 'open';
        case 'blocked':
          return status === 'blocked' || status === 'impediment';
        default:
          return true;
      }
    },
    
    priority: (jira, priorityFilter) => {
      const priority = (jira.priority || '').toLowerCase();
      return priority === priorityFilter.toLowerCase();
    },
    
    project: (jira, projectFilter) => {
      return jira.projectName === projectFilter;
    },
    
    assignee: (jira, assigneeFilter) => {
      return jira.assignedTo === assigneeFilter;
    },
    
    dateRange: (jira, range) => {
      const now = new Date();
      
      if (range === 'all') return true;
      
      // Check both dueDate and dailyLogs dates for filtering
      const hasValidDate = (date, range) => {
        if (!date) return false;
        const targetDate = new Date(date);
        
        switch (range) {
          case 'today':
            return targetDate.toDateString() === now.toDateString();
          case 'thisWeek':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return targetDate >= weekStart && targetDate <= weekEnd;
          case 'thisMonth':
            return targetDate.getMonth() === now.getMonth() && 
                   targetDate.getFullYear() === now.getFullYear();
          case 'overdue':
            return targetDate < now;
          default:
            return true;
        }
      };
      
      // For date range filtering, only show JIRAs that have logs within the selected date range
      // Don't show JIRAs that don't have any logs in the selected range
      if (jira.dailyLogs && jira.dailyLogs.length > 0) {
        const hasLogsInRange = jira.dailyLogs.some(log => hasValidDate(log.logDate, range));
        console.log(`JIRA ${jira.jiraNumber}: has ${jira.dailyLogs.length} logs, has logs in ${range}:`, hasLogsInRange);
        return hasLogsInRange;
      }
      
      // Don't show JIRAs without any daily logs when filtering by date range
      console.log(`JIRA ${jira.jiraNumber}: no daily logs, filtering out`);
      return false;
    },
    
    searchFields: ['jiraNumber', 'description', 'projectName', 'serviceName', 'assignedTo']
  };

  return useFilter(jiras, filterConfig);
};

export default useFilter;