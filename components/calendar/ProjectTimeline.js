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

  // Group jiras by project and calculate timeline data
  const projectData = useMemo(() => {
    if (!allJiras || allJiras.length === 0) return [];

    const projects = {};
    const today = new Date();
    let earliestDate = new Date();
    let latestDate = new Date();

    // Group jiras by project
    allJiras.forEach(jira => {
      const projectName = jira.projectName || 'Unassigned Project';
      
      if (!projects[projectName]) {
        projects[projectName] = {
          name: projectName,
          jiras: [],
          totalJiras: 0,
          completedJiras: 0,
          earliestDeployment: null,
          latestDeployment: null
        };
      }

      projects[projectName].jiras.push(jira);
      projects[projectName].totalJiras++;

      // Check if completed
      const status = (jira.actualStatus || '').toLowerCase();
      if (status === 'done' || status === 'closed' || status === 'deployed') {
        projects[projectName].completedJiras++;
      }

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
        
        if (!projects[projectName].earliestDeployment || date < projects[projectName].earliestDeployment) {
          projects[projectName].earliestDeployment = date;
        }
        if (!projects[projectName].latestDeployment || date > projects[projectName].latestDeployment) {
          projects[projectName].latestDeployment = date;
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
      projects: Object.values(projects).sort((a, b) => b.totalJiras - a.totalJiras),
      timelineMonths,
      timelineStart: startDate,
      timelineEnd: endDate
    };
  }, [allJiras]);

  const toggleProject = (projectName) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
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

  if (!projectData.projects || projectData.projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FontAwesomeIcon icon={faProjectDiagram} className="text-4xl mb-4" />
        <p>No projects with deployment timeline found</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
          Project Deployment Timeline
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Timeline showing deployment schedules across {projectData.projects.length} projects
        </p>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b border-gray-200">
        <div className="w-80 p-4 bg-gray-50 border-r border-gray-200">
          <h4 className="font-medium text-gray-700">Projects & JIRAs</h4>
        </div>
        <div className="flex-1 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700">Deployment Timeline</h4>
          <div className="flex mt-2 text-xs">
            {projectData.timelineMonths.map((month, index) => (
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

      {/* Projects List with Timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        {projectData.projects.map((project, projectIndex) => (
          <div key={project.name} className={projectIndex > 0 ? 'border-t border-gray-100' : ''}>
            {/* Project Header */}
            <div className="flex">
              <div className="w-80 border-r border-gray-200">
                <button
                  onClick={() => toggleProject(project.name)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={expandedProjects[project.name] ? faChevronDown : faChevronRight}
                        className="text-gray-400 mr-2"
                      />
                      <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900 truncate">{project.name}</div>
                        <div className="text-sm text-gray-500">
                          {project.totalJiras} JIRAs 
                          {project.completedJiras > 0 && ` (${project.completedJiras} completed)`}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Project Timeline */}
              <div className="flex-1 p-4 relative">
                <div className="relative h-8">
                  {/* Timeline background */}
                  <div className="absolute inset-0 bg-gray-100 rounded"></div>
                  
                  {/* Project span indicator */}
                  {project.earliestDeployment && project.latestDeployment && (
                    <div 
                      className="absolute h-2 bg-gray-300 rounded top-3"
                      style={{
                        left: `${getDeploymentPosition(project.earliestDeployment, projectData.timelineStart, projectData.timelineEnd)}%`,
                        width: `${getDeploymentPosition(project.latestDeployment, projectData.timelineStart, projectData.timelineEnd) - getDeploymentPosition(project.earliestDeployment, projectData.timelineStart, projectData.timelineEnd)}%`
                      }}
                    ></div>
                  )}
                  
                  {/* Current date indicator */}
                  <div 
                    className="absolute w-0.5 h-full bg-red-500 z-10"
                    style={{
                      left: `${getDeploymentPosition(new Date(), projectData.timelineStart, projectData.timelineEnd)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Expanded JIRAs */}
            {expandedProjects[project.name] && (
              <div className="bg-gray-50">
                {project.jiras.map((jira, jiraIndex) => (
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
                          const position = getDeploymentPosition(deployment.date, projectData.timelineStart, projectData.timelineEnd);
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