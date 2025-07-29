import { useState, useCallback } from 'react';

/**
 * Custom hook for managing multiple toggle states (like accordion, expand/collapse)
 * @param {Object} initialState - Initial toggle states object
 * @param {boolean} defaultValue - Default value for new toggles (default: false)
 * @returns {Object} Toggle state and control methods
 */
const useToggleMap = (initialState = {}, defaultValue = false) => {
  const [toggles, setToggles] = useState(initialState);

  const toggle = useCallback((key) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const setToggle = useCallback((key, value) => {
    setToggles(prev => ({
      ...prev,
      [key]: Boolean(value)
    }));
  }, []);

  const toggleAll = useCallback((value) => {
    setToggles(prev => {
      const newToggles = {};
      Object.keys(prev).forEach(key => {
        newToggles[key] = Boolean(value);
      });
      return newToggles;
    });
  }, []);

  const expandAll = useCallback(() => {
    toggleAll(true);
  }, [toggleAll]);

  const collapseAll = useCallback(() => {
    toggleAll(false);
  }, [toggleAll]);

  const isToggled = useCallback((key) => {
    return Boolean(toggles[key]);
  }, [toggles]);

  const addToggle = useCallback((key, initialValue = defaultValue) => {
    setToggles(prev => ({
      ...prev,
      [key]: Boolean(initialValue)
    }));
  }, [defaultValue]);

  const removeToggle = useCallback((key) => {
    setToggles(prev => {
      const newToggles = { ...prev };
      delete newToggles[key];
      return newToggles;
    });
  }, []);

  const resetToggles = useCallback((newState = initialState) => {
    setToggles(newState);
  }, [initialState]);

  // Get statistics about toggles
  const getToggleStats = useCallback(() => {
    const keys = Object.keys(toggles);
    const activeCount = keys.filter(key => toggles[key]).length;
    
    return {
      total: keys.length,
      active: activeCount,
      inactive: keys.length - activeCount,
      allActive: keys.length > 0 && activeCount === keys.length,
      allInactive: activeCount === 0,
      someActive: activeCount > 0 && activeCount < keys.length
    };
  }, [toggles]);

  return {
    // State
    toggles,
    
    // Single toggle methods
    toggle,
    setToggle,
    isToggled,
    
    // Bulk operations
    toggleAll,
    expandAll,
    collapseAll,
    
    // Management
    addToggle,
    removeToggle,
    resetToggles,
    
    // Statistics
    getToggleStats,
    
    // Convenience getters
    hasAnyActive: Object.values(toggles).some(Boolean),
    hasAllActive: Object.keys(toggles).length > 0 && Object.values(toggles).every(Boolean),
    activeKeys: Object.keys(toggles).filter(key => toggles[key]),
    inactiveKeys: Object.keys(toggles).filter(key => !toggles[key])
  };
};

/**
 * Simpler hook for single boolean toggle
 * @param {boolean} initialValue - Initial toggle value
 * @returns {Array} [isToggled, toggle, setToggle]
 */
export const useToggle = (initialValue = false) => {
  const [isToggled, setIsToggled] = useState(Boolean(initialValue));

  const toggle = useCallback(() => {
    setIsToggled(prev => !prev);
  }, []);

  const setToggle = useCallback((value) => {
    setIsToggled(Boolean(value));
  }, []);

  return [isToggled, toggle, setToggle];
};

/**
 * Hook for managing visibility states (show/hide)
 * @param {Object} initialState - Initial visibility states
 * @returns {Object} Visibility state and control methods
 */
export const useVisibility = (initialState = {}) => {
  const toggleMap = useToggleMap(initialState, false);

  return {
    ...toggleMap,
    show: toggleMap.setToggle,
    hide: (key) => toggleMap.setToggle(key, false),
    isVisible: toggleMap.isToggled,
    showAll: toggleMap.expandAll,
    hideAll: toggleMap.collapseAll,
    toggleVisibility: toggleMap.toggle
  };
};

/**
 * Hook for managing accordion-style components
 * @param {Object} initialState - Initial accordion states
 * @param {boolean} allowMultiple - Allow multiple panels open (default: true)
 * @returns {Object} Accordion state and control methods
 */
export const useAccordion = (initialState = {}, allowMultiple = true) => {
  const toggleMap = useToggleMap(initialState, false);

  const expandPanel = useCallback((key) => {
    if (!allowMultiple) {
      // Close all others first
      toggleMap.setToggles(prev => {
        const newToggles = {};
        Object.keys(prev).forEach(k => {
          newToggles[k] = k === key;
        });
        return newToggles;
      });
    } else {
      toggleMap.setToggle(key, true);
    }
  }, [allowMultiple, toggleMap]);

  const collapsePanel = useCallback((key) => {
    toggleMap.setToggle(key, false);
  }, [toggleMap]);

  const togglePanel = useCallback((key) => {
    if (!allowMultiple && !toggleMap.isToggled(key)) {
      expandPanel(key);
    } else {
      toggleMap.toggle(key);
    }
  }, [allowMultiple, toggleMap, expandPanel]);

  return {
    ...toggleMap,
    expandPanel,
    collapsePanel,
    togglePanel,
    isExpanded: toggleMap.isToggled,
    expandedPanels: toggleMap.activeKeys
  };
};

export default useToggleMap;