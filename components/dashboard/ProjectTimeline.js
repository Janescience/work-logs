// components/ProjectTimeline.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGanttChart, faCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ProjectTimeline = ({ allJiras }) => {
  const timelineData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group by projects
    const projectMap = {};
    
    allJiras.forEach(jira => {
      if (!jira.projectName) return;
      
      if (!projectMap[jira.projectName]) {
        projectMap[jira.projectName] = {
          name: jira.projectName,
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
          earliestStart: null,
          latestEnd: null,
          totalHours: 0
        };
      }
      
      const project = projectMap[jira.projectName];
      project.totalTasks++;
      
      if (jira.actualStatus === 'Done') {
        project.completedTasks++;
      }
      
      // Calculate dates
      const createdDate = new Date(jira.createdAt);
      const dueDate = jira.dueDate ? new Date(jira.dueDate) : null;
      const updatedDate = jira.updatedAt ? new Date(jira.updatedAt) : null;
      
      if (!project.earliestStart || createdDate < project.earliestStart) {
        project.earliestStart = createdDate;
      }
      
      const endDate = updatedDate || dueDate || today;
      if (!project.latestEnd || endDate > project.latestEnd) {
        project.latestEnd = endDate;
      }
      
      // Calculate hours
      const taskHours = jira.dailyLogs?.reduce((sum, log) => {
        return sum + parseFloat(log.timeSpent || 0);
      }, 0) || 0;
      
      project.totalHours += taskHours;
      
      project.tasks.push({
        jiraNumber: jira.jiraNumber,
        description: jira.description,
        status: jira.actualStatus,
        createdDate,
        dueDate,
        hours: taskHours,
        isOverdue: dueDate && dueDate < today && jira.actualStatus !== 'Done'
      });
    });
    
    // Convert to array and sort by earliest start date
    return Object.values(projectMap)
      .filter(project => project.totalTasks > 0)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5) // Top 5 projects by hours
      .map(project => {
        const duration = project.latestEnd - project.earliestStart;
        const daysSpan = Math.ceil(duration / (1000 * 60 * 60 * 24));
        const progress = project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0;
        
        return { ...project, daysSpan, progress };
      });
  }, [allJiras]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done': return 'text-green-600';
      case 'in progress': return 'text-blue-600';
      case 'cancel': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faGanttChart} className="mr-2 text-gray-600 text-base" />
        Project Timeline
      </h2>

      <div className="space-y-4">
        {timelineData.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No project data available</p>
        ) : (
          timelineData.map((project, index) => (
            <div key={index} className="border border-gray-200 p-4">
              {/* Project Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-black truncate">
                    {project.name}
                  </h3>
                  <div className="text-xs text-gray-600 mt-1">
                    {project.daysSpan} days • {project.totalHours.toFixed(1)}h logged
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-black">
                    {project.progress.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {project.completedTasks}/{project.totalTasks} tasks
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full h-2 bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>
                  {project.earliestStart.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex-1 border-t border-gray-300" />
                <span>Today</span>
                <div className="flex-1 border-t border-gray-300" />
                <span>
                  {project.latestEnd.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* Key Tasks */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-2">Recent Tasks:</div>
                <div className="space-y-1">
                  {project.tasks
                    .sort((a, b) => b.hours - a.hours)
                    .slice(0, 3)
                    .map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center gap-2 text-xs">
                        <FontAwesomeIcon 
                          icon={task.status === 'Done' ? faCheckCircle : faCircle} 
                          className={`${getStatusColor(task.status)} text-xs`}
                        />
                        <span className="font-mono text-gray-600 bg-gray-100 px-1">
                          {task.jiraNumber}
                        </span>
                        <span className="flex-1 truncate text-gray-700">
                          {task.description}
                        </span>
                        <span className="text-gray-500">
                          {task.hours.toFixed(1)}h
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {timelineData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <div className="text-lg font-bold text-black">
                {timelineData.length}
              </div>
              <div className="text-gray-600">Active Projects</div>
            </div>
            <div>
              <div className="text-lg font-bold text-black">
                {(timelineData.reduce((sum, p) => sum + p.progress, 0) / timelineData.length).toFixed(0)}%
              </div>
              <div className="text-gray-600">Avg Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;