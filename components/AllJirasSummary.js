// components/AllJirasSummary.js
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { services } from '@/data/config';
import { toast } from 'react-toastify';
import { formatDate } from '@/utils/dateUtils';

import 'react-toastify/dist/ReactToastify.css';

const DESCRIPTION_LIMIT = 50;

const AllJirasSummary = ({ allJiras, fetchJiras }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [jiraStatuses, setJiraStatuses] = useState([]);
  const [actualStatuses, setActualStatuses] = useState([]);
  const [externalStatuses, setExternalStatuses] = useState({});

  useEffect(() => {
    import('@/data/config').then(config => {
      setJiraStatuses(config.jiraStatuses);
      setActualStatuses(config.actualStatuses);
    });
  }, []);

  const summarizedJiras = useMemo(() => {
    const uniqueJirasMap = new Map();

    allJiras.forEach(jira => {
      if (jira.jiraNumber?.startsWith('JANE') || jira.jiraStatus === 'Closed' || jira.jiraStatus === 'Done') {
        return;
      }

      let latestLogDate = null;
      let latestLogProjectName = null;
      if (jira.dailyLogs && jira.dailyLogs.length > 0) {
        const sortedLogs = [...jira.dailyLogs].sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
        latestLogDate = new Date(sortedLogs[0].logDate);
        latestLogProjectName = jira.projectName;
      }

      const jiraWithLatestLogInfo = {
        ...jira,
        latestLogInfo: latestLogDate ? {
          date: latestLogDate,
          year: latestLogDate.getFullYear(),
          month: (latestLogDate.getMonth() + 1).toString().padStart(2, '0'),
          projectName: latestLogProjectName,
        } : null
      };

      const existingJira = uniqueJirasMap.get(jira.jiraNumber);

      if (!existingJira || 
        (jira.updatedAt && new Date(jira.updatedAt) > new Date(existingJira.updatedAt)) ||
        (jiraWithLatestLogInfo.latestLogInfo && existingJira.latestLogInfo && jiraWithLatestLogInfo.latestLogInfo.date > existingJira.latestLogInfo.date)
      ) {
        uniqueJirasMap.set(jira.jiraNumber, jiraWithLatestLogInfo);
      }
    });

    const filteredAndSortedJiras = Array.from(uniqueJirasMap.values()).sort((a, b) => {
      const actualA = a.actualStatus || '';
      const actualB = b.actualStatus || '';
      return actualA.localeCompare(actualB);
    });

    return filteredAndSortedJiras;
  }, [allJiras]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const truncateDescription = useCallback((description) => {
    if (!description) return '';
    return description.length > DESCRIPTION_LIMIT ? `${description.substring(0, DESCRIPTION_LIMIT)}...` : description;
  }, []);

  const handleStatusChange = async (jiraId, newStatus, field) => {
    try {
      const response = await fetch(`/api/jiras/${jiraId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: newStatus }),
      });

      if (response.ok) {
        toast.success(`Jira ${field} updated!`, { 
          position: 'bottom-right', 
          autoClose: 1500
        });
        fetchJiras();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update ${field}: ${errorData.message || 'Unknown error'}`, { 
          position: 'bottom-right'
        });
        console.error(`Failed to update ${field}:`, errorData);
      }
    } catch (error) {
      toast.error(`Error updating ${field}`, { 
        position: 'bottom-right'
      });
      console.error(`Error updating ${field}:`, error);
    }
  };

  // --- NEW: Bulk fetching Jira statuses ---
  useEffect(() => {
    const fetchAllJiraStatuses = async () => {
      // 1. Collect all unique Jira numbers that need fetching.
      const jiraNumbersToFetch = summarizedJiras
        .map(j => j.jiraNumber)
        .filter(num => num && !externalStatuses[num]); // Fetch only if not already present

      if (jiraNumbersToFetch.length === 0) {
        return;
      }
      
      // Use a Set to ensure numbers are unique before creating the query string
      const uniqueJiraNumbers = [...new Set(jiraNumbersToFetch)];
      const jiraNumbersQuery = uniqueJiraNumbers.join(',');

      // 2. Set initial loading state for all numbers being fetched
      setExternalStatuses(prev => {
        const newStatuses = { ...prev };
        uniqueJiraNumbers.forEach(num => {
          newStatuses[num] = 'Loading...';
        });
        return newStatuses;
      });

      try {
        // 3. Make a single API call
        const res = await fetch(`/api/jira-status?jiraNumbers=${jiraNumbersQuery}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch statuses, status: ${res.status}`);
        }
        const data = await res.json();
        
        // 4. Update state with all fetched statuses at once
        if (data.statuses) {
          setExternalStatuses(prev => ({ ...prev, ...data.statuses }));
        }

      } catch (error) {
        console.error("Error fetching Jira statuses in bulk:", error);
        // On error, mark the ones we tried to fetch as 'Error'
        setExternalStatuses(prev => {
          const newStatuses = { ...prev };
          uniqueJiraNumbers.forEach(num => {
            if (newStatuses[num] === 'Loading...') {
              newStatuses[num] = 'Error';
            }
          });
          return newStatuses;
        });
      }
    };

    if (summarizedJiras.length > 0) {
      fetchAllJiraStatuses();
    }
  }, [summarizedJiras]); // Rerun when the list of summarized Jiras changes
  
  const summarizedJirasWithStatus = useMemo(() => {
    return summarizedJiras.filter(jira => {
      const extStatus = externalStatuses[jira.jiraNumber];
      if (extStatus === undefined) return true;
      return !['done', 'closed'].includes(extStatus?.toLowerCase());
    });
  }, [summarizedJiras, externalStatuses]);

  return (
    <div className="border border-gray-300 p-4">
      <button
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors duration-200"
        type="button"
        onClick={toggleCollapse}
      >
        <h2 className="text-xl font-light text-black">Logs Summary</h2>

        <FontAwesomeIcon
          icon={isCollapsed ? faChevronDown : faChevronUp}
          className="text-sm text-black"
        />
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : ''}`}>
        {summarizedJirasWithStatus.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 p-2 text-left font-medium text-gray-600">JIRA #</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Description</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Due Date</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Service</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Last Log</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Status</th>
                  <th className="py-3 p-2 text-left font-medium text-gray-600">Actual Status</th>
                </tr>
              </thead>
              <tbody>
                {summarizedJirasWithStatus.map((jira, index) => {
                  const serviceInfo = jira.serviceName;

                  return (
                    <tr 
                      key={jira._id?.$oid || jira._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-3 text-black font-mono text-sm whitespace-nowrap p-2">
                        {jira.jiraNumber}
                      </td>
                      <td className="py-3  text-gray-700 max-w-xs p-2">
                        {jira.description}
                      </td>
                      <td className="py-3 text-gray-700 whitespace-nowrap p-2">
                        {jira?.dueDate ? formatDate(jira?.dueDate) : '—'}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        {serviceInfo && (
                          <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700">
                            {serviceInfo.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-700 text-xs font-mono p-2">
                        {jira.latestLogInfo ? (
                          `${jira.latestLogInfo.year}/${jira.latestLogInfo.month}/${jira.latestLogInfo.projectName}`
                        ) : '—'}
                      </td>
                      <td className="py-3 text-gray-700 p-2">
                        {externalStatuses[jira.jiraNumber] === undefined || externalStatuses[jira.jiraNumber] === 'Loading...' ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          <span className="text-sm">{externalStatuses[jira.jiraNumber]}</span>
                        )}
                      </td>
                      <td className="py-3 p-2">
                        <select
                          className="px-0 py-1 text-black bg-transparent border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors appearance-none text-xs min-w-[120px]"
                          value={jira.actualStatus}
                          onChange={(e) => handleStatusChange(jira._id, e.target.value, 'actualStatus')}
                        >
                          {actualStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No tasks to display
          </div>
        )}
      </div>
    </div>
  );
};

export default AllJirasSummary;