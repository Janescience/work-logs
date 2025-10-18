'use client';
import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faDatabase,
  faCheckCircle,
  faCalendarDays,
  faClock,
  faRocket,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import DetailModal from './DetailModal';

const UpcomingDeploymentsModal = ({ isOpen, onClose, allJiras = [] }) => {
  const [deploymentSchedule, setDeploymentSchedule] = useState({
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: []
  });
  const [modalData, setModalData] = useState({ isOpen: false, title: '', content: '' });

  useEffect(() => {
    if (!isOpen || !allJiras.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const endOfThisWeek = new Date(today);
    endOfThisWeek.setDate(today.getDate() + (7 - today.getDay()));

    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const allDeployments = [];

    // Collect all deployment dates from JIRAs
    allJiras.forEach(jira => {
      const deploymentStages = [
        { stage: 'SIT', date: jira.deploySitDate, order: 1 },
        { stage: 'UAT', date: jira.deployUatDate, order: 2 },
        { stage: 'PREPROD', date: jira.deployPreprodDate, order: 3 },
        { stage: 'PROD', date: jira.deployProdDate, order: 4 }
      ];

      deploymentStages.forEach(deployment => {
        if (deployment.date) {
          const deployDate = new Date(deployment.date);
          deployDate.setHours(0, 0, 0, 0);

          const timeDiff = deployDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Only include deployments within next 2 weeks
          if (daysRemaining >= 0 && daysRemaining <= 14) {
            allDeployments.push({
              jiraNumber: jira.jiraNumber,
              description: jira.description,
              stage: deployment.stage,
              stageOrder: deployment.order,
              date: deployDate,
              daysRemaining: daysRemaining,
              envDetail: jira.envDetail,
              sqlDetail: jira.sqlDetail,
              projectName: jira.projectName,
              serviceName: jira.serviceName,
              actualStatus: jira.actualStatus
            });
          }
        }
      });
    });

    // Categorize deployments
    const categorized = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: []
    };

    allDeployments.forEach(deployment => {
      if (deployment.daysRemaining === 0) {
        categorized.today.push(deployment);
      } else if (deployment.daysRemaining === 1) {
        categorized.tomorrow.push(deployment);
      } else if (deployment.date <= endOfThisWeek) {
        categorized.thisWeek.push(deployment);
      } else {
        categorized.nextWeek.push(deployment);
      }
    });

    // Sort each category
    Object.keys(categorized).forEach(key => {
      categorized[key].sort((a, b) => {
        // First sort by date
        const dateDiff = a.date - b.date;
        if (dateDiff !== 0) return dateDiff;
        // Then by stage order
        return a.stageOrder - b.stageOrder;
      });
    });

    setDeploymentSchedule(categorized);
  }, [isOpen, allJiras]);

  const getStageColor = (stage) => {
    switch(stage) {
      case 'SIT': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UAT': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PREPROD': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'PROD': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleIconClick = (deployment, type) => {
    const title = type === 'env'
      ? `Environment Details - ${deployment.jiraNumber} (${deployment.stage})`
      : `SQL Scripts - ${deployment.jiraNumber} (${deployment.stage})`;

    const content = type === 'env'
      ? deployment.envDetail || 'No environment details available'
      : deployment.sqlDetail || 'No SQL scripts available';

    setModalData({
      isOpen: true,
      title,
      content
    });
  };

  const DeploymentItem = ({ deployment, highlight = false }) => (
    <div className={`flex items-center justify-between p-3 border ${
      highlight ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'
    } transition-all`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`px-2 py-1 text-xs font-bold border ${getStageColor(deployment.stage)}`}>
          {deployment.stage}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{deployment.jiraNumber}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-700 truncate">{deployment.description}</span>
          </div>
          {deployment.projectName && (
            <div className="text-xs text-gray-500 mt-1">
              {deployment.projectName}
              {deployment.serviceName && <span> • {deployment.serviceName}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-3">
        <div className="flex items-center gap-2">
          {deployment.envDetail && (
            <button
              onClick={() => handleIconClick(deployment, 'env')}
              className="text-gray-400 hover:text-blue-600 text-sm transition-colors cursor-pointer"
              title="View environment details"
            >
              <FontAwesomeIcon icon={faServer} />
            </button>
          )}
          {deployment.sqlDetail && (
            <button
              onClick={() => handleIconClick(deployment, 'sql')}
              className="text-gray-400 hover:text-green-600 text-sm transition-colors cursor-pointer"
              title="View SQL scripts"
            >
              <FontAwesomeIcon icon={faDatabase} />
            </button>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">{formatDate(deployment.date)}</div>
          {deployment.daysRemaining === 0 ? (
            <span className="text-xs font-bold text-yellow-600">TODAY</span>
          ) : deployment.daysRemaining === 1 ? (
            <span className="text-xs font-bold text-orange-600">TOMORROW</span>
          ) : (
            <span className="text-xs text-gray-600">{deployment.daysRemaining} days</span>
          )}
        </div>
      </div>
    </div>
  );

  const hasAnyDeployments = Object.values(deploymentSchedule).some(arr => arr.length > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
        {/* Modal */}
        <div
          className="fixed inset-x-4 top-4 bottom-4 lg:inset-x-auto lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:w-full lg:max-w-4xl bg-white border border-gray-300 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-black flex items-center gap-2">
                  <FontAwesomeIcon icon={faRocket} className="text-gray-600 text-base" />
                  Upcoming Deployments
                </h2>
                <p className="text-sm text-gray-600 mt-1">Next 2 weeks deployment schedule</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Today Section */}
            {deploymentSchedule.today.length > 0 && (
              <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <span className="animate-pulse">🔥</span>
                  TODAY ({deploymentSchedule.today.length})
                </h3>
                <div className="space-y-2">
                  {deploymentSchedule.today.map((deployment, index) => (
                    <DeploymentItem key={`today-${index}`} deployment={deployment} highlight={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Tomorrow Section */}
            {deploymentSchedule.tomorrow.length > 0 && (
              <div className="p-4 bg-orange-50 border-b border-orange-200">
                <h3 className="text-sm font-semibold text-orange-900 mb-3">
                  TOMORROW ({deploymentSchedule.tomorrow.length})
                </h3>
                <div className="space-y-2">
                  {deploymentSchedule.tomorrow.map((deployment, index) => (
                    <DeploymentItem key={`tomorrow-${index}`} deployment={deployment} />
                  ))}
                </div>
              </div>
            )}

            {/* This Week Section */}
            {deploymentSchedule.thisWeek.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  THIS WEEK ({deploymentSchedule.thisWeek.length})
                </h3>
                <div className="space-y-2">
                  {deploymentSchedule.thisWeek.map((deployment, index) => (
                    <DeploymentItem key={`week-${index}`} deployment={deployment} />
                  ))}
                </div>
              </div>
            )}

            {/* Next Week Section */}
            {deploymentSchedule.nextWeek.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  NEXT WEEK ({deploymentSchedule.nextWeek.length})
                </h3>
                <div className="space-y-2">
                  {deploymentSchedule.nextWeek.map((deployment, index) => (
                    <DeploymentItem key={`nextweek-${index}`} deployment={deployment} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasAnyDeployments && (
              <div className="p-8 text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-600">No deployments scheduled</p>
                <p className="text-sm text-gray-500 mt-1">Nothing scheduled in the next 2 weeks</p>
              </div>
            )}

            {/* Summary */}
            {hasAnyDeployments && (
              <div className="bg-gray-50 p-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      SIT
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      UAT
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      PREPROD
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      PROD
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Total: {Object.values(deploymentSchedule).reduce((sum, arr) => sum + arr.length, 0)} deployments
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, title: '', content: '' })}
        title={modalData.title}
        content={modalData.content}
      />
    </>
  );
};

export default UpcomingDeploymentsModal;