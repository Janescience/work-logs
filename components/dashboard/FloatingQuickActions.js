// components/FloatingQuickActions.js
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faClock, 
  faRocket, 
  faCalendar,
  faChartBar,
  faCalendarCheck,
  faListCheck,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faHistory,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { MyJiras, JiraFormModal } from '@/components/jira';
import { DeploymentHistory } from '@/components/dashboard';
import { CalendarModal } from '@/components/calendar';

const FloatingQuickActions = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [activeJiras, setActiveJiras] = useState([]);
  const [selectedJira, setSelectedJira] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMyJirasModal, setShowMyJirasModal] = useState(false);
  const [showJiraFormModal, setShowJiraFormModal] = useState(false);
  const [showDeploymentHistory, setShowDeploymentHistory] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedJiraForStatus, setSelectedJiraForStatus] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [allJiras, setAllJiras] = useState([]);
  const [inProgressJiras, setInProgressJiras] = useState([]);
  // Don't show on login/register pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(pathname)) return null;

  useEffect(() => {
    if (session) {
      fetch('/api/jiras')
        .then(res => res.json())
        .then(data => {
          const jiras = data.jiras || [];
          setAllJiras(jiras);
          
          // Filter JIRAs with actual status = "In Progress" for Update Status modal
          const progressJiras = jiras.filter(jira => 
            jira.actualStatus?.toLowerCase() === 'in progress'
          );
          setInProgressJiras(progressJiras);
        });
    }
  }, [session]);

  useEffect(() => {
  // Fetch active jiras for quick log
  if (session) {
    fetch('/api/jiras')
      .then(res => res.json())
      .then(data => {
        if (data.jiras) {
          // Get current month start date
          const now = new Date();
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          
          // Filter jiras that have logs in current month
          const jirasWithRecentLogs = data.jiras.filter(jira => {
            // Check if jira has any logs in current month
            if (!jira.dailyLogs || jira.dailyLogs.length === 0) return false;
            
            // Check if any log is from current month
            return jira.dailyLogs.some(log => {
              const logDate = new Date(log.logDate);
              return logDate >= currentMonthStart;
            });
          });
          
          // Sort by most recent log date (descending)
          jirasWithRecentLogs.sort((a, b) => {
            const getLatestLogDate = (jira) => {
              if (!jira.dailyLogs || jira.dailyLogs.length === 0) return new Date(0);
              return new Date(Math.max(...jira.dailyLogs.map(log => new Date(log.logDate))));
            };
            
            return getLatestLogDate(b) - getLatestLogDate(a);
          });
          
          // Take top 10
          setActiveJiras(jirasWithRecentLogs);
        }
      })
      .catch(console.error);
  }
}, [session]);

  const handleQuickLog = async () => {
    if (!selectedJira || !logHours || !logDescription) {
      toast.warning('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jiras/${selectedJira}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: new Date().toISOString(),
          taskDescription: logDescription,
          timeSpent: parseFloat(logHours),
          envDetail: '',
          sqlDetail: ''
        }),
      });

      if (res.ok) {
        toast.success('Log added successfully!');
        setShowQuickLog(false);
        setSelectedJira('');
        setLogHours('');
        setLogDescription('');
        // Refresh if on daily-logs page
        if (pathname === '/daily-logs') {
          window.location.reload();
        }
      } else {
        throw new Error('Failed to add log');
      }
    } catch (error) {
      toast.error('Error adding log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task selection for status update - sync current status
  const handleTaskSelection = (jiraId) => {
    setSelectedJiraForStatus(jiraId);
    
    if (jiraId) {
      const selectedJira = inProgressJiras.find(jira => jira._id === jiraId);
      if (selectedJira) {
        setNewStatus(selectedJira.actualStatus || '');
      }
    } else {
      setNewStatus('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedJiraForStatus || !newStatus) {
      toast.warning('Please select a JIRA and enter status');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jiras/${selectedJiraForStatus}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualStatus: newStatus
        }),
      });

      if (res.ok) {
        toast.success('Status updated successfully!');
        setShowUpdateStatus(false);
        setSelectedJiraForStatus('');
        setNewStatus('');
        // Refresh if on daily-logs page
        if (pathname === '/daily-logs') {
          window.location.reload();
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = [
    {
      title: 'New Task',
      icon: faPlus,
      onClick: () => {
        setShowJiraFormModal(true);  // เปลี่ยนจาก router.push
        setIsExpanded(false);
      }
    },
    {
      title: 'My JIRAs',
      icon: faListCheck, // หรือ faClipboardList
      onClick: () => {
        setShowMyJirasModal(true);
        setIsExpanded(false);
      }
    },
    {
      title: 'Quick Log',
      icon: faClock,
      onClick: () => {
        setShowQuickLog(true);
        setIsExpanded(false);
      }
    },
    {
      title: 'Update Work Done',
      icon: faEdit,
      onClick: () => {
        setShowUpdateStatus(true);
        setIsExpanded(false);
      }
    },
    {
      title: 'Month Summary',
      icon: faCalendar,
      onClick: () => {
        setShowCalendarModal(true);
        setIsExpanded(false);
      }
    },
    {
      title: 'Deploy History',
      icon: faHistory,
      onClick: () => {
        setShowDeploymentHistory(true);
        setIsExpanded(false);
      }
    }
  ];

  const handleSaveJira = async (jiraId, jiraData) => {
  try {
      const url = jiraId ? `/api/jiras/${jiraId}` : '/api/jiras';
      const method = jiraId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraData),
      });

      if (res.ok) {
        toast.success(jiraId ? 'Task updated successfully!' : 'Task created successfully!');
        setShowJiraFormModal(false);
        // Refresh หน้าถ้าอยู่ในหน้า daily-logs
        if (pathname === '/daily-logs') {
          window.location.reload();
        }
      } else {
        throw new Error('Failed to save task');
      }
    } catch (error) {
      toast.error('Error saving task');
    }
  };

  return (
    <>
      {/* Floating Panel */}
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
        isExpanded ? 'translate-x-0' : 'translate-x-64'
      }`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -left-10 top-1/2 -translate-y-1/2 bg-black text-white w-10 h-16 rounded-l-lg hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronRight : faChevronLeft} className="text-sm" />
        </button>

        {/* Panel */}
        <div className="bg-white border-l-2 border-y-2 border-black shadow-2xl w-64 overflow-hidden">
          <div className="bg-black text-white px-4 py-3">
            <h3 className="font-light text-sm tracking-wide">QUICK ACTIONS</h3>
          </div>
          
          <div className="p-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 rounded group"
              >
                <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                  <FontAwesomeIcon icon={action.icon} className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-800">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* JiraFormModal */}
      {showJiraFormModal && (
        <JiraFormModal
          isOpen={showJiraFormModal}
          onClose={() => setShowJiraFormModal(false)}
          jira={null}  // null สำหรับ create mode
          onSaveJira={handleSaveJira}
          userEmail={session?.user?.email}
        />
      )}

      {/* My JIRAs Modal */}
      {showMyJirasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="bg-black text-white p-2 flex items-center justify-end ">
              {/* <h3 className="text-xl font-light">My JIRAs</h3> */}
              <button
                onClick={() => setShowMyJirasModal(false)}
                className="hover:bg-gray-800 w-8 h-8 rounded flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <MyJiras 
                userEmail={session?.user?.email} 
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {showDeploymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-light">Deployment History</h3>
              <button
                onClick={() => setShowDeploymentHistory(false)}
                className="hover:bg-gray-800 w-8 h-8 rounded flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <DeploymentHistory 
                allJiras={allJiras} 
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white border-2 border-black shadow-xl w-full max-w-md">
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-light">Quick Time Log</h3>
              <button
                onClick={() => setShowQuickLog(false)}
                className="hover:bg-gray-800 w-8 h-8 rounded flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedJira}
                  onChange={(e) => setSelectedJira(e.target.value)}
                  className="w-full p-3  focus:border-black outline-none transition-colors bg-transparent text-black rounded-md"
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Task --</option>
                  {activeJiras.map(jira => (
                    <option key={jira._id} value={jira._id}>
                      {jira.jiraNumber} - {jira.description?.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="w-full p-3  focus:border-black outline-none transition-colors rounded-md"
                  placeholder="e.g., 2.5"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What did you do?
                </label>
                <textarea
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:border-black outline-none transition-colors rounded-md resize-vertical"
                  rows="4"
                  placeholder="What did you do? Describe your work in detail..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowQuickLog(false)}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickLog}
                className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black shadow-xl w-full max-w-md">
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-light">Update Work Done</h3>
              <button
                onClick={() => setShowUpdateStatus(false)}
                className="hover:bg-gray-800 w-8 h-8 rounded flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedJiraForStatus}
                  onChange={(e) => handleTaskSelection(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:border-black outline-none transition-colors bg-white text-black rounded-md"
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Task --</option>
                  {inProgressJiras.map(jira => (
                    <option key={jira._id} value={jira._id}>
                      {jira.jiraNumber} - {jira.description?.substring(0, 50)}... (Current: {jira.actualStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:border-black outline-none transition-colors bg-white text-black rounded-md"
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Status --</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowUpdateStatus(false)}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <CalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          allJiras={allJiras}
        />
      )}
    </>
  );
};

export default FloatingQuickActions;