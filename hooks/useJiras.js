// src/hooks/useJiras.js
import { useState, useEffect, useCallback } from 'react';

function useJiras() {
  const [allJiras, setAllJiras] = useState([]);
  const [logOptions, setLogOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to deeply clone Jiras (important for immutability and nested updates)
  const deepCloneJiras = (jiras) => JSON.parse(JSON.stringify(jiras));

  const fetchJiras = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/jiras');
      const data = await res.json();
      if (res.ok) {
        setAllJiras(data.jiras || []);
        setLogOptions(data.logOptions || []);
      } else {
        setError(data.message || 'Failed to fetch Jiras');
        console.error('Failed to fetch Jiras:', data.message);
      }
    } catch (error) {
      setError(error.message || 'Error fetching Jiras');
      console.error('Error fetching Jiras:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJiras();
  }, [fetchJiras]);

  // --- Optimistic Update Logic for LOGS (Add) ---

  const addOptimisticLog = useCallback((jiraId, newLogData) => {
    const tempLogId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticLog = { ...newLogData, _id: tempLogId, isOptimistic: true };

    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        newJiras[jiraIndex].dailyLogs.push(optimisticLog);
        newJiras[jiraIndex].totalTimeSpent = (
          parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) + parseFloat(newLogData.timeSpent || 0)
        ).toString();
      }
      return newJiras;
    });

    return optimisticLog._id;
  }, []);

  const rollbackOptimisticLog = useCallback((jiraId, tempLogId) => {
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        const logIndex = newJiras[jiraIndex].dailyLogs.findIndex(log => log._id === tempLogId);
        if (logIndex > -1) {
          const rolledBackLog = newJiras[jiraIndex].dailyLogs[logIndex];
          newJiras[jiraIndex].totalTimeSpent = (
            parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) - parseFloat(rolledBackLog.timeSpent || 0)
          ).toString();
          newJiras[jiraIndex].dailyLogs.splice(logIndex, 1);
        }
      }
      return newJiras;
    });
  }, []);

  // --- Optimistic Update Logic for JIRA ITEMS ---

  const updateOptimisticJira = useCallback((jiraId, updatedJiraData) => {
    let originalJira = null;
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        originalJira = newJiras[jiraIndex];
        newJiras[jiraIndex] = { ...originalJira, ...updatedJiraData, isOptimistic: true };
      }
      return newJiras;
    });
    return originalJira;
  }, []);

  const rollbackOptimisticJiraUpdate = useCallback((jiraId, originalJiraData) => {
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        newJiras[jiraIndex] = originalJiraData;
      }
      return newJiras;
    });
  }, []);

  const deleteOptimisticJira = useCallback((jiraId) => {
    let deletedJira = null;
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        deletedJira = newJiras[jiraIndex];
        newJiras.splice(jiraIndex, 1);
      }
      return newJiras;
    });
    return deletedJira;
  }, []);

  const rollbackOptimisticJiraDelete = useCallback((restoredJiraData) => {
    setAllJiras(prevJiras => {
      const newJiras = [...prevJiras, restoredJiraData]; // Add back to the end
      return newJiras;
    });
  }, []);

  // --- NEW Optimistic Update Logic for LOGS (Update & Delete) ---

  /**
   * Optimistically updates an existing log within a Jira item.
   * @param {string} jiraId - The ID of the parent Jira.
   * @param {string} logId - The ID of the log to update.
   * @param {object} updatedLogData - The new data for the log.
   * @returns {object|null} The original log object before update, or null if not found.
   */
  const updateOptimisticLog = useCallback((jiraId, logId, updatedLogData) => {
    let originalLog = null;
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        const logIndex = newJiras[jiraIndex].dailyLogs.findIndex(log => (log._id?.$oid || log._id) === logId);
        if (logIndex > -1) {
          originalLog = newJiras[jiraIndex].dailyLogs[logIndex]; // Store original for rollback

          // Update totalTimeSpent for the Jira
          const oldHours = parseFloat(originalLog.timeSpent || 0);
          const newHours = parseFloat(updatedLogData.timeSpent || 0);
          newJiras[jiraIndex].totalTimeSpent = (
            parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) - oldHours + newHours
          ).toString();

          newJiras[jiraIndex].dailyLogs[logIndex] = { 
            ...originalLog, 
            ...updatedLogData, 
            isOptimistic: true // Mark as optimistic
          };
        }
      }
      return newJiras;
    });
    return originalLog; // Return original for rollback
  }, []);

  /**
   * Reverts an optimistically updated log.
   * @param {string} jiraId - The ID of the parent Jira.
   * @param {string} logId - The ID of the log to revert.
   * @param {object} originalLogData - The original log data to restore.
   */
  const rollbackOptimisticLogUpdate = useCallback((jiraId, logId, originalLogData) => {
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        const logIndex = newJiras[jiraIndex].dailyLogs.findIndex(log => (log._id?.$oid || log._id) === logId);
        if (logIndex > -1) {
          // Revert totalTimeSpent for the Jira
          const currentHours = parseFloat(newJiras[jiraIndex].dailyLogs[logIndex].timeSpent || 0);
          const originalHours = parseFloat(originalLogData.timeSpent || 0);
          newJiras[jiraIndex].totalTimeSpent = (
            parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) - currentHours + originalHours
          ).toString();

          newJiras[jiraIndex].dailyLogs[logIndex] = originalLogData; // Restore original data
        }
      }
      return newJiras;
    });
  }, []);

  /**
   * Optimistically deletes a log from a Jira item.
   * @param {string} jiraId - The ID of the parent Jira.
   * @param {string} logId - The ID of the log to delete.
   * @returns {object|null} The deleted log object, or null if not found.
   */
  const deleteOptimisticLog = useCallback((jiraId, logId) => {
    let deletedLog = null;
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        const logIndex = newJiras[jiraIndex].dailyLogs.findIndex(log => (log._id?.$oid || log._id) === logId);
        if (logIndex > -1) {
          deletedLog = newJiras[jiraIndex].dailyLogs[logIndex]; // Store for rollback

          // Update totalTimeSpent for the Jira
          newJiras[jiraIndex].totalTimeSpent = (
            parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) - parseFloat(deletedLog.timeSpent || 0)
          ).toString();

          newJiras[jiraIndex].dailyLogs.splice(logIndex, 1); // Remove the log
        }
      }
      return newJiras;
    });
    return deletedLog; // Return deleted log for rollback
  }, []);

  /**
   * Reverts an optimistically deleted log by re-adding it.
   * @param {string} jiraId - The ID of the parent Jira.
   * @param {object} restoredLogData - The log data to restore.
   */
  const rollbackOptimisticLogDelete = useCallback((jiraId, restoredLogData) => {
    setAllJiras(prevJiras => {
      const newJiras = deepCloneJiras(prevJiras);
      const jiraIndex = newJiras.findIndex(jira => jira._id === jiraId);

      if (jiraIndex > -1) {
        // Re-add the log and update totalTimeSpent
        newJiras[jiraIndex].dailyLogs.push(restoredLogData);
        newJiras[jiraIndex].totalTimeSpent = (
          parseFloat(newJiras[jiraIndex].totalTimeSpent || 0) + parseFloat(restoredLogData.timeSpent || 0)
        ).toString();
      }
      return newJiras;
    });
  }, []);


  return { 
    allJiras, 
    logOptions, 
    fetchJiras, 
    isLoading, 
    error,
    addOptimisticLog,
    rollbackOptimisticLog,
    updateOptimisticJira,
    rollbackOptimisticJiraUpdate,
    deleteOptimisticJira,
    rollbackOptimisticJiraDelete,
    updateOptimisticLog,      // New
    rollbackOptimisticLogUpdate, // New
    deleteOptimisticLog,      // New
    rollbackOptimisticLogDelete // New
  };
}

export default useJiras;