// app/(auth)/daily-logs/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faCalendar,
  faSearch,
  faRocket,
  faCalendarWeek,
  faProjectDiagram
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Button, Input, Select, LoadingSpinner, PageHeader, ErrorMessage } from '@/components/ui';

import { JiraFormModal, TaskListView } from '@/components/jira';
import { CalendarModal } from '@/components/calendar';
import { DailyLogsSummary } from '@/components/dashboard';
import UpcomingDeploymentsModal from '@/components/modals/UpcomingDeploymentsModal';
import WeeklyReportModal from '@/components/modals/WeeklyReportModal';
import TimelineModal from '@/components/modals/TimelineModal';

import { useJiras, useApiData } from '@/hooks/api';
import { useModal } from '@/hooks/ui';
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
  const deploymentsModal = useModal();
  const weeklyReportModal = useModal();
  const timelineModal = useModal();
  // Filter states using new hook
  const {
    filteredData: filteredJiras,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter
  } = useJiraFilter(allJiras);

  // Set default date filter if not set
  useEffect(() => {
    if (!activeFilters.dateRange) {
      setFilter('dateRange', 'thisMonth');
    }
  }, [activeFilters.dateRange, setFilter]);
  
  // Additional view states
  const [viewBy, setViewBy] = useState('list'); // list, project, service
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // External Jira statuses using new API hook
  const jiraNumbers = useMemo(() => {
    const numbers = [...new Set(allJiras.map(j => j.jiraNumber).filter(Boolean))];
    return numbers.join(',');
  }, [allJiras]);
  
  const {
    data: externalStatuses = {}
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

  // Calculate next week deployments count
  const nextWeekDeploymentsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfThisWeek = new Date(today);
    endOfThisWeek.setDate(today.getDate() + (7 - today.getDay()));

    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    let count = 0;

    allJiras.forEach(jira => {
      const deploymentStages = [
        jira.deploySitDate,
        jira.deployUatDate,
        jira.deployPreprodDate,
        jira.deployProdDate
      ];

      deploymentStages.forEach(dateString => {
        if (dateString) {
          const deployDate = new Date(dateString);
          deployDate.setHours(0, 0, 0, 0);

          // Check if deployment is in next week
          if (deployDate > endOfThisWeek && deployDate <= twoWeeksFromNow) {
            count++;
          }
        }
      });
    });

    return count;
  }, [allJiras]);

  // Debug: log filtered results
  console.log(`Date filter: ${activeFilters.dateRange || 'thisMonth'}, Active filters:`, activeFilters, `Total JIRAs: ${allJiras.length}, Filtered JIRAs: ${filteredJiras.length}`);

  // No longer needed - handled by useApiData hook

  // No longer needed - handled by useJiraFilter hook

  // No longer needed - using useJiraStats hook

  if (!isReady) {
    return <LoadingSpinner fullScreen size="xl" text="Loading..." />;
  }




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
        <div className="mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <PageHeader title="DAILY LOGS" />
        </div>

        {/* Stats */}
        <div className="mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <DailyLogsSummary stats={stats} externalStatuses={externalStatuses} allJiras={allJiras} />
        </div>
      </div>

      <div className="p-2 sm:p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            {/* Search Box */}
            <div className="flex-1 sm:min-w-0 relative">
              <Input
                size="sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Status Filter */}
              <Select
                size="sm"
                value={activeFilters.status || 'all'}
                onChange={(e) => setFilter('status', e.target.value)}
                className="w-full sm:w-auto"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'In Progress' },
                  { value: 'done', label: 'Done' }
                ]}
              />

              {/* Date Filter */}
              <Select
                size="sm"
                value={activeFilters.dateRange || 'thisMonth'}
                onChange={(e) => setFilter('dateRange', e.target.value)}
                className="w-full sm:w-auto"
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'thisWeek', label: 'This Week' },
                  { value: 'thisMonth', label: 'This Month' }
                ]}
              />

              {/* View Filter */}
              <Select
                size="sm"
                value={viewBy}
                onChange={(e) => setViewBy(e.target.value)}
                className="w-full sm:w-auto"
                options={[
                  { value: 'list', label: 'List View' },
                  { value: 'project', label: 'Group by Project' },
                  { value: 'service', label: 'Group by Service' }
                ]}
              />
            </div>
            </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => jiraFormModal.open()}
              className="flex-1 sm:flex-none justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs mr-2" />
              New Task
            </Button>

            {selectedTasks.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-none justify-center"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs mr-2" />
                Delete ({selectedTasks.length})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => calendarModal.open()}
              className="flex-1 sm:flex-none justify-center"
            >
              <FontAwesomeIcon icon={faCalendar} className="text-xs mr-2" />
              <span className="hidden sm:inline">Month Summary</span>
              <span className="sm:hidden">Summary</span>
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => deploymentsModal.open()}
                className="flex-1 sm:flex-none justify-center"
              >
                <FontAwesomeIcon icon={faRocket} className="text-xs mr-2" />
                Deployments
              </Button>
              {nextWeekDeploymentsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {nextWeekDeploymentsCount > 9 ? '9+' : nextWeekDeploymentsCount}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => weeklyReportModal.open()}
              className="flex-1 sm:flex-none justify-center"
            >
              <FontAwesomeIcon icon={faCalendarWeek} className="text-xs mr-2" />
              <span className="hidden sm:inline">Weekly Report</span>
              <span className="sm:hidden">Weekly</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => timelineModal.open()}
              className="flex-1 sm:flex-none justify-center"
            >
              <FontAwesomeIcon icon={faProjectDiagram} className="text-xs mr-2" />
              <span className="hidden sm:inline">Timeline</span>
              <span className="sm:hidden">Timeline</span>
            </Button>

          </div>
        </div>

        {/* Main Content */}
        <div className="px-2 sm:px-4 mx-auto">
        {/* Task List - Full width */}
        <TaskListView
          jiras={filteredJiras}
          viewBy={viewBy}
          dateRange={activeFilters.dateRange || 'thisMonth'}
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

      {/* Upcoming Deployments Modal */}
      <UpcomingDeploymentsModal
        isOpen={deploymentsModal.isOpen}
        onClose={deploymentsModal.close}
        allJiras={allJiras}
      />

      {/* Weekly Report Modal */}
      <WeeklyReportModal
        isOpen={weeklyReportModal.isOpen}
        onClose={weeklyReportModal.close}
        allJiras={allJiras}
      />

      {/* Timeline Modal */}
      <TimelineModal
        isOpen={timelineModal.isOpen}
        onClose={timelineModal.close}
        allJiras={allJiras}
      />

    </div>
  );
}