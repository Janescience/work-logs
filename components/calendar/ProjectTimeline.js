// components/calendar/ProjectTimeline.js
'use client';

import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronRight, 
  faCalendarAlt,
  faProjectDiagram,
  faTasks,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { Avatar } from '@/components/ui';

const ProjectTimeline = ({ allJiras }) => {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [viewMode, setViewMode] = useState('project'); // 'project', 'jira', 'member'

  // Group jiras by different criteria based on view mode
  const timelineData = useMemo(() => {
    if (!allJiras || allJiras.length === 0) return [];

    const groups = {};
    const today = new Date();
    let earliestDate = new Date();
    let latestDate = new Date();

    // Filter out completed jiras first
    const activeJiras = allJiras.filter(jira => {
      const actualStatus = (jira.actualStatus || '').toLowerCase();
      const jiraStatus = (jira.jiraStatus || '').toLowerCase();
      
      return !(actualStatus === 'done' || 
               jiraStatus === 'done' || 
               jiraStatus === 'closed' || 
               jiraStatus === 'cancel' || 
               jiraStatus === 'cancelled' ||
               jiraStatus === 'deployed to production');
    });

    // Group jiras based on view mode
    activeJiras.forEach(jira => {
      let groupKey, groupData;

      switch (viewMode) {
        case 'project':
          groupKey = jira.projectName || 'Unassigned Project';
          groupData = {
            name: groupKey,
            type: 'project',
            jiras: [],
            totalJiras: 0,
            earliestDeployment: null,
            latestDeployment: null
          };
          break;
        
        case 'member':
          groupKey = jira.assignee || 'Unassigned';
          groupData = {
            name: groupKey,
            type: 'member',
            jiras: [],
            totalJiras: 0,
            earliestDeployment: null,
            latestDeployment: null
          };
          break;
        
        case 'jira':
          // For jira view, each jira is its own group
          groupKey = jira.jiraNumber || `${jira._id}`;
          groupData = {
            name: `${jira.jiraNumber} - ${jira.description?.substring(0, 50)}...`,
            type: 'jira',
            assignee: jira.assignee,
            projectName: jira.projectName,
            jiras: [jira],
            totalJiras: 1,
            earliestDeployment: null,
            latestDeployment: null
          };
          break;
        
        default:
          return;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = groupData;
      }

      if (viewMode !== 'jira') {
        groups[groupKey].jiras.push(jira);
        groups[groupKey].totalJiras++;
      }

      // Since we're filtering out completed ones above, we don't need this check anymore
      // All remaining jiras are active

      // Track deployment dates for timeline calculation
      const deploymentDates = [
        jira.deploySitDate,
        jira.deployUatDate, 
        jira.deployPreprodDate,
        jira.deployProdDate
      ].filter(Boolean).map(date => new Date(date));

      deploymentDates.forEach(date => {
        if (date < earliestDate) earliestDate = date;
        if (date > latestDate) latestDate = date;
        
        if (!groups[groupKey].earliestDeployment || date < groups[groupKey].earliestDeployment) {
          groups[groupKey].earliestDeployment = date;
        }
        if (!groups[groupKey].latestDeployment || date > groups[groupKey].latestDeployment) {
          groups[groupKey].latestDeployment = date;
        }
      });
    });

    // Generate timeline months
    const timelineMonths = [];
    const startDate = new Date(Math.min(earliestDate, today));
    startDate.setDate(1); // Start of month
    
    const endDate = new Date(Math.max(latestDate, today));
    endDate.setMonth(endDate.getMonth() + 3); // Add 3 months buffer
    
    const current = new Date(startDate);
    while (current <= endDate) {
      timelineMonths.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        monthName: current.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        isCurrentMonth: current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return {
      groups: Object.values(groups).sort((a, b) => b.totalJiras - a.totalJiras),
      timelineMonths,
      timelineStart: startDate,
      timelineEnd: endDate,
      viewMode
    };
  }, [allJiras, viewMode]);

  const toggleGroup = (groupKey) => {
    setExpandedProjects(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const getGroupIcon = (type) => {
    switch (type) {
      case 'project': return faProjectDiagram;
      case 'member': return faTasks;
      case 'jira': return faCircle;
      default: return faProjectDiagram;
    }
  };

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'project': return 'Projects & JIRAs';
      case 'member': return 'Members & JIRAs';
      case 'jira': return 'Individual JIRAs';
      default: return 'Items';
    }
  };

  const getDeploymentPosition = (date, timelineStart, timelineEnd) => {
    if (!date) return null;
    const deployDate = new Date(date);
    const totalDuration = timelineEnd - timelineStart;
    const position = ((deployDate - timelineStart) / totalDuration) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const getDeploymentColor = (stage) => {
    const colors = {
      sit: 'bg-blue-500',
      uat: 'bg-yellow-500', 
      preprod: 'bg-orange-500',
      prod: 'bg-green-500'
    };
    return colors[stage] || 'bg-gray-500';
  };

  if (!timelineData.groups || timelineData.groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FontAwesomeIcon icon={faProjectDiagram} className="text-4xl mb-4" />
        <p>No active items with deployment timeline found</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with View Mode Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
              Deployment Timeline
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Timeline showing deployment schedules across {timelineData.groups.length} {viewMode === 'project' ? 'projects' : viewMode === 'member' ? 'members' : 'JIRAs'}
            </p>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View by:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="project">Project</option>
              <option value="member">Member</option>
              <option value="jira">Individual JIRA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b border-gray-200">
        <div className="w-80 p-4 bg-gray-50 border-r border-gray-200">
          <h4 className="font-medium text-gray-700">{getViewModeLabel()}</h4>
        </div>
        <div className="flex-1 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700">Deployment Timeline</h4>
          <div className="flex mt-2 text-xs">
            {timelineData.timelineMonths.map((month, index) => (
              <div 
                key={`${month.year}-${month.month}`}
                className={`flex-1 text-center px-1 py-1 ${
                  month.isCurrentMonth ? 'bg-blue-100 text-blue-700 font-medium rounded' : 'text-gray-600'
                }`}
                style={{ minWidth: '80px' }}
              >
                {month.monthName}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Groups List with Timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        {timelineData.groups.map((group, groupIndex) => (
          <div key={group.name} className={groupIndex > 0 ? 'border-t border-gray-100' : ''}>
            {/* Group Header */}
            <div className="flex">
              <div className="w-80 border-r border-gray-200">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  disabled={viewMode === 'jira'} // Disable expand for jira view
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {viewMode !== 'jira' && (
                        <FontAwesomeIcon 
                          icon={expandedProjects[group.name] ? faChevronDown : faChevronRight}
                          className="text-gray-400 mr-2"
                        />
                      )}
                      {viewMode === 'member' && (
                        <Avatar
                          username={group.name}
                          size={20}
                          className="w-5 h-5 mr-2"
                        />
                      )}
                      {viewMode !== 'member' && (
                        <FontAwesomeIcon icon={getGroupIcon(group.type)} className="text-gray-500 mr-2" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 truncate">{group.name}</div>
                        <div className="text-sm text-gray-500">
                          {viewMode === 'jira' ? (
                            <>
                              <span className="text-blue-600">{group.assignee}</span>
                              {group.projectName && <span> • {group.projectName}</span>}
                            </>
                          ) : (
                            `${group.totalJiras} Active JIRA${group.totalJiras !== 1 ? 's' : ''}`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Group Timeline */}
              <div className="flex-1 p-4 relative">
                <div className="relative h-8">
                  {/* Timeline background */}
                  <div className="absolute inset-0 bg-gray-100 rounded"></div>
                  
                  {/* Group span indicator */}
                  {group.earliestDeployment && group.latestDeployment && (
                    <div 
                      className="absolute h-2 bg-gray-300 rounded top-3"
                      style={{
                        left: `${getDeploymentPosition(group.earliestDeployment, timelineData.timelineStart, timelineData.timelineEnd)}%`,
                        width: `${getDeploymentPosition(group.latestDeployment, timelineData.timelineStart, timelineData.timelineEnd) - getDeploymentPosition(group.earliestDeployment, timelineData.timelineStart, timelineData.timelineEnd)}%`
                      }}
                    ></div>
                  )}
                  
                  {/* Current date indicator */}
                  <div 
                    className="absolute w-0.5 h-full bg-red-500 z-10"
                    style={{
                      left: `${getDeploymentPosition(new Date(), timelineData.timelineStart, timelineData.timelineEnd)}%`
                    }}
                  ></div>

                  {/* For jira view, show deployment markers directly */}
                  {viewMode === 'jira' && group.jiras[0] && (
                    <>
                      {[
                        { stage: 'sit', date: group.jiras[0].deploySitDate, label: 'SIT' },
                        { stage: 'uat', date: group.jiras[0].deployUatDate, label: 'UAT' },
                        { stage: 'preprod', date: group.jiras[0].deployPreprodDate, label: 'PRE' },
                        { stage: 'prod', date: group.jiras[0].deployProdDate, label: 'PROD' }
                      ].map(deployment => {
                        if (!deployment.date) return null;
                        const position = getDeploymentPosition(deployment.date, timelineData.timelineStart, timelineData.timelineEnd);
                        return (
                          <div
                            key={deployment.stage}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${position}%`, transform: 'translateX(-50%)', top: '8px' }}
                          >
                            <div 
                              className={`w-3 h-3 rounded-full ${getDeploymentColor(deployment.stage)} border-2 border-white shadow`}
                              title={`${deployment.label}: ${new Date(deployment.date).toLocaleDateString('en-GB')}`}
                            ></div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded JIRAs (only for project and member views) */}
            {expandedProjects[group.name] && viewMode !== 'jira' && (
              <div className="bg-gray-50">
                {group.jiras.map((jira, jiraIndex) => (
                  <div key={jira._id || jiraIndex} className="flex border-t border-gray-100">
                    <div className="w-80 border-r border-gray-200 p-3 pl-8">
                      <div className="flex items-center">
                        <Avatar
                          username={jira.assignee}
                          size={24}
                          className="w-6 h-6 mr-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-blue-600">{jira.jiraNumber}</div>
                          <div className="text-xs text-gray-600 truncate">{jira.description}</div>
                          <div className="text-xs text-gray-500">{jira.assignee}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* JIRA Timeline */}
                    <div className="flex-1 p-3 relative">
                      <div className="relative h-6">
                        {/* Deployment markers */}
                        {[
                          { stage: 'sit', date: jira.deploySitDate, label: 'SIT' },
                          { stage: 'uat', date: jira.deployUatDate, label: 'UAT' },
                          { stage: 'preprod', date: jira.deployPreprodDate, label: 'PRE' },
                          { stage: 'prod', date: jira.deployProdDate, label: 'PROD' }
                        ].map(deployment => {
                          if (!deployment.date) return null;
                          const position = getDeploymentPosition(deployment.date, timelineData.timelineStart, timelineData.timelineEnd);
                          return (
                            <div
                              key={deployment.stage}
                              className="absolute flex flex-col items-center"
                              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                            >
                              <div 
                                className={`w-3 h-3 rounded-full ${getDeploymentColor(deployment.stage)} border-2 border-white shadow`}
                                title={`${deployment.label}: ${new Date(deployment.date).toLocaleDateString('en-GB')}`}
                              ></div>
                              <div className="text-xs text-gray-600 mt-1 font-medium">{deployment.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-600">SIT</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-gray-600">UAT</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-gray-600">PREPROD</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-600">PROD</span>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-0.5 h-4 bg-red-500 mr-2"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;