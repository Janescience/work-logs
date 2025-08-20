// components/TaskTimeline.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGanttChart, faClock } from '@fortawesome/free-solid-svg-icons';

const TaskTimeline = ({ allJiras }) => {
  const timelineData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Process individual tasks
    const tasks = allJiras
      .filter(jira => jira.jiraNumber && jira.description)
      .map(jira => {
        const createdDate = new Date(jira.createdAt);
        const updatedDate = jira.updatedAt ? new Date(jira.updatedAt) : null;
        
        // Deployment phases timeline
        const deployPhases = [
          { name: 'SIT', date: jira.deploySitDate ? new Date(jira.deploySitDate) : null, env: 'sit' },
          { name: 'UAT', date: jira.deployUatDate ? new Date(jira.deployUatDate) : null, env: 'uat' },
          { name: 'PreProd', date: jira.deployPreprodDate ? new Date(jira.deployPreprodDate) : null, env: 'preprod' },
          { name: 'Prod', date: jira.deployProdDate ? new Date(jira.deployProdDate) : null, env: 'prod' }
        ];
        
        // Find current phase and next phase based on today's date
        let currentPhase = null;
        let nextPhase = null;
        let completedPhases = 0;
        
        for (let i = 0; i < deployPhases.length; i++) {
          if (deployPhases[i].date) {
            // Check if deploy date has passed (is in the past or today)
            if (deployPhases[i].date <= today) {
              currentPhase = deployPhases[i];
              completedPhases++;
            } else {
              // This phase has a date but it's in the future, so it's the next phase
              if (!nextPhase) {
                nextPhase = deployPhases[i];
              }
              break;
            }
          } else {
            // No deploy date set for this phase, it becomes the next phase
            if (!nextPhase) {
              nextPhase = deployPhases[i];
            }
            break;
          }
        }
        
        // Check if task should show deployment progress
        const hasDeploymentDates = deployPhases.some(phase => phase.date !== null);
        const isDeployableProject = jira.projectName && 
          !['Other', 'BAU', 'other', 'bau'].includes(jira.projectName.trim());
        const showDeploymentProgress = hasDeploymentDates && isDeployableProject;
        
        // Calculate task duration
        const latestDeployDate = currentPhase?.date || createdDate;
        const duration = latestDeployDate - createdDate;
        const daysSpan = Math.ceil(duration / (1000 * 60 * 60 * 24));
        
        // Calculate hours logged
        const hoursLogged = jira.dailyLogs?.reduce((sum, log) => {
          return sum + parseFloat(log.timeSpent || 0);
        }, 0) || 0;
        
        // Calculate progress
        let progress = 0;
        
        if (jira.actualStatus?.toLowerCase() === 'done') {
          progress = 100;
        } else if (hasDeploymentDates) {
          // Calculate progress based on deployment phases (25% per phase completed)
          // Only count phases that have actually been deployed (passed their date)
          progress = completedPhases * 25;
          
          // If all phases are completed but status isn't done, set to 90% to show it's almost done
          if (completedPhases === 4 && jira.actualStatus?.toLowerCase() !== 'done') {
            progress = 90;
          }
        } else {
          // For tasks without deployment dates, calculate based on actual status
          const status = (jira.actualStatus || '').toLowerCase();
          switch (status) {
            case 'in progress':
            case 'develop':
            case 'analysis':
              progress = 30;
              break;
            case 'sit':
              progress = 50;
              break;
            case 'uat':
              progress = 70;
              break;
            case 'awaiting production':
            case 'production':
              progress = 90;
              break;
            default:
              progress = 10; // Default for new tasks
              break;
          }
        }
        
        return {
          jiraNumber: jira.jiraNumber,
          description: jira.description,
          projectName: jira.projectName || 'No Project',
          status: jira.actualStatus || 'Open',
          jiraStatus: jira.jiraStatus || 'Open',
          serviceName: jira.serviceName,
          createdDate,
          updatedDate,
          daysSpan: Math.max(1, daysSpan),
          hoursLogged,
          progress,
          deployPhases,
          currentPhase,
          nextPhase,
          completedPhases,
          showDeploymentProgress,
          isActive: jira.actualStatus && !['Done', 'Cancelled', 'Cancel'].includes(jira.actualStatus),
          recentActivity: jira.dailyLogs?.length > 0 ? 
            Math.max(...jira.dailyLogs.map(log => new Date(log.logDate).getTime())) : 
            createdDate.getTime()
        };
      })
      .sort((a, b) => {
        // Sort by: Active tasks first, then by recent activity, then by created date
        if (a.isActive !== b.isActive) {
          return b.isActive - a.isActive;
        }
        if (a.recentActivity !== b.recentActivity) {
          return b.recentActivity - a.recentActivity;
        }
        return b.createdDate - a.createdDate;
      })
      .slice(0, 8); // Show top 8 tasks for better readability
    
    return tasks;
  }, [allJiras]);

  return (
    <div className="bg-white p-4 border border-gray-300">
      <h2 className="text-lg font-medium text-black mb-3 flex items-center">
        <FontAwesomeIcon icon={faGanttChart} className="mr-2 text-gray-600" />
        Task Timeline
      </h2>

      <div className="space-y-2">
        {timelineData.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No task data available</p>
        ) : (
          timelineData.map((task, index) => (
            <div key={index} className={`border border-gray-200 p-3 ${task.isActive ? 'border-l-2 border-l-black' : ''}`}>
              
              {/* Task Header - Single Line */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-xs bg-gray-100 text-black px-2 py-1 rounded">
                    {task.jiraNumber}
                  </span>
                  <span className="text-sm font-medium text-black truncate">
                    {task.description}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} />
                    {task.hoursLogged.toFixed(1)}h
                  </div>
                  <div className="font-medium text-black">
                    {task.progress}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Compact Info */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <span>{task.projectName}</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">{task.jiraStatus}</span>
                  <span className="bg-black text-white px-2 py-1 rounded">{task.status}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {task.showDeploymentProgress ? (
                    <>
                      {task.currentPhase && (
                        <span className="bg-black text-white px-2 py-1 rounded text-xs">
                          {task.currentPhase.name}
                        </span>
                      )}
                      {task.nextPhase && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border">
                          → {task.nextPhase.name}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">
                      Monthly progress
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compact Summary */}
      {timelineData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>{timelineData.filter(t => t.isActive).length} active</span>
            <span>{timelineData.filter(t => t.currentPhase?.env === 'prod').length} in production</span>
            <span>Avg {(timelineData.reduce((sum, t) => sum + t.progress, 0) / timelineData.length).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimeline;