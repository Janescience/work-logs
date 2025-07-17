'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faDatabase, faServer, faSpinner } from '@fortawesome/free-solid-svg-icons';
import DetailModal from '@/components/DetailModal'; // Import DetailModal
import { formatDate } from '@/utils/dateUtils'; // Import formatDate utility
import { services } from '@/data/config'; // Import services config
import useJiras from '@/hooks/useJiras'; // Import useJiras hook
import { useSession } from 'next-auth/react'; // Import useSession
import { useRouter } from 'next/navigation'; // Import useRouter

// The DeploymentJourney component moved to its own page
const DeploymentJourney = ({ allJiras }) => {
  // isCollapsed default changed to false to show content initially
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalDetailType, setModalDetailType] = useState(null);
  const [modalDetailContent, setModalDetailContent] = useState('');

  const deploymentJirasGrouped = useMemo(() => {
    const groupedByJiraNumber = {};

    allJiras.forEach(jira => {
      const jiraNumberString = jira.jiraNumber;
      const jiraIdString = jira._id?.toString() || jira._id; // Ensure _id is string

      const currentJiraDeploymentLogs = jira.dailyLogs.filter(log =>
        (log.taskDescription && log.taskDescription.toLowerCase().startsWith('deploy')) || log.sqlDetail || log.envDetail
      ).sort((a, b) => new Date(a.logDate) - new Date(b.logDate));

      if (currentJiraDeploymentLogs.length > 0) {
        if (!groupedByJiraNumber[jiraNumberString]) {
          const serviceInfo = services.find(s => s.name === jira.serviceName);

          groupedByJiraNumber[jiraNumberString] = {
            jiraInfo: {
              id: jiraIdString,
              jiraNumber: jira.jiraNumber,
              description: jira.description,
              environment: jira.environment,
              serviceName: jira.serviceName,
              serviceColorCode: serviceInfo?.color_code || '#ccc',
              jiraStatus: jira.jiraStatus,
              actualStatus: jira.actualStatus,
            },
            deploymentLogs: [],
          };
        }
        groupedByJiraNumber[jiraNumberString].deploymentLogs.push(...currentJiraDeploymentLogs);
      }
    });

    Object.values(groupedByJiraNumber).forEach(group => {
      group.deploymentLogs.sort((a, b) => new Date(a.logDate) - new Date(b.logDate));
    });

    const result = Object.values(groupedByJiraNumber).sort((a, b) =>
      (a.jiraInfo.jiraNumber || '').localeCompare(b.jiraInfo.jiraNumber || '')
    );

    return result;
  }, [allJiras]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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
    // Main accordion container with border, white background, and padding
    <div className="mb-4 border-2 border-black bg-white">
      {/* Accordion Header */}
      <h2 className="text-xl font-bold text-black flex items-center">
        <button
          className="w-full text-left py-3 font-semibold bg-black text-white px-4 " // Dark header for accordion
          type="button"
          onClick={toggleCollapse}
        >
          Histories by Jira
          <FontAwesomeIcon
            icon={isCollapsed ? faChevronDown : faChevronUp}
            className="ml-2"
          />
        </button>
      </h2>
      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0' : 'h-auto p-4 bg-white rounded-b-lg'}`}
      >
        {deploymentJirasGrouped.length > 0 ? (
          <div className="space-y-4">
            {deploymentJirasGrouped.map(data => (
              // Individual Jira Group Card
              <div key={data.jiraInfo.jiraNumber} className="border border-gray-300 rounded p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center flex-wrap">
                  <span className="mr-2 text-black">{data.jiraInfo.jiraNumber} : {data.jiraInfo.description}</span>
                  {data.jiraInfo.serviceName && (
                    <span className="px-2 py-1 rounded-md text-xs font-semibold text-black bg-gray-200 mr-1 my-1">
                      {data.jiraInfo.serviceName}
                    </span>
                  )}
                </h3>
                <div className="ml-4 space-y-2">
                  {data.deploymentLogs.map(log => (
                    // Individual Log Entry
                    <div key={log._id?.toString() || log._id} className="flex items-start text-sm text-black py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-bold mr-2 w-24 flex-shrink-0 text-black font-mono">{formatDate(log.logDate)}</span>
                      <span className="flex-grow text-black">{log.taskDescription}</span>
                      <div className="flex ml-4 space-x-2">
                        {log.envDetail && (
                          <button
                            onClick={() => openDetailModal('Environment Detail', log.envDetail)}
                            className="text-gray-700 hover:text-black focus:outline-none text-xs flex items-center" // Styled for minimal
                          >
                            <FontAwesomeIcon icon={faServer} className="mr-1" />Env
                          </button>
                        )}
                        {log.sqlDetail && (
                          <button
                            onClick={() => openDetailModal('SQL Detail', log.sqlDetail)}
                            className="text-gray-700 hover:text-black focus:outline-none text-xs flex items-center" // Styled for minimal
                          >
                            <FontAwesomeIcon icon={faDatabase} className="mr-1" />SQL
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 p-2 text-center border border-gray-300 bg-gray-50">
            No deployment logs found for any Jira.
          </p>
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
    </div>
  );
};


// Main page component for Deployment History
export default function DeploymentHistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { allJiras, isLoading: isInitialLoading, error: fetchError } = useJiras(); // Fetch allJiras here

    // Redirect logic
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Show loading or error states
    if (status === 'loading' || isInitialLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-black">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                    <span className="text-lg font-light">Loading Deployment History...</span>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Redirect handled by useEffect
    }

    if (fetchError) {
        return <div className="p-4 bg-white text-red-500 min-h-screen">Error: {fetchError}</div>;
    }

    return (
        // Main container for the page, consistent with daily-logs page
        <div className="min-h-screen bg-white p-6">
            <div className="mx-auto"> {/* Centering container */}
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-light text-black mb-4">Deployment History</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div> {/* Divider */}
                </div>
                {/* Deployment Journey Component */}
                <DeploymentJourney allJiras={allJiras} />
            </div>
        </div>
    );
}
