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
      if (value === null || value === undefined || value === '' || value === 'all') {
        return; // Skip empty filters
      }

      const filterFn = filterConfig[key];
      
      if (typeof filterFn === 'function') {
        filtered = filtered.filter(item => filterFn(item, value));
      } else {
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
  }, [data, activeFilters, searchQuery, filterConfig]);

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((value, key) => {
      return value && value[key] !== undefined ? value[key] : null;
    }, obj);
  };

  // Get unique values for a specific field (useful for dropdowns)
  const getUniqueValues = useCallback((field) => {
    if (!Array.isArray(data)) return [];
    
    const values = data.map(item => getNestedValue(item, field))
      .filter(value => value !== null && value !== undefined && value !== '');
    
    return [...new Set(values)].sort();
  }, [data]);

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
      const dueDate = new Date(jira.dueDate);
      const now = new Date();
      
      switch (range) {
        case 'overdue':
          return dueDate < now;
        case 'thisWeek':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return dueDate >= weekStart && dueDate <= weekEnd;
        case 'thisMonth':
          return dueDate.getMonth() === now.getMonth() && 
                 dueDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    },
    
    searchFields: ['jiraNumber', 'description', 'projectName', 'serviceName', 'assignedTo']
  };

  return useFilter(jiras, filterConfig);
};

export default useFilter;