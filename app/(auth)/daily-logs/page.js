// app/daily-logs/page.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import AddJiraModal from '@/components/AddJiraModal';
import EditJiraModal from '@/components/EditJiraModal';
import AllJirasSummary from '@/components/AllJirasSummary';
import WorkLogAccordion from '@/components/WorkLogAccordion';
import ExportOptions from '@/components/ExportOptions';
import MyJiras from '@/components/MyJiras';
import WorkCalendar from '@/components/WorkCalendar';

import useJiras from '@/hooks/useJiras';
import useGroupedJiras from '@/hooks/useGroupedJiras';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DailyLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { 
    allJiras, 
    fetchJiras, 
    isLoading: isInitialLoading, 
    error: fetchError, 
    addOptimisticLog, 
    rollbackOptimisticLog,
    updateOptimisticJira,   
    rollbackOptimisticJiraUpdate,
    deleteOptimisticJira,   
    rollbackOptimisticJiraDelete,
    updateOptimisticLog,     
    rollbackOptimisticLogUpdate, 
    deleteOptimisticLog,   
    rollbackOptimisticLogDelete 
  } = useJiras();

  const [showAddJiraModal, setShowAddJiraModal] = useState(false);
  const [editingJira, setEditingJira] = useState(null);
  const [showEditJiraModal, setShowEditJiraModal] = useState(false);
  const [currentView, setCurrentView] = useState('project');
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [isCrudLoading, setIsCrudLoading] = useState(false); 
  
  // *** NEW: State for storing all external Jira statuses at the page level ***
  const [externalStatuses, setExternalStatuses] = useState({});

  const { grouped, monthUsedHours, monthCapacities } = useGroupedJiras(allJiras, currentView);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // *** NEW: Effect to fetch all Jira statuses in bulk when allJiras data changes ***
  useEffect(() => {
    const fetchAllJiraStatuses = async () => {
      if (allJiras.length === 0) return;

      const jiraNumbersToFetch = [...new Set(allJiras.map(j => j.jiraNumber).filter(Boolean))];

      if (jiraNumbersToFetch.length === 0) return;
      
      const jiraNumbersQuery = jiraNumbersToFetch.join(',');

      try {
        const res = await fetch(`/api/jira-status?jiraNumbers=${jiraNumbersQuery}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch statuses, status: ${res.status}`);
        }
        const data = await res.json();
        
        if (data.statuses) {
          setExternalStatuses(prev => ({ ...prev, ...data.statuses }));
        }
      } catch (error) {
        console.error("Error fetching all Jira statuses:", error);
        // Optionally set an error state for the statuses
      }
    };

    fetchAllJiraStatuses();
  }, [allJiras]); // This effect runs whenever allJiras data is updated


  if (!session) {
    return null; 
  }

  const handleExport = async () => {
    const startDate = new Date(exportYear, exportMonth - 1, 1).toISOString();
    const lastDay = new Date(exportYear, exportMonth, 0).getDate();
    const endDate = new Date(exportYear, exportMonth - 1, lastDay, 23, 59, 59, 999).toISOString();

    await new Promise(resolve => setTimeout(resolve, 300)); 
    window.location.href = `/api/export/excel?startDate=${startDate}&endDate=${endDate}`;
  };

  const wrapAsyncCrud = (fn) => async (...args) => {
    setIsCrudLoading(true);
    try {
      await fn(...args);
    } finally {
      setIsCrudLoading(false);
    }
  };

  const handleAddJira = wrapAsyncCrud(async (newJiraData) => {
    try {
      const res = await fetch('/api/jiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJiraData),
      });
      if (res.ok) {
        toast.success('Jira added successfully!');
        setShowAddJiraModal(false);
        fetchJiras();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to add Jira: ${errorData.message || 'Unknown error'}`);
        console.error('Failed to add Jira:', errorData);
      }
    } catch (error) {
      toast.error('Error adding Jira.');
      console.error('Error adding Jira:', error);
    }
  });

  const handleAddLog = async (jiraId, newLogData) => {
    let tempLogId;
    try {
      tempLogId = addOptimisticLog(jiraId, newLogData);
      toast.success('Log added successfully!');

      const res = await fetch(`/api/jiras/${jiraId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add log on server');
      }
      fetchJiras()
    } catch (error) {
      if (tempLogId) {
        rollbackOptimisticLog(jiraId, tempLogId);
      }
      toast.error(`Failed to add log: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error adding log:', error);
    }
  };

  const handleEditJira = (jira) => {
    setEditingJira(jira);
    setShowEditJiraModal(true);
  };

  const closeEditJiraModal = () => {
    setEditingJira(null);
    setShowEditJiraModal(false);
  };

  const handleUpdateJira = async (jiraId, updatedJiraData) => {
    let originalJira = null; 
    try {
      originalJira = updateOptimisticJira(jiraId, updatedJiraData);
      toast.success('Jira updated successfully!');
      closeEditJiraModal(); 

      const response = await fetch(`/api/jiras/${jiraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJiraData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update Jira on server');
      }

    } catch (error) {
      if (originalJira) {
        rollbackOptimisticJiraUpdate(jiraId, originalJira);
      }
      toast.error(`Failed to update Jira: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error updating Jira:', error);
    }
  };

  const handleDeleteJira = async (jiraId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Jira นี้และ Logs ที่เกี่ยวข้อง?')) {
      let deletedJira = null; 
      try {
        deletedJira = deleteOptimisticJira(jiraId);
        toast.success('Jira and its logs deleted successfully!');

        const response = await fetch(`/api/jiras/${jiraId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete Jira on server');
        }
      } catch (error) {
        if (deletedJira) {
          rollbackOptimisticJiraDelete(deletedJira);
        }
        toast.error(`Failed to delete Jira: ${error.message || 'Unknown error'}. Reverted changes.`);
        console.error('Error deleting Jira:', error);
      }
    }
  };

  const handleViewChange = (event) => {
    setCurrentView(event.target.value);
  };

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-black">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-black mr-2" /> Daily Logs Loading...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-red-600">
        <p>Error loading data: {fetchError.message}. Please try again.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white p-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-light text-black mb-4">Daily Logs</h1>
          <div className="w-16 h-px bg-black mx-auto"></div>
        </div>

                {/* Summary Section */}
        <div className="mb-6">
          <WorkCalendar allJiras={allJiras} />
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <button 
            className="px-6 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors flex items-center gap-2"
            onClick={() => setShowAddJiraModal(true)}
            disabled={isCrudLoading}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            New Task
          </button>
          
          <ExportOptions
            exportMonth={exportMonth}
            exportYear={exportYear}
            setExportMonth={setExportMonth}
            setExportYear={setExportYear}
            handleExport={handleExport}
          />
        </div>

        {/* View Filter */}
        <div className="mb-8">
          <label htmlFor="viewSelect" className="block text-sm font-medium text-gray-600 mb-2">
            View By
          </label>
          <select
            id="viewSelect"
            className="w-full sm:w-auto py-3 text-black bg-transparent border-0 border-b-2 border-gray-200  transition-colors appearance-none bg-white"
            value={currentView}
            onChange={handleViewChange}
            disabled={isCrudLoading}
          >
            <option value="project">Project</option>
            <option value="service">Service</option>
            <option value="jira">JIRA</option>
          </select>
        </div>

        {/* Modals */}
        <AddJiraModal
          show={showAddJiraModal}
          onClose={() => setShowAddJiraModal(false)}
          onAddJira={handleAddJira}
        />

        <EditJiraModal
          show={showEditJiraModal}
          onClose={closeEditJiraModal}
          onUpdateJira={handleUpdateJira}
          editingJira={editingJira}
        />

        {/* Work Log Accordion */}
        <div className="mb-6">
          <WorkLogAccordion
            currentView={currentView}
            grouped={grouped}
            monthUsedHours={monthUsedHours}
            monthCapacities={monthCapacities}
            onAddLog={handleAddLog}
            onEditJira={handleEditJira}
            onDeleteJira={handleDeleteJira}
            fetchJiras={fetchJiras}
            updateOptimisticJira={updateOptimisticJira}
            rollbackOptimisticJiraUpdate={rollbackOptimisticJiraUpdate}
            deleteOptimisticJira={deleteOptimisticJira}
            rollbackOptimisticJiraDelete={rollbackOptimisticJiraDelete}
            updateOptimisticLog={updateOptimisticLog}
            rollbackOptimisticLogUpdate={rollbackOptimisticLogUpdate}
            deleteOptimisticLog={deleteOptimisticLog}
            rollbackOptimisticLogDelete={rollbackOptimisticLogDelete}
            externalStatuses={externalStatuses} // *** Pass statuses to Accordion ***
          />
        </div>



        {/* My Jiras Section */}
        <div className="mb-6">
          <MyJiras userEmail={session.user.email} /> 
        </div>
      </div>
    </div>
  );
}