import { useState, useCallback } from 'react';

/**
 * Custom hook for modal state management
 * @param {*} initialData - Initial data for the modal
 * @returns {Object} Modal state and control methods
 */
const useModal = (initialData = null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const open = useCallback((modalData = null) => {
    if (modalData !== null) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset data to initial value after a short delay to allow for exit animations
    setTimeout(() => {
      setData(initialData);
    }, 100);
  }, [initialData]);

  const toggle = useCallback((modalData = null) => {
    if (isOpen) {
      close();
    } else {
      open(modalData);
    }
  }, [isOpen, open, close]);

  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  const openWithData = useCallback((modalData) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    updateData,
    openWithData,
    
    // Convenience getters
    hasData: data !== null && data !== undefined,
    isEditMode: data !== null && data !== undefined && (data.id || data._id)
  };
};

/**
 * Hook for managing multiple modals
 * @param {Array} modalNames - Array of modal names to manage
 * @returns {Object} Object with modal states and methods for each modal
 */
export const useModals = (modalNames = []) => {
  const [modals, setModals] = useState(() => {
    return modalNames.reduce((acc, name) => {
      acc[name] = {
        isOpen: false,
        data: null
      };
      return acc;
    }, {});
  });

  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        isOpen: true,
        data
      }
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        isOpen: false,
        data: null
      }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = {};
      Object.keys(prev).forEach(name => {
        newModals[name] = {
          isOpen: false,
          data: null
        };
      });
      return newModals;
    });
  }, []);

  // Create convenience methods for each modal
  const modalMethods = modalNames.reduce((acc, name) => {
    acc[`open${name.charAt(0).toUpperCase()}${name.slice(1)}`] = (data) => openModal(name, data);
    acc[`close${name.charAt(0).toUpperCase()}${name.slice(1)}`] = () => closeModal(name);
    acc[`is${name.charAt(0).toUpperCase()}${name.slice(1)}Open`] = modals[name]?.isOpen || false;
    acc[`${name}Data`] = modals[name]?.data || null;
    return acc;
  }, {});

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    ...modalMethods
  };
};

export default useModal;