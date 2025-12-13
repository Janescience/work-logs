'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTasks, faCopy } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui';

const InProgressModal = ({ isOpen, onClose, allJiras, externalStatuses = {} }) => {
  const inProgressTasks = useMemo(() => {
    if (!allJiras) return [];

    // Safely handle externalStatuses
    const safeExternalStatuses = externalStatuses && typeof externalStatuses === 'object' ? externalStatuses : {};

    console.log('InProgressModal - All JIRAs:', allJiras.length);
    console.log('InProgressModal - External Statuses:', Object.keys(safeExternalStatuses).length);

    // Debug: Show all actualStatus values
    const statusCounts = {};
    allJiras.forEach(jira => {
      const status = jira.actualStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('InProgressModal - Status counts:', statusCounts);

    // Filter only in-progress tasks
    const filtered = allJiras.filter(jira => {
      console.log(`JIRA ${jira.jiraNumber}: actualStatus = '${jira.actualStatus}'`);
      return jira.actualStatus === 'In Progress';
    });

    console.log('InProgressModal - Filtered In Progress:', filtered.length);

    // Transform and add computed fields
    const transformed = filtered.map(jira => {
      // Find the last daily log date (same approach as JiraItem)
      console.log(`JIRA ${jira.jiraNumber} dailyLogs:`, jira.dailyLogs);

      let lastLogDate = null;
      if (jira.dailyLogs && Array.isArray(jira.dailyLogs) && jira.dailyLogs.length > 0) {
        try {
          const sortedLogs = jira.dailyLogs
            .filter(log => log && log.logDate)
            .sort((a, b) => new Date(b.logDate) - new Date(a.logDate));

          console.log(`JIRA ${jira.jiraNumber} sorted dailyLogs:`, sortedLogs);

          if (sortedLogs.length > 0) {
            lastLogDate = new Date(sortedLogs[0].logDate);
            console.log(`JIRA ${jira.jiraNumber} last log date:`, lastLogDate);
          }
        } catch (error) {
          console.error(`Error processing dailyLogs for JIRA ${jira.jiraNumber}:`, error);
        }
      }

      // Find the next deployment date with environment type
      const deployments = [
        { date: jira.deploySitDate, env: 'SIT' },
        { date: jira.deployUatDate, env: 'UAT' },
        { date: jira.deployPreprodDate, env: 'PREPROD' },
        { date: jira.deployProdDate, env: 'PROD' }
      ].filter(d => d.date).map(d => ({ ...d, dateObj: new Date(d.date) }));

      const nextDeployment = deployments.length > 0
        ? deployments.reduce((earliest, current) =>
            current.dateObj < earliest.dateObj ? current : earliest
          )
        : null;

      const nextDeployDate = nextDeployment ? nextDeployment.dateObj : null;
      const nextDeployEnv = nextDeployment ? nextDeployment.env : null;

      return {
        jiraNumber: jira.jiraNumber,
        description: jira.description,
        service: jira.serviceName || 'N/A',
        project: jira.projectName || jira.projectId?.name || 'N/A',
        jiraStatus: safeExternalStatuses[jira.jiraNumber] || 'N/A',
        lastLogDate,
        nextDeployDate,
        nextDeployEnv,
        // For sorting by last log date (newest first)
        lastLogSort: lastLogDate ? lastLogDate.getTime() : 0 // 0 for items without log date (will be at bottom)
      };
    });

    // Sort by last daily log date (newest first)
    const sorted = transformed.sort((a, b) => {
      return b.lastLogSort - a.lastLogSort; // Newest log first
    });

    console.log('InProgressModal - Final sorted results:', sorted.length);
    return sorted;
  }, [allJiras, externalStatuses]);

  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const copyTableContent = async () => {
    if (inProgressTasks.length === 0) {
      toast.warning('No data to copy');
      return;
    }

    try {
      // Create table header
      const headers = [
        'JIRA Number',
        'Description',
        'JIRA Status',
        'Service',
        'Project',
        'Last Daily Log',
        'Next Deploy'
      ];

      // Create table content
      const tableContent = [
        headers.join('\t'), // Tab-separated header
        ...inProgressTasks.map(task => [
          task.jiraNumber,
          task.description,
          task.jiraStatus,
          task.service,
          task.project,
          formatDate(task.lastLogDate),
          task.nextDeployDate ? `${formatDate(task.nextDeployDate)} (${task.nextDeployEnv})` : 'N/A'
        ].join('\t')) // Tab-separated rows
      ].join('\n');

      await navigator.clipboard.writeText(tableContent);
      toast.success('Table content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy table content');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
      <div className="bg-white w-full h-full max-w-[98vw] max-h-[98vh] rounded-lg shadow-xl flex flex-col">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faTasks} className="text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">
              In Progress Tasks ({inProgressTasks.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {inProgressTasks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTableContent}
                className="text-gray-600 hover:text-blue-600"
                title="Copy table content"
              >
                <FontAwesomeIcon icon={faCopy} size="lg" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-black">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </Button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faTasks} size="3x" className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">No tasks in progress</p>
              <p className="text-sm">All tasks are completed or not started yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JIRA Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JIRA Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Daily Log
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Deploy
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inProgressTasks.map((task, index) => (
                    <tr key={task.jiraNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/browse/${task.jiraNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {task.jiraNumber}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {task.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {task.jiraStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{task.service}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{task.project}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm ${task.lastLogDate ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatDate(task.lastLogDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.nextDeployDate ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">
                              {formatDate(task.nextDeployDate)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded mt-1 inline-block w-fit ${
                              task.nextDeployEnv === 'PROD' ? 'bg-red-100 text-red-700' :
                              task.nextDeployEnv === 'PREPROD' ? 'bg-orange-100 text-orange-700' :
                              task.nextDeployEnv === 'UAT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.nextDeployEnv}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t text-right">
          <Button
            variant="primary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InProgressModal;