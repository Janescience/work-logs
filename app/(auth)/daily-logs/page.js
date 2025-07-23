// app/(auth)/daily-logs/page.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSpinner, 
  faSearch,
  faFilter,
  faCalendarDays,
  faFileExport,
  faChevronDown,
  faChevronUp,
  faListCheck,
  faClock,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import AddJiraModal from '@/components/AddJiraModal';
import EditJiraModal from '@/components/EditJiraModal';
import WorkCalendar from '@/components/WorkCalendar';
import TaskListView from '@/components/TaskListView';
import DailyLogsSummary from '@/components/DailyLogsSummary';

import useJiras from '@/hooks/useJiras';

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

  // UI States
  const [showAddJiraModal, setShowAddJiraModal] = useState(false);
  const [editingJira, setEditingJira] = useState(null);
  const [showEditJiraModal, setShowEditJiraModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

        return hasLogsInRange || (dateRange === 'all');
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
    let overdueCount = 0;

    filteredJiras.forEach(jira => {
      const status = jira.actualStatus?.toLowerCase() || '';
      if (status === 'in progress') activeCount++;
      if (status === 'done') doneCount++;
      
      if (jira.dueDate && status !== 'done') {
        const dueDate = new Date(jira.dueDate);
        if (dueDate < today) overdueCount++;
      }

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
      overdueCount,
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

  const handleAddJira = async (newJiraData) => {
    try {
      const res = await fetch('/api/jiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJiraData),
      });
      if (res.ok) {
        toast.success('Task added successfully!');
        setShowAddJiraModal(false);
        fetchJiras();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to add task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Error adding task.');
      console.error('Error adding task:', error);
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
      toast.success('Task updated successfully!');
      closeEditJiraModal();

      const response = await fetch(`/api/jiras/${jiraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJiraData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task on server');
      }

    } catch (error) {
      if (originalJira) {
        rollbackOptimisticJiraUpdate(jiraId, originalJira);
      }
      toast.error(`Failed to update task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteJira = async (jiraId) => {
    if (window.confirm('Are you sure you want to delete this task and all its logs?')) {
      let deletedJira = null;
      try {
        deletedJira = deleteOptimisticJira(jiraId);
        toast.success('Task deleted successfully!');

        const response = await fetch(`/api/jiras/${jiraId}`, {
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-light text-black">Daily Logs</h1>
            <div className="w-16 h-px bg-black mx-auto mt-2"></div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="all">All Status</option>
                <option value="active">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className=" py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
              </select>

              {/* View By */}
              <select
                value={viewBy}
                onChange={(e) => setViewBy(e.target.value)}
                className="py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black"
              >
                <option value="list">List View</option>
                <option value="project">By Project</option>
                <option value="service">By Service</option>
              </select>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-black text-white font-light hover:bg-gray-800 transition-colors flex items-center gap-2 rounded"
                  onClick={() => setShowAddJiraModal(true)}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  New Task
                </button>

                {selectedTasks.length > 0 && (
                  <button 
                    className="px-4 py-2 bg-red-600 text-white font-light hover:bg-red-700 transition-colors rounded"
                    onClick={handleBulkDelete}
                  >
                    Delete ({selectedTasks.length})
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {/* Calendar Toggle */}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`px-4 py-2 border ${showCalendar ? 'bg-black text-white' : 'bg-white text-black'} 
                    border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-2 rounded`}
                >
                  <FontAwesomeIcon icon={faCalendarDays} />
                  <span className="hidden sm:inline">Month Summary</span>
                </button>

                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 border border-gray-300 bg-white text-black hover:bg-gray-100 
                      transition-colors flex items-center gap-2 rounded"
                  >
                    <FontAwesomeIcon icon={faFileExport} />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                      <h3 className="font-medium mb-3 text-black">Export Options</h3>
                      <div className="space-y-2">
                        <select
                          value={exportMonth}
                          onChange={(e) => setExportMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black text-black"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black text-black"
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleExport}
                          className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors rounded"
                        >
                          Download Excel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 sm:px-6 py-4">
        <DailyLogsSummary stats={summaryStats} />
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 pb-6">
        <div className={`grid grid-cols-1 gap-6`}>

          {/* Calendar View */}
          {showCalendar && (
            <div className={isMobile ? 'mt-6' : ''}>
              <div className="sticky top-32">
                <WorkCalendar allJiras={filteredJiras} />
              </div>
            </div>
          )}

          {/* Task List */}
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
    </div>
  );
}