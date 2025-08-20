// app/(auth)/daily-logs/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash,
  faCalendar,
  faFileExport, 
  faSearch,
  faCopy
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

  // Set default date filter if not set
  useEffect(() => {
    if (!activeFilters.dateRange) {
      setFilter('dateRange', 'thisMonth');
    }
  }, [activeFilters.dateRange, setFilter]);
  
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
  
  // Debug: log filtered results
  console.log(`Date filter: ${activeFilters.dateRange || 'thisMonth'}, Active filters:`, activeFilters, `Total JIRAs: ${allJiras.length}, Filtered JIRAs: ${filteredJiras.length}`);

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

  const formatDateRange = (range) => {
    const now = new Date();
    
    switch (range) {
      case 'today':
        return now.toDateString() === now.toDateString();
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return { start: weekStart, end: weekEnd };
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: monthStart, end: monthEnd };
      default:
        return null;
    }
  };

  const isDateInRange = (logDate, range) => {
    if (range === 'all') return true;
    
    const targetDate = new Date(logDate);
    const now = new Date();
    
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
      default:
        return true;
    }
  };

  const handleCopyWorkSummary = async () => {
    try {
      let summaryContent = [];

      const formatJiraContentAsTable = (jira, isFirstInGroup = false) => {
        // Filter daily logs to last 2 months only for Copy Summary
        const now = new Date();
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        
        const filteredLogs = jira.dailyLogs ? jira.dailyLogs.filter(log => {
          const logDate = new Date(log.logDate);
          return logDate >= twoMonthsAgo;
        }) : [];

        const project = jira.projectName || '';
        const service = jira.serviceName || '';
        const jiraStatus = externalStatuses[jira.jiraNumber] || '';
        const actualStatus = jira.actualStatus || 'No Status';
        
        // Format daily logs - join with line breaks for better readability
        const dailyLogText = filteredLogs.length > 0 ? 
          filteredLogs
            .sort((a, b) => new Date(a.logDate) - new Date(b.logDate))
            .map(log => {
              const logDate = new Date(log.logDate).toLocaleDateString('en-GB');
              return `${logDate}: ${log.taskDescription} (${log.timeSpent}h)`;
            })
            .join('\r\n') : '-';
        
        // Format deploy dates - join with line breaks for better readability
        const deployDates = [
          jira.deploySitDate ? `SIT: ${new Date(jira.deploySitDate).toLocaleDateString('en-GB')}` : '',
          jira.deployUatDate ? `UAT: ${new Date(jira.deployUatDate).toLocaleDateString('en-GB')}` : '',
          jira.deployPreprodDate ? `PREPROD: ${new Date(jira.deployPreprodDate).toLocaleDateString('en-GB')}` : '',
          jira.deployProdDate ? `PROD: ${new Date(jira.deployProdDate).toLocaleDateString('en-GB')}` : ''
        ].filter(Boolean).join('\r\n') || '-';
        
        // Create table row with Project column
        return `${project}\t${service}\t${jira.jiraNumber}\t${jira.description}\t${jiraStatus}\t${actualStatus}\t${dailyLogText}\t${deployDates}`;
      };

      // Create table headers
      summaryContent.push('Project\tService\tJira Number\tDescription\tJira Status\tActual Status\tDaily Log\tDeploy Date');
      summaryContent.push(''); // Empty row for spacing

      // Generate content based on viewBy filter
      if (viewBy === 'project') {
        // Group by Project
        const groupedByProject = {};
        filteredJiras.forEach(jira => {
          const project = jira.projectName || 'No Project';
          if (!groupedByProject[project]) {
            groupedByProject[project] = [];
          }
          groupedByProject[project].push(jira);
        });

        Object.entries(groupedByProject).forEach(([project, jiras], groupIndex) => {
          if (groupIndex > 0) summaryContent.push(''); // Add spacing between projects
          summaryContent.push(`PROJECT: ${project}`);
          summaryContent.push('Project\tService\tJira Number\tDescription\tJira Status\tActual Status\tDaily Log\tDeploy Date');
          
          // Sort jiras within project by Service then Jira Status
          const sortedJiras = [...jiras].sort((a, b) => {
            const serviceA = (a.serviceName || '').toLowerCase();
            const serviceB = (b.serviceName || '').toLowerCase();
            if (serviceA !== serviceB) {
              return serviceA.localeCompare(serviceB);
            }
            const statusA = (externalStatuses[a.jiraNumber] || '').toLowerCase();
            const statusB = (externalStatuses[b.jiraNumber] || '').toLowerCase();
            return statusA.localeCompare(statusB);
          });
          
          sortedJiras.forEach(jira => {
            summaryContent.push(formatJiraContentAsTable(jira));
          });
        });

      } else if (viewBy === 'service') {
        // Group by Service
        const groupedByService = {};
        filteredJiras.forEach(jira => {
          const service = jira.serviceName || 'No Service';
          if (!groupedByService[service]) {
            groupedByService[service] = [];
          }
          groupedByService[service].push(jira);
        });

        Object.entries(groupedByService).forEach(([service, jiras], serviceIndex) => {
          if (serviceIndex > 0) summaryContent.push(''); // Add spacing between services
          summaryContent.push(`SERVICE: ${service}`);
          
          // Group by project within service
          const projectsInService = {};
          jiras.forEach(jira => {
            const project = jira.projectName || 'No Project';
            if (!projectsInService[project]) {
              projectsInService[project] = [];
            }
            projectsInService[project].push(jira);
          });

          Object.entries(projectsInService).forEach(([project, projectJiras], projectIndex) => {
            if (projectIndex > 0) summaryContent.push('');
            summaryContent.push(`  PROJECT: ${project}`);
            summaryContent.push('Project\tService\tJira Number\tDescription\tJira Status\tActual Status\tDaily Log\tDeploy Date');
            
            // Sort jiras within project by Jira Status
            const sortedProjectJiras = [...projectJiras].sort((a, b) => {
              const statusA = (externalStatuses[a.jiraNumber] || '').toLowerCase();
              const statusB = (externalStatuses[b.jiraNumber] || '').toLowerCase();
              return statusA.localeCompare(statusB);
            });
            
            sortedProjectJiras.forEach(jira => {
              summaryContent.push(formatJiraContentAsTable(jira));
            });
          });
        });

      } else {
        // List view - Simple table without grouping with sorting
        const sortedJiras = [...filteredJiras].sort((a, b) => {
          // Sort by Project first
          const projectA = (a.projectName || '').toLowerCase();
          const projectB = (b.projectName || '').toLowerCase();
          if (projectA !== projectB) {
            return projectA.localeCompare(projectB);
          }
          
          // Then by Service
          const serviceA = (a.serviceName || '').toLowerCase();
          const serviceB = (b.serviceName || '').toLowerCase();
          if (serviceA !== serviceB) {
            return serviceA.localeCompare(serviceB);
          }
          
          // Finally by Jira Status
          const statusA = (externalStatuses[a.jiraNumber] || '').toLowerCase();
          const statusB = (externalStatuses[b.jiraNumber] || '').toLowerCase();
          return statusA.localeCompare(statusB);
        });
        
        sortedJiras.forEach(jira => {
          summaryContent.push(formatJiraContentAsTable(jira));
        });
      }

      const summaryText = summaryContent.join('\n');
      await navigator.clipboard.writeText(summaryText);
      toast.success('Work summary copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy work summary');
      console.error('Copy failed:', error);
    }
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
        <div className="mx-auto px-6 py-8">
          <PageHeader title="DAILY LOGS" />
        </div>
        
        {/* Stats */}
        <div className="mx-auto px-6 pb-6">
          <DailyLogsSummary stats={stats} />
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search and Filters */}
            <div className="flex gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <Input
                  size="sm"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
              </div>

              {/* Status Filter */}
              <Select
                size="sm"
                value={activeFilters.status || 'all'}
                onChange={(e) => setFilter('status', e.target.value)}
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
                options={[
                  { value: 'list', label: 'List View' },
                  { value: 'project', label: 'Group by Project' },
                  { value: 'service', label: 'Group by Service' }
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
                  <FontAwesomeIcon icon={faTrash} className="text-xs mr-2" />
                  Delete ({selectedTasks.length})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => calendarModal.open()}
              >
                <FontAwesomeIcon icon={faCalendar} className="text-xs mr-2" />              
                  Month Summary
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyWorkSummary}
                title="Copy work summary based on current filters"
              >
                <FontAwesomeIcon icon={faCopy} className="text-xs mr-2" />
                Copy Summary
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('exportMenu')}
                >
                  <FontAwesomeIcon icon={faFileExport} className="text-xs mr-2" />
                  Export
                </Button>

                {modals.exportMenu?.isOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg p-4 z-50">
                    <div className="space-y-3">
                      <Select
                        size="sm"
                        value={exportMonth}
                        onChange={(e) => setExportMonth(parseInt(e.target.value))}
                        options={Array.from({ length: 12 }, (_, i) => ({
                          value: i + 1,
                          label: new Date(0, i).toLocaleString('default', { month: 'long' })
                        }))}
                      />
                      
                      <Select
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