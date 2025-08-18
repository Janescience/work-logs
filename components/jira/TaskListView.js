// components/TaskListView.js
'use client';
import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faSquare, faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import { JiraItem } from '@/components/jira';

const TaskListView = ({ 
  jiras, 
  viewBy, 
  dateRange,
  onAddLog, 
  onEditJira, 
  onDeleteJira,
  onSelectTask,
  selectedTasks,
  externalStatuses,
  updateOptimisticJira,
  rollbackOptimisticJiraUpdate,
  deleteOptimisticJira,
  rollbackOptimisticJiraDelete,
  updateOptimisticLog,
  rollbackOptimisticLogUpdate,
  deleteOptimisticLog,
  rollbackOptimisticLogDelete
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Group jiras based on viewBy
  const groupedJiras = useMemo(() => {
    if (viewBy === 'list') {
      // Sort by latest daily log or creation date
      const sortedJiras = [...jiras].sort((a, b) => {
        // Get latest log date for each jira
        const getLatestLogDate = (jira) => {
          if (jira.dailyLogs && jira.dailyLogs.length > 0) {
            return Math.max(...jira.dailyLogs.map(log => new Date(log.logDate).getTime()));
          }
          return new Date(jira.createdAt).getTime();
        };
        
        const dateA = getLatestLogDate(a);
        const dateB = getLatestLogDate(b);
        
        return dateB - dateA; // Sort descending (newest first)
      });
      
      return { 'All Tasks': sortedJiras };
    }

    const groups = {};
    jiras.forEach(jira => {
      let groupKey = 'Others';
      
      if (viewBy === 'project' && jira.projectName) {
        groupKey = jira.projectName;
      } else if (viewBy === 'service' && jira.serviceName) {
        groupKey = jira.serviceName;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(jira);
    });

    // Sort groups and jiras within groups by latest activity
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        // Get latest log date for each jira
        const getLatestLogDate = (jira) => {
          if (jira.dailyLogs && jira.dailyLogs.length > 0) {
            return Math.max(...jira.dailyLogs.map(log => new Date(log.logDate).getTime()));
          }
          return new Date(jira.createdAt).getTime();
        };
        
        const dateA = getLatestLogDate(a);
        const dateB = getLatestLogDate(b);
        
        return dateB - dateA; // Sort descending (newest first)
      });
    });

    return groups;
  }, [jiras, viewBy]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      jiras.forEach(jira => {
        if (selectedTasks.includes(jira._id)) {
          onSelectTask(jira._id);
        }
      });
    } else {
      // Select all visible
      jiras.forEach(jira => {
        if (!selectedTasks.includes(jira._id)) {
          onSelectTask(jira._id);
        }
      });
    }
    setSelectAll(!selectAll);
  };

  // Calculate group statistics
  const getGroupStats = (groupJiras) => {
    let totalHours = 0;
    let activeCount = 0;
    
    groupJiras.forEach(jira => {
      if (jira.actualStatus?.toLowerCase() === 'in progress') activeCount++;
      if (Array.isArray(jira.dailyLogs)) {
        jira.dailyLogs.forEach(log => {
          totalHours += parseFloat(log.timeSpent || 0);
        });
      }
    });

    return { totalHours, activeCount };
  };

  if (jiras.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No tasks found. Try adjusting your filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with Select All */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-gray-600 hover:text-black transition-colors"
          >
            <FontAwesomeIcon 
              icon={selectAll ? faCheckSquare : faSquare} 
              className="text-lg"
            />
          </button>
          <span className="text-sm text-gray-600">
            {selectedTasks.length > 0 ? `${selectedTasks.length} selected` : 'Select all'}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {jiras.length} task{jiras.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Task Groups */}
      <div className="divide-y divide-gray-200">
        {Object.entries(groupedJiras).map(([groupName, groupJiras]) => {
          const isExpanded = expandedGroups[groupName] !== false;
          const stats = getGroupStats(groupJiras);
          
          return (
            <div key={groupName}>
              {/* Group Header */}
              {viewBy !== 'list' && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon 
                      icon={isExpanded ? faChevronUp : faChevronDown} 
                      className="text-gray-500"
                    />
                    <h3 className="font-medium text-gray-900">{groupName}</h3>
                    <span className="text-sm text-gray-500">({groupJiras.length})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {stats.activeCount > 0 && (
                      <span>{stats.activeCount} active</span>
                    )}
                    {stats.totalHours > 0 && (
                      <span>{stats.totalHours.toFixed(1)} hours</span>
                    )}
                  </div>
                </button>
              )}

              {/* Task Items */}
              {(viewBy === 'list' || isExpanded) && (
                <div className="divide-y divide-gray-100">
                  {groupJiras.map(jira => (
                    <div key={jira._id} className="relative">
                      {/* Selection Checkbox */}
                      <div className="absolute left-4 top-6 z-10">
                        <button
                          onClick={() => onSelectTask(jira._id)}
                          className="text-gray-400 hover:text-black transition-colors"
                        >
                          <FontAwesomeIcon 
                            icon={selectedTasks.includes(jira._id) ? faCheckSquare : faSquare} 
                            className="text-lg"
                          />
                        </button>
                      </div>
                      
                      {/* Jira Item with padding for checkbox */}
                      <div className="pl-12">
                        <JiraItem
                          jira={jira}
                          dateRange={dateRange}
                          logOptions={[]}
                          onAddLog={onAddLog}
                          onEditJira={onEditJira}
                          onDeleteJira={onDeleteJira}
                          fetchJiras={() => {}}
                          updateOptimisticJira={updateOptimisticJira}
                          rollbackOptimisticJiraUpdate={rollbackOptimisticJiraUpdate}
                          deleteOptimisticJira={deleteOptimisticJira}
                          rollbackOptimisticJiraDelete={rollbackOptimisticJiraDelete}
                          updateOptimisticLog={updateOptimisticLog}
                          rollbackOptimisticLogUpdate={rollbackOptimisticLogUpdate}
                          deleteOptimisticLog={deleteOptimisticLog}
                          rollbackOptimisticLogDelete={rollbackOptimisticLogDelete}
                          externalStatus={externalStatuses?.[jira.jiraNumber]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskListView;