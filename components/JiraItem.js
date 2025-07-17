// components/JiraItem.js
'use client';
import { useState,useEffect,useMemo } from 'react';
import AddLogForm from './AddLogForm';
import DetailModal from './DetailModal'; // Import the modal component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDatabase, faServer, faTrash,faClose,faPencil,faSave,faTimes,faShareSquare } from '@fortawesome/free-solid-svg-icons';
import EditJiraModal from '@/components/EditJiraModal';
import { services } from '@/data/config'
import { toast } from 'react-toastify';
import DeployModal from '@/components/DeployModal'; // 1. Import DeployModal

const DESCRIPTION_LIMIT = 70; // You can adjust this number

const JiraItem = ({ 
  jira, 
  logOptions, 
  onAddLog,
  fetchJiras,
  onEditJira,
  onDeleteJira,
  updateOptimisticJira,
  rollbackOptimisticJiraUpdate,
  deleteOptimisticJira,
  rollbackOptimisticJiraDelete,
  updateOptimisticLog,
  rollbackOptimisticLogUpdate,
  deleteOptimisticLog,
  rollbackOptimisticLogDelete,
  externalStatus // *** NEW PROP: รับสถานะจากภายนอก ***
}) => {
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalDetailType, setModalDetailType] = useState(null);
  const [modalDetailContent, setModalDetailContent] = useState('');
  const [jiraTotalHours, setJiraTotalHours] = useState(0);
  const [showEditJiraModal, setShowEditJiraModal] = useState(false);
  const [editingJira, setEditingJira] = useState(null);
  const service = services.find(s => s.name === jira.serviceName);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editedLogData, setEditedLogData] = useState({});
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false); // 3. เพิ่ม State สำหรับ Modal

  // --- REMOVED: ไม่ต้องใช้ state และ useEffect สำหรับ fetch สถานะภายใน Component นี้แล้ว ---
  // const [latestStatus, setLatestStatus] = useState(null);
  // useEffect(() => {
  //   async function fetchJiraStatus() { ... }
  //   fetchJiraStatus();
  // }, [jira.jiraNumber]);

  useEffect(() => {
    const jiraSum = jira.dailyLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
    setJiraTotalHours(jiraSum);
  }, [jira.dailyLogs]);

  const sortedDailyLogs = useMemo(() => {
    if (!jira.dailyLogs || jira.dailyLogs.length === 0) {
      return [];
    }
    return [...jira.dailyLogs].sort((a, b) => new Date(a.logDate) - new Date(b.logDate));
  }, [jira.dailyLogs]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const truncateDescription = (description) => {
    if (!description) return '';
    return description.length > DESCRIPTION_LIMIT ? `${description.substring(0, DESCRIPTION_LIMIT)}...` : description;
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

  const handleDeploySubmit = async (deployData) => {
    toast.info("Generating deployment package... Please wait.");
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

      // Handle file download
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
  };

  const handleDeleteLog = async (jiraId, logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    if (!deleteOptimisticLog || !rollbackOptimisticLogDelete) {
        console.error("Optimistic log delete functions not provided as props.");
        toast.error("Internal error: Cannot delete log optimistically.");
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
      toast.error(`Failed to delete log: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error deleting log:', error);
    }
  };

  const handleDeleteJira = async (jiraId) => {
    if (!deleteOptimisticJira || !rollbackOptimisticJiraDelete) {
        console.error("Optimistic Jira delete functions not provided as props.");
        toast.error("Internal error: Cannot delete Jira optimistically.");
        return;
    }

    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ JIRA นี้และ Logs ที่เกี่ยวข้อง?')) {
      return;
    }

    let deletedJira = null;
    try {
      deletedJira = deleteOptimisticJira(jiraId);
      toast.success('JIRA and its logs deleted successfully!');

      const response = await fetch(`/api/jiras?jiraId=${jiraId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete JIRA on server');
      }
    } catch (error) {
      if (deletedJira) {
        rollbackOptimisticJiraDelete(deletedJira);
      }
      toast.error(`Failed to delete JIRA: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error deleting JIRA:', error);
    }
  };

  const handleUpdateJira = async (jiraId, updatedJiraData) => {
    if (!updateOptimisticJira || !rollbackOptimisticJiraUpdate || !onEditJira) {
        console.error("Optimistic Jira update functions not provided as props.");
        toast.error("Internal error: Cannot update Jira optimistically.");
        return;
    }

    let originalJira = null;
    try {
      originalJira = updateOptimisticJira(jiraId, updatedJiraData);
      toast.success('JIRA edited successfully!');
      onEditJira(null);

      const response = await fetch(`/api/jiras?jiraId=${jiraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJiraData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update JIRA on server');
      }
    } catch (error) {
      if (originalJira) {
        rollbackOptimisticJiraUpdate(jiraId, originalJira);
      }
      toast.error(`Failed to update JIRA: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error updating JIRA:', error);
    }
  };

  const handleUpdateLog = async (jiraId, logId) => {
    if (!updateOptimisticLog || !rollbackOptimisticLogUpdate) {
        console.error("Optimistic log update functions not provided as props.");
        toast.error("Internal error: Cannot update log optimistically.");
        return;
    }

    const currentLogId = logId; 
    let originalLogData = null; 

    try {
      originalLogData = updateOptimisticLog(jiraId, currentLogId, editedLogData);
      toast.success('Log edited successfully!'); 
      setEditingLogId(null); 
      setEditedLogData({}); 

      const response = await fetch(`/api/jiras/${jiraId}/logs?logId=${currentLogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logDate: editedLogData.logDate,
          taskDescription: editedLogData.taskDescription,
          timeSpent: editedLogData.timeSpent,
          envDetail: editedLogData.envDetail,
          sqlDetail: editedLogData.sqlDetail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update log on server');
      }
    } catch (error) {
      if (originalLogData) {
        rollbackOptimisticLogUpdate(jiraId, currentLogId, originalLogData);
      }
      toast.error(`Failed to update log: ${error.message || 'Unknown error'}. Reverted changes.`);
      console.error('Error updating log:', error);
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

  const handleStartEditLog = (log) => {
    setEditingLogId(log._id?.$oid || log._id);
    setEditedLogData({ ...log });
  };

  const handleCancelEditLog = () => {
    setEditingLogId(null);
    setEditedLogData({});
  };

  const handleEditedLogChange = (e) => {
    const { name, value } = e.target;
    setEditedLogData(prev => ({ ...prev, [name]: value }));
  };

  return (
    
    <div className="mb-4 ml-10 bg-white transition-shadow duration-200 text-sm">
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        jira={jira}
        onDeploySubmit={handleDeploySubmit}
      />
      {showEditJiraModal && (
        <EditJiraModal
          isOpen={showEditJiraModal}
          onClose={closeEditJiraModal}
          jira={editingJira}
          onUpdateJira={handleUpdateJira}
        />
      )}
      
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="font-medium text-gray-900">
              <span className="font-mono text-sm text-gray-600">{jira.jiraNumber}</span>
              <span className="mx-2 text-gray-400">·</span>
              <span className="one-line-ellipsis">{truncateDescription(jira.description)}</span>
            </h2>
            
            {jiraTotalHours > 0 && (
              <span className="px-2 py-1 bg-black text-white text-xs font-medium rounded">
                {jiraTotalHours}h
              </span>
            )}
            
            {jira.dueDate && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded border">
                DUE {formatDate(jira.dueDate)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
              title="Deploy this task"
            >
              <FontAwesomeIcon icon={faShareSquare} size="sm" />
            </button>
            <button
              onClick={() => handleEditJira(jira)}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
            >
              <FontAwesomeIcon icon={faPencil} size="sm" />
            </button>
            <button
              onClick={() => handleDeleteJira(jira._id)}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} size="sm" />
            </button>
          </div>
        </div>
        
        {/* Status Tags */}
        <div className="flex items-center space-x-2 mt-3">
          {jira.serviceName && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded border">
              {jira.serviceName.toUpperCase()}
            </span>
          )}
          
          {/* *** UPDATED: ใช้ externalStatus ที่ส่งมาจาก props *** */}
          { externalStatus && (
            <span className="px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded">
              JIRA: {externalStatus}
            </span>
          )}
          
          <span className="px-2 py-1 bg-white border border-gray-300 text-gray-800 text-xs font-medium rounded">
            ACTUAL: {jira.actualStatus}
          </span>
        </div>
      </div>

      {/* Logs Section */}
      <div className="p-4">
        {jira.dailyLogs && jira.dailyLogs.length > 0 ? (
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Detail</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Env</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">SQL</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDailyLogs.map((log, index) => (
                  <tr key={log._id?.$oid || log._id} className={`${index !== sortedDailyLogs.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-25 transition-colors`}>
                    <td className="py-3 px-2 text-sm text-gray-900 whitespace-nowrap">
                      {editingLogId === (log._id?.$oid || log._id) ? (
                        <input
                          type="date"
                          name="logDate"
                          value={editedLogData.logDate?.split('T')[0]}
                          onChange={handleEditedLogChange}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black"
                        />
                      ) : (
                        <span className="font-mono text-xs text-gray-600">{formatDate(log.logDate)}</span>
                      )}
                    </td>
                    
                    {editingLogId === (log._id?.$oid || log._id) ? (
                      <>
                        <td className="py-3 px-2">
                          <textarea
                            rows="2"
                            name="taskDescription"
                            value={editedLogData.taskDescription}
                            onChange={handleEditedLogChange}
                            className="text-black w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black resize-none"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            name="timeSpent"
                            value={editedLogData.timeSpent}
                            onChange={handleEditedLogChange}
                            className="text-black w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <textarea
                            rows="2"
                            name="envDetail"
                            value={editedLogData.envDetail}
                            onChange={handleEditedLogChange}
                            className="text-black w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black resize-none"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <textarea
                            rows="3"
                            name="sqlDetail"
                            value={editedLogData.sqlDetail}
                            onChange={handleEditedLogChange}
                            className="text-black w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black resize-none font-mono"
                          />
                        </td> 
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleUpdateLog(jira._id, log._id?.$oid || log._id)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            >
                              <FontAwesomeIcon icon={faSave} size="sm" />
                            </button>
                            <button
                              onClick={handleCancelEditLog}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            >
                              <FontAwesomeIcon icon={faTimes} size="sm" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-2 text-sm text-gray-900">{log.taskDescription}</td>
                        <td className="py-3 px-2 text-sm text-gray-900 font-mono">{log.timeSpent}</td>
                        <td className="py-3 px-2">
                          {log.envDetail && (
                            <button
                              onClick={() => openDetailModal('Environment Detail', log.envDetail)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                              title="View Environment Details"
                            >
                              <FontAwesomeIcon icon={faServer} size="sm" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {log.sqlDetail && (
                            <button
                              onClick={() => openDetailModal('SQL Detail', log.sqlDetail)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                              title="View SQL Details"
                            >
                              <FontAwesomeIcon icon={faDatabase} size="sm" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleStartEditLog(log)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                            >
                              <FontAwesomeIcon icon={faPencil} size="sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(jira._id, log._id?.$oid || log._id)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded transition-colors"
                            >
                              <FontAwesomeIcon icon={faClose} size="sm" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic py-4">No daily logs.</p>
        )}

        {/* Add Log Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
            onClick={() => setShowAddLogForm(!showAddLogForm)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" size="sm" />
            Add Log
          </button>
        </div>

        {showAddLogForm && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <AddLogForm jiraId={jira._id?.$oid || jira._id} logOptions={logOptions} onAddLog={onAddLog} />
          </div>
        )}
        <div className="h-px bg-gray-200 mt-4 mx-auto"></div>
      </div>

      {showDetailModal && (
        <DetailModal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          title={modalDetailType}
          content={modalDetailContent}
        />
      )}
    </div>
  );
};

export default JiraItem;