// components/JiraItem.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faDatabase, faServer, faTrash, faPencil, 
  faSave, faTimes, faShareSquare, faClock,
  faChevronDown, faChevronUp , faRocket
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { DeployModal, DetailModal } from '@/components/modals';
import { formatDate } from '@/utils/dateUtils';
import { Button, Input } from '@/components/ui';

const JiraItem = ({
  jira,
  dateRange,
  onAddLog,
  onEditJira,
  onDeleteJira,
  updateOptimisticLog,
  rollbackOptimisticLogUpdate,
  deleteOptimisticLog,
  rollbackOptimisticLogDelete,
  externalStatus,
  readOnly = false,
  compact = false
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalDetailType, setModalDetailType] = useState(null);
  const [modalDetailContent, setModalDetailContent] = useState('');
  const [jiraTotalHours, setJiraTotalHours] = useState(0);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editedLogData, setEditedLogData] = useState({});
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  
  // Quick Add Log Form States
  const [quickLogDate, setQuickLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [quickLogDescription, setQuickLogDescription] = useState('');
  const [quickLogHours, setQuickLogHours] = useState('');

  // Date filtering function
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

  useEffect(() => {
    // Calculate total hours for filtered logs only
    const filteredLogs = jira.dailyLogs.filter(log => 
      isDateInRange(log.logDate, dateRange || 'thisMonth')
    );
    const jiraSum = filteredLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
    setJiraTotalHours(jiraSum);
  }, [jira.dailyLogs, dateRange]);

  const sortedDailyLogs = useMemo(() => {
    if (!jira.dailyLogs || jira.dailyLogs.length === 0) {
      return [];
    }
    
    // Filter logs by date range first
    const filteredLogs = jira.dailyLogs.filter(log => 
      isDateInRange(log.logDate, dateRange || 'thisMonth')
    );
    
    return filteredLogs.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
  }, [jira.dailyLogs, dateRange]);

  const recentLogs = sortedDailyLogs.slice(0, 3);
  const hasMoreLogs = sortedDailyLogs.length > 3;

  const handleQuickAddLog = async (e) => {
    e.preventDefault();
    if (!quickLogDescription || !quickLogHours) {
      toast.warning('Please fill in all fields');
      return;
    }

    await onAddLog(jira._id, {
      logDate: quickLogDate,
      taskDescription: quickLogDescription,
      timeSpent: parseFloat(quickLogHours),
      envDetail: '',
      sqlDetail: ''
    });

    // Reset form
    setQuickLogDate(new Date().toISOString().slice(0, 10));
    setQuickLogDescription('');
    setQuickLogHours('');
    setShowAddLogForm(false);
  };

  const handleDeleteLog = async (jiraId, logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    let deletedLog = null;
    try {
      deletedLog = deleteOptimisticLog(jiraId, logId);
      toast.success('Log deleted successfully!');

      const response = await fetch(`/api/jiras/${jiraId}/logs?logId=${logId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete log on server');
      }
    } catch (error) {
      if (deletedLog) {
        rollbackOptimisticLogDelete(jiraId, deletedLog);
      }
      toast.error(`Failed to delete log: ${error.message}`);
    }
  };

  const handleEditLog = (log) => {
    setEditingLogId(log._id);
    setEditedLogData({
      logDate: log.logDate,
      timeSpent: log.timeSpent,
      taskDescription: log.taskDescription,
      envDetail: log.envDetail || '',
      sqlDetail: log.sqlDetail || ''
    });
  };

  const handleSaveEditLog = async () => {
    if (!editedLogData.taskDescription || !editedLogData.timeSpent) {
      toast.warning('Please fill in all required fields');
      return;
    }

    const originalLog = jira.dailyLogs.find(log => log._id === editingLogId);
    if (!originalLog) {
      toast.error('Log not found');
      return;
    }

    try {
      // Optimistic update
      updateOptimisticLog(jira._id, editingLogId, editedLogData);
      toast.success('Log updated successfully!');

      const response = await fetch(`/api/jiras/${jira._id}/logs?logId=${editingLogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logId: editingLogId,
          ...editedLogData,
          timeSpent: parseFloat(editedLogData.timeSpent)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update log on server');
      }

      setEditingLogId(null);
      setEditedLogData({});
    } catch (error) {
      // Rollback optimistic update
      rollbackOptimisticLogUpdate(jira._id, editingLogId, originalLog);
      toast.error(`Failed to update log: ${error.message}`);
    }
  };

  const handleCancelEditLog = () => {
    setEditingLogId(null);
    setEditedLogData({});
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'done') return 'bg-green-100 text-green-800';
    if (s === 'in progress') return 'bg-blue-100 text-blue-800';
    if (s === 'cancel' || s === 'cancelled') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getDaysAgo = (date) => {
    const today = new Date();
    const logDate = new Date(date);
    const diffTime = today - logDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
  };

  const truncateDescription = (description) => {
    if (!description) return '';
    return description.length > 120 ? `${description.substring(0, 120)}...` : description;
  };

  const openDetailModal = (type, content) => {
    setModalDetailType(type);
    setModalDetailContent(content);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setModalDetailType(null);
    setModalDetailContent('');
  };

  // Don't show the full component if in compact mode - the CompactTaskListView handles the display
  if (compact) {
    return (
      <div className="p-3 space-y-3">
        {/* Daily Logs Only */}
        {sortedDailyLogs.length > 0 ? (
          <div className="space-y-2">
            {sortedDailyLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-gray-500 shrink-0">
                    {getDaysAgo(log.logDate)}
                  </span>
                  <span className="text-gray-700 truncate">
                    {log.taskDescription}
                  </span>
                </div>
                <span className="text-gray-600 font-medium shrink-0">
                  {log.timeSpent}h
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xs py-2">
            No logs found
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group hover:bg-gray-50 transition-all duration-200">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left Side - Task Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div className="w-full">
                {/* Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <a
                      href={`https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${jira.jiraNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap transition-colors"
                      title="Open in JIRA"
                    >
                      {jira.jiraNumber}
                    </a>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <h3 className="text-sm font-medium text-gray-900 break-words min-w-0">{jira.description}</h3>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {jira.envDetail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal('Environment Detail', jira.envDetail)}
                        title="View Environment Details"
                      >
                        <FontAwesomeIcon icon={faServer} size="xs" />
                      </Button>
                    )}
                    {jira.sqlDetail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal('SQL Detail', jira.sqlDetail)}
                        title="View SQL Details"
                      >
                        <FontAwesomeIcon icon={faDatabase} size="xs" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {jira.projectName && (
                    <span className="px-2 py-1 bg-gray-100 rounded">{jira.projectName}</span>
                  )}
                  {jira.serviceName && (
                    <span className="px-2 py-1 bg-gray-200 rounded">{jira.serviceName.toUpperCase()}</span>
                  )}
                  {externalStatus && (
                    <span className="px-2 py-1 bg-gray-900 text-white rounded">
                      JIRA: {externalStatus}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded ${getStatusColor(jira.actualStatus)}`}>
                    {jira.actualStatus || 'No Status'}
                  </span>
                  {/* {jira.dueDate && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendarDays} />
                      Due {formatDate(jira.dueDate)}
                    </span>
                  )} */}
                  {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      const deployments = [
                        { type: 'SIT', date: jira.deploySitDate },
                        { type: 'UAT', date: jira.deployUatDate },
                        { type: 'PREPROD', date: jira.deployPreprodDate },
                        { type: 'PROD', date: jira.deployProdDate }
                      ].filter(d => d.date && new Date(d.date) >= today);
                      
                      const nextDeploy = deployments[0];
                      
                      return nextDeploy ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded">
                          <FontAwesomeIcon icon={faRocket} className="text-xs" />
                          Next: {nextDeploy.type} {formatDate(nextDeploy.date)}
                        </span>
                      ) : null;
                    })()}
                </div>

                {/* Recent Logs Preview */}
                {recentLogs.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {recentLogs.map(log => (
                      <div key={log._id} className="group">
                        {editingLogId === log._id ? (
                          // Edit Mode for Recent Logs - Full width layout
                          <div className="space-y-2 p-3 bg-gray-50 rounded">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <Input
                                type="date"
                                value={editedLogData.logDate?.split('T')[0] || ''}
                                onChange={(e) => setEditedLogData({...editedLogData, logDate: e.target.value})}
                                size="sm"
                                className="w-full sm:w-auto"
                              />
                              <Input
                                type="number"
                                step="0.5"
                                value={editedLogData.timeSpent || ''}
                                onChange={(e) => setEditedLogData({...editedLogData, timeSpent: e.target.value})}
                                size="sm"
                                className="w-full sm:w-20"
                                placeholder="Hours"
                              />
                            </div>
                            <Input
                              as="textarea"
                              rows={3}
                              value={editedLogData.taskDescription || ''}
                              onChange={(e) => setEditedLogData({...editedLogData, taskDescription: e.target.value})}
                              size="sm"
                              className="w-full"
                              placeholder="Task description"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEditLog}
                                title="Save"
                                className="text-green-600 hover:text-green-800"
                              >
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditLog}
                                title="Cancel"
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode for Recent Logs
                          <div className="group">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 hover:bg-gray-50 rounded">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-600 flex-1">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                  <span className="font-medium">{log.timeSpent}h</span>
                                  <span className="text-gray-500">{getDaysAgo(log.logDate)}</span>
                                </div>
                                <div className="text-gray-700 text-sm sm:text-xs break-words">
                                  {log.taskDescription}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-auto sm:ml-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLog(log)}
                                  title="Edit log"
                                  className="text-gray-400 hover:text-blue-600"
                                >
                                  <FontAwesomeIcon icon={faPencil} className="text-xs" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLog(jira._id, log._id)}
                                  title="Delete log"
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {hasMoreLogs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLogs(!showLogs)}
                        className="text-xs text-gray-500 hover:text-black"
                      >
                        <FontAwesomeIcon icon={showLogs ? faChevronUp : faChevronDown} className="text-xs mr-1" />
                        {showLogs ? 'Show less' : `Show ${sortedDailyLogs.length - 3} more`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Stats & Actions */}
          <div className="flex flex-row lg:flex-col lg:items-end items-center justify-between lg:justify-start gap-4 lg:gap-2 lg:ml-4">
            {/* Total Hours */}
            {jiraTotalHours > 0 && (
              <div className="text-center lg:text-right">
                <div className="text-lg lg:text-2xl font-light text-black">{jiraTotalHours}</div>
                <div className="text-xs text-gray-500">hours</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 lg:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddLogForm(!showAddLogForm)}
                title="Add Log"
                className="text-gray-400 hover:text-black"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs lg:text-sm" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeployModalOpen(true)}
                title="Deploy"
                className="text-gray-400 hover:text-black"
              >
                <FontAwesomeIcon icon={faShareSquare} className="text-xs lg:text-sm" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditJira(jira)}
                title="Edit"
                className="text-gray-400 hover:text-black"
              >
                <FontAwesomeIcon icon={faPencil} className="text-xs lg:text-sm" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteJira(jira._id)}
                title="Delete"
                className="text-gray-400 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs lg:text-sm" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Add Log Form */}
        {showAddLogForm && (
          <form onSubmit={handleQuickAddLog} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="date"
                  value={quickLogDate}
                  onChange={(e) => setQuickLogDate(e.target.value)}
                  className="w-full sm:w-auto"
                  required
                />
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Hours"
                  value={quickLogHours}
                  onChange={(e) => setQuickLogHours(e.target.value)}
                  className="w-full sm:w-24"
                  required
                />
              </div>
              <Input
                as="textarea"
                rows={4}
                placeholder="What did you do?"
                value={quickLogDescription}
                onChange={(e) => setQuickLogDescription(e.target.value)}
                className="w-full"
                required
              />
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddLogForm(false)}
                  className="order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="order-1 sm:order-2"
                >
                  Save
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Expanded Logs */}
        {showLogs && sortedDailyLogs.length > 3 && (
          <div className="mt-4 space-y-2 pl-4 border-l-2 border-gray-200">
            {sortedDailyLogs.slice(3).map(log => (
              <div key={log._id} className="group">
                {editingLogId === log._id ? (
                  // Edit Mode - Full width layout
                  <div className="space-y-2 p-3 bg-gray-50 rounded">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Input
                        type="date"
                        value={editedLogData.logDate?.split('T')[0] || ''}
                        onChange={(e) => setEditedLogData({...editedLogData, logDate: e.target.value})}
                        size="sm"
                        className="w-full sm:w-auto"
                      />
                      <Input
                        type="number"
                        step="0.5"
                        value={editedLogData.timeSpent || ''}
                        onChange={(e) => setEditedLogData({...editedLogData, timeSpent: e.target.value})}
                        size="sm"
                        className="w-full sm:w-20"
                        placeholder="Hours"
                      />
                    </div>
                    <Input
                      as="textarea"
                      rows={3}
                      value={editedLogData.taskDescription || ''}
                      onChange={(e) => setEditedLogData({...editedLogData, taskDescription: e.target.value})}
                      size="sm"
                      className="w-full"
                      placeholder="Task description"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveEditLog}
                        title="Save"
                        className="text-green-600 hover:text-green-800"
                      >
                        <FontAwesomeIcon icon={faSave} className="text-xs" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditLog}
                        title="Cancel"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-2 hover:bg-gray-50 rounded">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-col gap-1 text-sm flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">{formatDate(log.logDate)}</span>
                            <span className="font-medium text-black">{log.timeSpent}h</span>
                          </div>
                          <div className="flex gap-1 sm:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLog(log)}
                              title="Edit log"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <FontAwesomeIcon icon={faPencil} className="text-xs" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLog(jira._id, log._id)}
                              title="Delete log"
                              className="text-gray-400 hover:text-red-600"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-gray-600 break-words text-sm">
                          {log.taskDescription}
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLog(log)}
                          title="Edit log"
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <FontAwesomeIcon icon={faPencil} className="text-sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLog(jira._id, log._id)}
                          title="Delete log"
                          className="text-gray-400 hover:text-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && (
        <DetailModal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          title={modalDetailType}
          content={modalDetailContent}
        />
      )}

      {/* Deploy Modal */}
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        jira={jira}
        onDeploySubmit={async (deployData) => {
          toast.info("Generating deployment package...");
          try {
            const response = await fetch(`/api/jiras/${jira._id}/deploy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deployData),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'API Error');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Deployment_Package_${jira.jiraNumber}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Deployment package downloaded successfully!");
          } catch (error) {
            toast.error(`Failed to generate package: ${error.message}`);
          }
        }}
      />
    </div>
  );
};

export default JiraItem;