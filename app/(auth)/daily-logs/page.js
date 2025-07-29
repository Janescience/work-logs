// app/(auth)/daily-logs/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSpinner, 
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Button, Input, Select, LoadingSpinner, PageHeader, ErrorMessage } from '@/components/ui';

import { JiraFormModal, TaskListView } from '@/components/jira';
import { CalendarModal } from '@/components/calendar';
import { DailyLogsSummary } from '@/components/dashboard';

import { useJiras, useApiData } from '@/hooks/api';
import { useModal, useModals } from '@/hooks/ui';
import { useAuthGuard } from '@/hooks/auth';
import { useJiraFilter, useJiraStats } from '@/hooks/data';

export default function DailyLogsPage() {
  // Authentication guard
  const { session, isReady } = useAuthGuard();
  const userEmail = session?.user?.email;

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

  // Modal states using new hooks
  const jiraFormModal = useModal();
  const calendarModal = useModal();
  const { modals, openModal, closeModal } = useModals(['exportMenu']);
  
  // Filter states using new hook
  const {
    filteredData: filteredJiras,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter
  } = useJiraFilter(allJiras);
  
  // Additional view states
  const [viewBy, setViewBy] = useState('list'); // list, project, service
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // Export States
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  
  // External Jira statuses using new API hook
  const jiraNumbers = useMemo(() => {
    const numbers = [...new Set(allJiras.map(j => j.jiraNumber).filter(Boolean))];
    return numbers.join(',');
  }, [allJiras]);
  
  const {
    data: externalStatuses = {},
    loading: statusesLoading,
    error: statusesError
  } = useApiData(
    jiraNumbers ? `/api/jira-status?jiraNumbers=${jiraNumbers}` : null,
    [jiraNumbers],
    {
      skip: () => !jiraNumbers || allJiras.length === 0,
      transform: (data) => data.statuses || {},
      fetchOnMount: true
    }
  );

  // Statistics using new hook
  const stats = useJiraStats(filteredJiras);

  // No longer needed - handled by useApiData hook

  // No longer needed - handled by useJiraFilter hook

  // No longer needed - using useJiraStats hook

  if (!isReady) {
    return <LoadingSpinner fullScreen size="xl" text="Loading..." />;
  }

  const handleExport = async () => {
    const startDate = new Date(exportYear, exportMonth - 1, 1).toISOString();
    const lastDay = new Date(exportYear, exportMonth, 0).getDate();
    const endDate = new Date(exportYear, exportMonth - 1, lastDay, 23, 59, 59, 999).toISOString();

    await new Promise(resolve => setTimeout(resolve, 300)); 
    window.location.href = `/api/export/excel?startDate=${startDate}&endDate=${endDate}`;
    closeModal('exportMenu');
  };

  const handleSaveJira = async (jiraId, jiraData) => {
    try {
      let res;
      if (jiraId) {
        // Update existing Jira
        const originalJira = updateOptimisticJira(jiraId, jiraData);
        res = await fetch(`/api/jiras?jiraId=${jiraId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jiraData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          rollbackOptimisticJiraUpdate(jiraId, originalJira);
          throw new Error(errorData.message || 'Failed to update task on server');
        }
        toast.success('Task updated successfully!');
      } else {
        // Add new Jira
        res = await fetch('/api/jiras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jiraData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to add task on server');
        }
        toast.success('Task added successfully!');
      }
      jiraFormModal.close();
      fetchJiras(); // Re-fetch all Jiras to ensure UI consistency
    } catch (error) {
      toast.error(`Error saving task: ${error.message || 'Unknown error'}`);
      console.error('Error saving task:', error);
    }
  };

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
      fetchJiras();
    } catch (error) {
      if (tempLogId) {
        rollbackOptimisticLog(jiraId, tempLogId);
      }
      toast.error(`Failed to add log: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditJira = (jira) => {
    jiraFormModal.open(jira);
  };


  const handleDeleteJira = async (jiraId) => {
    if (window.confirm('Are you sure you want to delete this task and all its logs?')) {
      let deletedJira = null;
      try {
        deletedJira = deleteOptimisticJira(jiraId);
        toast.success('Task deleted successfully!');

        const response = await fetch(`/api/jiras?jiraId=${jiraId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete task on server');
        }
      } catch (error) {
        if (deletedJira) {
          rollbackOptimisticJiraDelete(deletedJira);
        }
        toast.error(`Failed to delete task: ${error.message || 'Unknown error'}`);
      }
    }
  };


  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) {
      for (const taskId of selectedTasks) {
        await handleDeleteJira(taskId);
      }
      setSelectedTasks([]);
    }
  };

  if (isInitialLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="xl" 
        text="Loading Daily Logs..." 
      />
    );
  }

  if (fetchError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <ErrorMessage 
          type="error" 
          message={`Error loading data: ${fetchError.message}. Please try again.`} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-6 py-6">
          <PageHeader title="DAILY LOGS" />
          
          {/* Stats */}
          <div className="mx-auto">
            <DailyLogsSummary stats={stats} />
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search and Filters */}
            <div className="flex gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <Input
                  variant="outline"
                  size="sm"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
              </div>

              {/* Filters */}
              <Select
                variant="outline"
                size="sm"
                value={activeFilters.status || 'all'}
                onChange={(e) => setFilter('status', e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'done', label: 'Done' }
                ]}
              />

              <Select
                variant="outline"
                size="sm"
                value={activeFilters.dateRange || 'thisMonth'}
                onChange={(e) => setFilter('dateRange', e.target.value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'thisWeek', label: 'Week' },
                  { value: 'thisMonth', label: 'Month' }
                ]}
              />

              <Select
                variant="outline"
                size="sm"
                value={viewBy}
                onChange={(e) => setViewBy(e.target.value)}
                options={[
                  { value: 'list', label: 'List' },
                  { value: 'project', label: 'Project' },
                  { value: 'service', label: 'Service' }
                ]}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => jiraFormModal.open()}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs mr-2" />
                New Task
              </Button>

              {selectedTasks.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete ({selectedTasks.length})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => calendarModal.open()}
              >
                Summary
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('exportMenu')}
                >
                  Export
                </Button>

                {modals.exportMenu?.isOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg p-4 z-50">
                    <div className="space-y-3">
                      <Select
                        variant="outline"
                        size="sm"
                        value={exportMonth}
                        onChange={(e) => setExportMonth(parseInt(e.target.value))}
                        options={Array.from({ length: 12 }, (_, i) => ({
                          value: i + 1,
                          label: new Date(0, i).toLocaleString('default', { month: 'long' })
                        }))}
                      />
                      
                      <Select
                        variant="outline"
                        size="sm"
                        value={exportYear}
                        onChange={(e) => setExportYear(parseInt(e.target.value))}
                        options={Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return { value: year, label: year.toString() };
                        })}
                      />
                      
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleExport}
                        className="w-full"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

      

      {/* Main Content */}
      <div className="pl-4 pr-4 mx-auto ">
        {/* Task List - Full width */}
        <TaskListView
          jiras={filteredJiras}
          viewBy={viewBy}
          onAddLog={handleAddLog}
          onEditJira={handleEditJira}
          onDeleteJira={handleDeleteJira}
          onSelectTask={(taskId) => {
            setSelectedTasks(prev => 
              prev.includes(taskId) 
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
            );
          }}
          selectedTasks={selectedTasks}
          externalStatuses={externalStatuses}
          updateOptimisticJira={updateOptimisticJira}
          rollbackOptimisticJiraUpdate={rollbackOptimisticJiraUpdate}
          deleteOptimisticJira={deleteOptimisticJira}
          rollbackOptimisticJiraDelete={rollbackOptimisticJiraDelete}
          updateOptimisticLog={updateOptimisticLog}
          rollbackOptimisticLogUpdate={rollbackOptimisticLogUpdate}
          deleteOptimisticLog={deleteOptimisticLog}
          rollbackOptimisticLogDelete={rollbackOptimisticLogDelete}
        />
      </div>

       {/* Combined Jira Form Modal */}
      <JiraFormModal
        isOpen={jiraFormModal.isOpen}
        onClose={jiraFormModal.close}
        jira={jiraFormModal.data} // Pass the Jira object for editing
        onSaveJira={handleSaveJira} // Universal save handler for add/edit
        userEmail={userEmail} // Pass user email for fetching Jira issues
      />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={calendarModal.isOpen}
        onClose={calendarModal.close}
        allJiras={filteredJiras}
      />

    </div>
  );
}