'use client';
import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faServer, 
  faDatabase, 
  faCheckCircle,
  faCalendarDays,
  faHistory,
  faFilter,
  faSearch,
  faTimes,
  faRocket,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';

const DeploymentHistory = ({ allJiras, compact = false }) => {
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filters, setFilters] = useState({
    stage: 'all',
    project: 'all',
    dateRange: '30', // days
    search: ''
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastDeployments = [];
    const projectSet = new Set();

    // Collect all past deployment dates from JIRAs
    allJiras.forEach(jira => {
      if (jira.projectName) projectSet.add(jira.projectName);

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
          
          // Only include past deployments
          if (deployDate < today) {
            pastDeployments.push({
              jiraNumber: jira.jiraNumber,
              description: jira.description,
              stage: deployment.stage,
              stageOrder: deployment.order,
              date: deployDate,
              envDetail: jira.envDetail,
              sqlDetail: jira.sqlDetail,
              projectName: jira.projectName || 'Unknown Project',
              serviceName: jira.serviceName,
              actualStatus: jira.actualStatus,
              daysAgo: Math.floor((today - deployDate) / (1000 * 60 * 60 * 24))
            });
          }
        }
      });
    });

    // Sort by date (most recent first)
    pastDeployments.sort((a, b) => b.date - a.date);
    
    setDeploymentHistory(pastDeployments);
    setFilteredHistory(pastDeployments);
    setProjects(Array.from(projectSet).sort());
  }, [allJiras]);

  useEffect(() => {
    let filtered = [...deploymentHistory];

    // Apply filters
    if (filters.stage !== 'all') {
      filtered = filtered.filter(d => d.stage === filters.stage);
    }

    if (filters.project !== 'all') {
      filtered = filtered.filter(d => d.projectName === filters.project);
    }

    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      filtered = filtered.filter(d => d.daysAgo <= days);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.jiraNumber.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHistory(filtered);
  }, [filters, deploymentHistory]);

  // Group deployments by month
  const groupedByMonth = filteredHistory.reduce((acc, deployment) => {
    const monthYear = deployment.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(deployment);
    return acc;
  }, {});

  const getStageColor = (stage) => {
    switch(stage) {
      case 'SIT': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UAT': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PREPROD': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'PROD': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const toggleGroup = (monthYear) => {
    setExpandedGroups(prev => ({
      ...prev,
      [monthYear]: !prev[monthYear]
    }));
  };

  const DeploymentHistoryItem = ({ deployment }) => (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-center">
          <div className="text-xs text-gray-500">{deployment.date.getDate()}</div>
          <div className="text-xs font-medium text-gray-700">
            {deployment.date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        </div>
        
        <span className={`px-2 py-1 text-xs font-bold rounded border ${getStageColor(deployment.stage)}`}>
          {deployment.stage}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{deployment.jiraNumber}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-700 truncate">{deployment.description}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {deployment.projectName}
            {deployment.serviceName && <span> • {deployment.serviceName}</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-3">
        <div className="flex items-center gap-2">
          {deployment.envDetail && (
            <FontAwesomeIcon icon={faServer} className="text-gray-400 text-xs" title="Has environment details" />
          )}
          {deployment.sqlDetail && (
            <FontAwesomeIcon icon={faDatabase} className="text-gray-400 text-xs" title="Has SQL scripts" />
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {deployment.daysAgo === 0 ? 'Today' : 
           deployment.daysAgo === 1 ? 'Yesterday' : 
           `${deployment.daysAgo} days ago`}
        </div>
      </div>
    </div>
  );

  if (compact) {
    // Compact view for modal
    return (
      <div className="bg-white">
        {/* Filters */}
        <div className="grid grid-cols-2 p-4 border-b border-gray-200 gap-5">
          <div className="flex items-center ">
            <input
              type="text"
              placeholder="Search by JIRA or description..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black text-black"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className=" border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black text-black"
              value={filters.stage}
              onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
            >
              <option value="all">All Stages</option>
              <option value="SIT">SIT</option>
              <option value="UAT">UAT</option>
              <option value="PREPROD">PREPROD</option>
              <option value="PROD">PROD</option>
            </select>
            
            <select
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black text-black"
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* History List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedByMonth).map(([monthYear, deployments]) => (
            <div key={monthYear} className="border-b border-gray-200">
              <button
                onClick={() => toggleGroup(monthYear)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700"
              >
                <span>{monthYear} ({deployments.length})</span>
                <FontAwesomeIcon 
                  icon={expandedGroups[monthYear] ? faChevronUp : faChevronDown} 
                  className="text-gray-400"
                />
              </button>
              
              {(expandedGroups[monthYear] !== false) && (
                <div>
                  {deployments.map((deployment, index) => (
                    <DeploymentHistoryItem key={`${monthYear}-${index}`} deployment={deployment} />
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {filteredHistory.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FontAwesomeIcon icon={faHistory} className="text-3xl mb-2" />
              <p>No deployment history found</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          Showing {filteredHistory.length} of {deploymentHistory.length} deployments
        </div>
      </div>
    );
  }

  // Full page view
  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-light text-black flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} className="text-gray-600" />
              Deployment History
            </h2>
            <p className="text-sm text-gray-600 mt-1">Track past deployments across all environments</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {deploymentHistory.length} deployments
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search JIRA number or description..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
            value={filters.stage}
            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
          >
            <option value="all">All Stages</option>
            <option value="SIT">SIT Only</option>
            <option value="UAT">UAT Only</option>
            <option value="PREPROD">PREPROD Only</option>
            <option value="PROD">PROD Only</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
            value={filters.project}
            onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* History by Month */}
      <div className="divide-y divide-gray-200">
        {Object.entries(groupedByMonth).map(([monthYear, deployments]) => (
          <div key={monthYear}>
            <div className="px-4 py-3 bg-gray-50 font-medium text-gray-700 flex items-center justify-between">
              <span>{monthYear}</span>
              <span className="text-sm font-normal text-gray-500">{deployments.length} deployments</span>
            </div>
            <div className="divide-y divide-gray-100">
              {deployments.map((deployment, index) => (
                <DeploymentHistoryItem key={`${monthYear}-${index}`} deployment={deployment} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="p-12 text-center">
          <FontAwesomeIcon icon={faHistory} className="text-4xl text-gray-300 mb-3" />
          <p className="text-gray-600">No deployment history found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Statistics */}
      {filteredHistory.length > 0 && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-light text-blue-600">
                {filteredHistory.filter(d => d.stage === 'SIT').length}
              </div>
              <div className="text-xs text-gray-600">SIT Deployments</div>
            </div>
            <div>
              <div className="text-2xl font-light text-purple-600">
                {filteredHistory.filter(d => d.stage === 'UAT').length}
              </div>
              <div className="text-xs text-gray-600">UAT Deployments</div>
            </div>
            <div>
              <div className="text-2xl font-light text-orange-600">
                {filteredHistory.filter(d => d.stage === 'PREPROD').length}
              </div>
              <div className="text-xs text-gray-600">PREPROD Deployments</div>
            </div>
            <div>
              <div className="text-2xl font-light text-red-600">
                {filteredHistory.filter(d => d.stage === 'PROD').length}
              </div>
              <div className="text-xs text-gray-600">PROD Deployments</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentHistory;