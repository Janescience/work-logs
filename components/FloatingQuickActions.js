// components/FloatingQuickActions.js
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faClock, 
  faRocket, 
  faFileExport,
  faChartBar,
  faCalendarCheck,
  faTimes,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

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

  // Don't show on login/register pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(pathname)) return null;

  useEffect(() => {
    // Fetch active jiras for quick log
    if (session) {
      fetch('/api/jiras')
        .then(res => res.json())
        .then(data => {
          const active = data.jiras?.filter(j => 
            j.actualStatus?.toLowerCase() === 'in progress'
          ).slice(0, 10) || [];
          setActiveJiras(active);
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

  const actions = [
    {
      title: 'New Task',
      icon: faPlus,
      onClick: () => {
        router.push('/daily-logs');
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
      title: 'Deploy',
      icon: faRocket,
      onClick: () => {
        router.push('/deployment-history');
        setIsExpanded(false);
      }
    },
    {
      title: 'Export',
      icon: faFileExport,
      onClick: () => {
        const startDate = new Date();
        startDate.setDate(1);
        const endDate = new Date();
        window.location.href = `/api/export/excel?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        setIsExpanded(false);
      }
    },
    {
      title: 'Reports',
      icon: faChartBar,
      onClick: () => {
        router.push('/it-lead');
        setIsExpanded(false);
      }
    },
    {
      title: 'Calendar',
      icon: faCalendarCheck,
      onClick: () => {
        router.push('/');
        setTimeout(() => {
          document.getElementById('work-calendar')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        setIsExpanded(false);
      }
    }
  ];

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

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-lg shadow-xl w-full max-w-md">
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
                  className="w-full p-3 border-b-2 border-gray-300 focus:border-black outline-none transition-colors bg-transparent"
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
                  className="w-full p-3 border-b-2 border-gray-300 focus:border-black outline-none transition-colors"
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
                  className="w-full p-3 border-2 border-gray-300 focus:border-black outline-none transition-colors rounded"
                  rows="3"
                  placeholder="Brief description..."
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
    </>
  );
};

export default FloatingQuickActions;