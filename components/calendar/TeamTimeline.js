// components/TeamTimeline.js
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faCheckCircle, 
  faServer,
  faDatabase,
  faCalendarDays,
  faFilter,
  faUser,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '@/utils/dateUtils';

const TeamTimeline = ({ allJiras }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [filters, setFilters] = useState({
    assignee: 'all',
    stage: 'all',
    alertsOnly: false
  });
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    processTimelineData();
  }, [allJiras, filters, currentMonthOffset]);

  const processTimelineData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate month range based on offset
    const currentDate = new Date(today);
    currentDate.setMonth(today.getMonth() + currentMonthOffset);
    
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get unique assignees
    const uniqueAssignees = [...new Set(allJiras.map(j => j.assignee))].filter(Boolean);
    setAssignees(uniqueAssignees);

    const timeline = [];
    
    allJiras.forEach(jira => {
      // Apply filters
      if (filters.assignee !== 'all' && jira.assignee !== filters.assignee) return;

      const deploymentStages = [
        { stage: 'SIT', date: jira.deploySitDate, order: 1 },
        { stage: 'UAT', date: jira.deployUatDate, order: 2 },
        { stage: 'PREPROD', date: jira.deployPreprodDate, order: 3 },
        { stage: 'PROD', date: jira.deployProdDate, order: 4 }
      ];

      deploymentStages.forEach(deployment => {
        if (!deployment.date) return;
        
        const deployDate = new Date(deployment.date);
        deployDate.setHours(0, 0, 0, 0);
        
        // Check if deployment is in current month range
        if (deployDate < monthStart || deployDate > monthEnd) return;
        
        // Apply stage filter
        if (filters.stage !== 'all' && deployment.stage !== filters.stage) return;

        // Check for alerts (PROD deployment approaching but not ready)
        let hasAlert = false;
        let alertMessage = '';
        
        if (deployment.stage === 'PROD') {
          const daysUntilProd = Math.ceil((deployDate - today) / (1000 * 60 * 60 * 24));
          const status = jira.actualStatus?.toLowerCase() || '';
          
          if (daysUntilProd <= 3 && daysUntilProd >= 0 && 
              !['ready for production', 'deployed', 'done', 'closed'].includes(status)) {
            hasAlert = true;
            alertMessage = `PROD in ${daysUntilProd} days but status is "${jira.actualStatus}"`;
          }
        }

        // Apply alerts filter
        if (filters.alertsOnly && !hasAlert) return;

        timeline.push({
          date: deployDate,
          dayOfMonth: deployDate.getDate(),
          weekOfMonth: Math.ceil(deployDate.getDate() / 7),
          jira: {
            ...jira,
            stage: deployment.stage,
            stageOrder: deployment.order,
            hasAlert,
            alertMessage
          }
        });
      });
    });

    // Sort by date and stage order
    timeline.sort((a, b) => {
      const dateDiff = a.date - b.date;
      if (dateDiff !== 0) return dateDiff;
      return a.jira.stageOrder - b.jira.stageOrder;
    });

    setTimelineData(timeline);
  };

  const getStageColor = (stage) => {
    switch(stage) {
      case 'SIT': return 'bg-blue-500';
      case 'UAT': return 'bg-green-500';
      case 'PREPROD': return 'bg-orange-500';
      case 'PROD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const getMonthDates = () => {
    const today = new Date();
    const currentDate = new Date(today);
    currentDate.setMonth(today.getMonth() + currentMonthOffset);
    
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const dates = [];
    const currentDateIter = new Date(monthStart);
    
    while (currentDateIter <= monthEnd) {
      dates.push(new Date(currentDateIter));
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    
    return { dates, monthStart, monthEnd };
  };

  const { dates: monthDates, monthStart, monthEnd } = getMonthDates();
  const isCurrentMonth = currentMonthOffset === 0;

  // Group timeline data by day
  const timelineByDay = monthDates.map(date => {
    const dayData = timelineData.filter(item => 
      item.date.toDateString() === date.toDateString()
    );
    return {
      date,
      items: dayData
    };
  });

  return (
    <div className="bg-white border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-black">Deployment Timeline</h2>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonthOffset(currentMonthOffset - 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            
            <div className="text-center">
              <div className="text-sm font-medium text-black">
                {monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <button
              onClick={() => setCurrentMonthOffset(currentMonthOffset + 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
            value={filters.assignee}
            onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
          >
            <option value="all">All Members</option>
            {assignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
            value={filters.stage}
            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
          >
            <option value="all">All Stages</option>
            <option value="SIT">SIT</option>
            <option value="UAT">UAT</option>
            <option value="PREPROD">PREPROD</option>
            <option value="PROD">PROD</option>
          </select>
          
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.alertsOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, alertsOnly: e.target.checked }))}
              className="text-black focus:ring-black"
            />
            <span>Alerts Only</span>
          </label>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                <div className="text-sm font-medium text-black">{day}</div>
              </div>
            ))}
          </div>

          {/* Calendar Content */}
          <div className="grid grid-cols-7 min-h-[600px]">
            {/* Empty cells for start of month */}
            {Array.from({ length: monthStart.getDay() }, (_, index) => (
              <div key={`empty-${index}`} className="border-r border-gray-200 border-b border-gray-200 p-2 bg-gray-50"></div>
            ))}
            
            {/* Month days */}
            {timelineByDay.map((day, dayIndex) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              
              return (
                <div 
                  key={dayIndex} 
                  className={`border-r border-gray-200 border-b border-gray-200 p-2 min-h-[120px] ${
                    isToday ? 'bg-gray-100' : isWeekend ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {/* Date Number */}
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-black' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>{day.date.getDate()}</span>
                      {isToday && (
                        <span className="bg-black text-white px-1 py-0.5 text-xs font-bold">TODAY</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Deployments */}
                  <div className="space-y-1">
                    {day.items.map((item, itemIndex) => (
                      <DeploymentCard key={itemIndex} deployment={item.jira} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500"></div>
            <span>SIT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500"></div>
            <span>UAT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500"></div>
            <span>PREPROD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>PROD</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Deployment Card Component
  function DeploymentCard({ deployment }) {
    const getAssigneeInitials = (assignee) => {
      return assignee.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div 
        className={`p-1 text-xs leading-tight ${
          deployment.hasAlert 
            ? 'bg-yellow-100 border border-yellow-300' 
            : 'bg-white border border-gray-200'
        } hover:bg-gray-50 transition-colors mb-1`}
        title={`${deployment.stage} - ${deployment.jiraNumber} by ${deployment.assignee}${deployment.hasAlert ? ' (Alert: ' + deployment.alertMessage + ')' : ''}`}
      >
        <div className="flex items-center justify-between">
          {/* Stage + JIRA */}
          <a
            href={`https://${process.env.JIRA_DOMAIN}/browse/${deployment.jiraNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-black hover:underline truncate flex-1 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getStageColor(deployment.stage)}`}></span>
            <span className="truncate">{deployment.jiraNumber}</span>
          </a>
          
          {/* Assignee initials + Alert */}
          <div className="flex items-center gap-1 ml-1">
            <span className="bg-gray-200 text-gray-700 px-1 rounded text-xs font-medium">
              {getAssigneeInitials(deployment.assignee)}
            </span>
            {deployment.hasAlert && (
              <span className="text-orange-600 font-bold">!</span>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default TeamTimeline;