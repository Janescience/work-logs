// app/(auth)/daily-logs/page.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSpinner, 
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import JiraFormModal from '@/components/JiraFormModal';
import CalendarModal from '@/components/CalendarModal';
import TaskListView from '@/components/TaskListView';
import DailyLogsSummary from '@/components/DailyLogsSummary';

import useJiras from '@/hooks/useJiras';

export default function DailyLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email; // Get user email from session

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

  // UI States
  const [showJiraFormModal, setShowJiraFormModal] = useState(false); // Use the new modal state
  const [editingJira, setEditingJira] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [viewBy, setViewBy] = useState('list'); // list, project, service
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // Export States
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // External Jira statuses
  const [externalStatuses, setExternalStatuses] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch external JIRA statuses
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
      }
    };

    fetchAllJiraStatuses();
  }, [allJiras]);

  // Filter jiras based on search, status, and date range
  const filteredJiras = useMemo(() => {
    let filtered = [...allJiras];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(jira => 
        jira.jiraNumber?.toLowerCase().includes(query) ||
        jira.description?.toLowerCase().includes(query) ||
        jira.projectName?.toLowerCase().includes(query) ||
        jira.serviceName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(jira => {
        const status = jira.actualStatus?.toLowerCase() || '';
        switch (statusFilter) {
          case 'active': return status === 'in progress';
          case 'done': return status === 'done';
          case 'cancelled': return status === 'cancel';
          default: return true;
        }
      });
    }

    // Date range filter
    if (dateRange !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      
      filtered = filtered.filter(jira => {
        // Check if jira has logs in the date range
        const hasLogsInRange = jira.dailyLogs.some(log => {
          const logDate = new Date(log.logDate);
          
          switch (dateRange) {
            case 'today':
              return logDate.toDateString() === startOfToday.toDateString();
            case 'thisWeek':
              const weekStart = new Date(startOfToday);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              return logDate >= weekStart;
            case 'thisMonth':
              return logDate.getMonth() === today.getMonth() && 
                     logDate.getFullYear() === today.getFullYear();
            default:
              return true;
          }
        });

        // For tasks without logs, check creation date
        if (!hasLogsInRange && jira.dailyLogs.length === 0) {
          const createdDate = new Date(jira.createdAt);
          
          switch (dateRange) {
            case 'today':
              return createdDate.toDateString() === startOfToday.toDateString();
            case 'thisWeek':
              const weekStart = new Date(startOfToday);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              return createdDate >= weekStart;
            case 'thisMonth':
              return createdDate.getMonth() === today.getMonth() && 
                     createdDate.getFullYear() === today.getFullYear();
            default:
              return true;
          }
        }

        return hasLogsInRange;
      });
    }

    return filtered;
  }, [allJiras, searchQuery, statusFilter, dateRange]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    let todayHours = 0;
    let weekHours = 0;
    let monthHours = 0;
    let activeCount = 0;
    let doneCount = 0;

    filteredJiras.forEach(jira => {
      const status = jira.actualStatus?.toLowerCase() || '';
      if (status === 'in progress') activeCount++;
      if (status === 'done') doneCount++;

      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        const hours = parseFloat(log.timeSpent || 0);
        
        if (logDate.toDateString() === today.toDateString()) {
          todayHours += hours;
        }
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        if (logDate >= weekStart) {
          weekHours += hours;
        }
        
        if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
          monthHours += hours;
        }
      });
    });

    return {
      totalTasks: filteredJiras.length,
      activeCount,
      doneCount,
      todayHours,
      weekHours,
      monthHours
    };
  }, [filteredJiras]);

  if (!session) {
    return null;
  }

  const handleExport = async () => {
    const startDate = new Date(exportYear, exportMonth - 1, 1).toISOString();
    const lastDay = new Date(exportYear, exportMonth, 0).getDate();
    const endDate = new Date(exportYear, exportMonth - 1, lastDay, 23, 59, 59, 999).toISOString();

    await new Promise(resolve => setTimeout(resolve, 300)); 
    window.location.href = `/api/export/excel?startDate=${startDate}&endDate=${endDate}`;
    setShowExportMenu(false);
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
      setShowJiraFormModal(false);
      setEditingJira(null); // Clear editing Jira
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
    setEditingJira(jira);
    setShowJiraFormModal(true);
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
      <div className="flex justify-center items-center min-h-screen bg-white text-black">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-black mr-2" /> 
        Loading Daily Logs...
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
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-6 py-6">
          <div className="flex items-center justify-center mb-6">
            <div>
              <h1 className="text-2xl font-light text-black">DAILY LOGS</h1>
              <div className="w-14 h-px bg-black mx-auto mt-4"></div> {/* Divider */}
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto">
            <DailyLogsSummary stats={summaryStats} />
          </div>
          
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search and Filters */}
            <div className="flex gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-black transition-colors"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
              </div>

              {/* Filters */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="thisWeek">Week</option>
                <option value="thisMonth">Month</option>
              </select>

              <select
                value={viewBy}
                onChange={(e) => setViewBy(e.target.value)}
                className="text-sm py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="list">List</option>
                <option value="project">Project</option>
                <option value="service">Service</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button 
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                onClick={() => {
                  setEditingJira(null);
                  setShowJiraFormModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                New Task
              </button>

              {selectedTasks.length > 0 && (
                <button 
                  className="px-3 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                  onClick={handleBulkDelete}
                >
                  Delete ({selectedTasks.length})
                </button>
              )}

              <button
                onClick={() => setShowCalendarModal(true)}
                className="px-3 py-2 text-sm border border-gray-300 bg-white text-black hover:bg-gray-50 transition-colors"
              >
                Calendar
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-2 text-sm border border-gray-300 bg-white text-black hover:bg-gray-50 transition-colors"
                >
                  Export
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg p-4 z-50">
                    <div className="space-y-3">
                      <select
                        value={exportMonth}
                        onChange={(e) => setExportMonth(parseInt(e.target.value))}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <select
                        value={exportYear}
                        onChange={(e) => setExportYear(parseInt(e.target.value))}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                      >
                        Download
                      </button>
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
        isOpen={showJiraFormModal}
        onClose={() => {
          setShowJiraFormModal(false);
          setEditingJira(null); // Clear editing Jira when closing modal
        }}
        jira={editingJira} // Pass the Jira object for editing
        onSaveJira={handleSaveJira} // Universal save handler for add/edit
        userEmail={userEmail} // Pass user email for fetching Jira issues
      />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        allJiras={filteredJiras}
      />

    </div>
  );
}