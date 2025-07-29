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

const JiraItem = ({ 
  jira, 
  onAddLog,
  onEditJira,
  onDeleteJira,
  updateOptimisticLog,
  rollbackOptimisticLogUpdate,
  deleteOptimisticLog,
  rollbackOptimisticLogDelete,
  externalStatus
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

  useEffect(() => {
    const jiraSum = jira.dailyLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
    setJiraTotalHours(jiraSum);
  }, [jira.dailyLogs]);

  const sortedDailyLogs = useMemo(() => {
    if (!jira.dailyLogs || jira.dailyLogs.length === 0) {
      return [];
    }
    return [...jira.dailyLogs].sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
  }, [jira.dailyLogs]);

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

      const response = await fetch(`/api/jiras/${jira._id}/logs`, {
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

  return (
    <div className="group hover:bg-gray-50 transition-all duration-200">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left Side - Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {/* Title Row */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-mono text-sm text-gray-600 whitespace-nowrap">{jira.jiraNumber}</h3>
                  <span className="text-gray-400">•</span>
                  <h3 className="text-sm font-medium text-gray-900 truncate">{truncateDescription(jira.description)}</h3>
                  {jira.envDetail && (
                    <button
                      onClick={() => openDetailModal('Environment Detail', jira.envDetail)}
                      className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                      title="View Environment Details"
                    >
                      <FontAwesomeIcon icon={faServer} size="xs" />
                    </button>
                  )}
                  {jira.sqlDetail && (
                    <button
                      onClick={() => openDetailModal('SQL Detail', jira.sqlDetail)}
                      className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                      title="View SQL Details"
                    >
                      <FontAwesomeIcon icon={faDatabase} size="xs" />
                    </button>
                  )}
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
                          // Edit Mode for Recent Logs - Minimal inline
                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="date"
                              value={editedLogData.logDate?.split('T')[0] || ''}
                              onChange={(e) => setEditedLogData({...editedLogData, logDate: e.target.value})}
                              className="text-xs px-1 py-1 border border-gray-300 rounded w-24"
                            />
                            <input
                              type="number"
                              step="0.5"
                              value={editedLogData.timeSpent || ''}
                              onChange={(e) => setEditedLogData({...editedLogData, timeSpent: e.target.value})}
                              className="text-xs px-1 py-1 border border-gray-300 rounded w-12"
                              placeholder="h"
                            />
                            <input
                              type="text"
                              value={editedLogData.taskDescription || ''}
                              onChange={(e) => setEditedLogData({...editedLogData, taskDescription: e.target.value})}
                              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                              placeholder="Task description"
                            />
                            <button
                              onClick={handleSaveEditLog}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <FontAwesomeIcon icon={faSave} className="text-xs" />
                            </button>
                            <button
                              onClick={handleCancelEditLog}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                          </div>
                        ) : (
                          // View Mode for Recent Logs
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-2 text-xs text-gray-600 flex-1">
                              <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                              <span className="font-medium">{log.timeSpent}h</span>
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{log.taskDescription}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{getDaysAgo(log.logDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <button
                                onClick={() => handleEditLog(log)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit log"
                              >
                                <FontAwesomeIcon icon={faPencil} className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleDeleteLog(jira._id, log._id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete log"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {hasMoreLogs && (
                      <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={showLogs ? faChevronUp : faChevronDown} className="text-xs" />
                        {showLogs ? 'Show less' : `Show ${sortedDailyLogs.length - 3} more`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Stats & Actions */}
          <div className="flex items-start gap-4 ml-4">
            {/* Total Hours */}
            {jiraTotalHours > 0 && (
              <div className="text-center">
                <div className="text-2xl font-light text-black">{jiraTotalHours}</div>
                <div className="text-xs text-gray-500">hours</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowAddLogForm(!showAddLogForm)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-all"
                title="Add Log"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                onClick={() => setIsDeployModalOpen(true)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-all"
                title="Deploy"
              >
                <FontAwesomeIcon icon={faShareSquare} />
              </button>
              <button
                onClick={() => onEditJira(jira)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-all"
                title="Edit"
              >
                <FontAwesomeIcon icon={faPencil} />
              </button>
              <button
                onClick={() => onDeleteJira(jira._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                title="Delete"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add Log Form */}
        {showAddLogForm && (
          <form onSubmit={handleQuickAddLog} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input
                type="date"
                value={quickLogDate}
                onChange={(e) => setQuickLogDate(e.target.value)}
                className="py-2 border border-gray-300 rounded focus:outline-none focus:border-black text-black"
                required
              />
              <input
                type="text"
                placeholder="What did you do?"
                value={quickLogDescription}
                onChange={(e) => setQuickLogDescription(e.target.value)}
                className="md:col-span-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hours"
                  value={quickLogHours}
                  onChange={(e) => setQuickLogHours(e.target.value)}
                  className="flex-1 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                  required
                />
                
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLogForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
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
                  // Edit Mode - Minimal inline
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <input
                      type="date"
                      value={editedLogData.logDate?.split('T')[0] || ''}
                      onChange={(e) => setEditedLogData({...editedLogData, logDate: e.target.value})}
                      className="text-xs px-1 py-1 border border-gray-300 rounded w-24"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={editedLogData.timeSpent || ''}
                      onChange={(e) => setEditedLogData({...editedLogData, timeSpent: e.target.value})}
                      className="text-xs px-1 py-1 border border-gray-300 rounded w-12"
                      placeholder="h"
                    />
                    <input
                      type="text"
                      value={editedLogData.taskDescription || ''}
                      onChange={(e) => setEditedLogData({...editedLogData, taskDescription: e.target.value})}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                      placeholder="Task description"
                    />
                    <button
                      onClick={handleSaveEditLog}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <FontAwesomeIcon icon={faSave} className="text-xs" />
                    </button>
                    <button
                      onClick={handleCancelEditLog}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Cancel"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs text-gray-500">{formatDate(log.logDate)}</span>
                      <span className="font-medium text-black">{log.timeSpent}h</span>
                      <span className="text-gray-600">{log.taskDescription}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditLog(log)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit log"
                      >
                        <FontAwesomeIcon icon={faPencil} className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(jira._id, log._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete log"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
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