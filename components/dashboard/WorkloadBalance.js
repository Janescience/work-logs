// components/WorkloadBalance.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBalanceScale, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const WorkloadBalance = ({ allJiras }) => {
  const workloadData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Group by projects and services
    const projectWorkload = {};
    const serviceWorkload = {};
    
    allJiras.forEach(jira => {
      // Calculate monthly hours for this jira
      const monthlyHours = jira.dailyLogs?.reduce((sum, log) => {
        const logDate = new Date(log.logDate);
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
          return sum + parseFloat(log.timeSpent || 0);
        }
        return sum;
      }, 0) || 0;
      
      // Count tasks by status
      const isActive = jira.actualStatus === 'In Progress';
      const isCompleted = jira.actualStatus === 'Done';
      
      // Project workload
      if (jira.projectName) {
        if (!projectWorkload[jira.projectName]) {
          projectWorkload[jira.projectName] = {
            name: jira.projectName,
            totalHours: 0,
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            avgHoursPerTask: 0
          };
        }
        
        const project = projectWorkload[jira.projectName];
        project.totalHours += monthlyHours;
        project.totalTasks++;
        if (isActive) project.activeTasks++;
        if (isCompleted) project.completedTasks++;
      }
      
      // Service workload
      if (jira.serviceName) {
        if (!serviceWorkload[jira.serviceName]) {
          serviceWorkload[jira.serviceName] = {
            name: jira.serviceName,
            totalHours: 0,
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            avgHoursPerTask: 0
          };
        }
        
        const service = serviceWorkload[jira.serviceName];
        service.totalHours += monthlyHours;
        service.totalTasks++;
        if (isActive) service.activeTasks++;
        if (isCompleted) service.completedTasks++;
      }
    });
    
    // Calculate averages and sort
    const processWorkload = (workload) => {
      return Object.values(workload)
        .map(item => ({
          ...item,
          avgHoursPerTask: item.totalTasks > 0 ? item.totalHours / item.totalTasks : 0,
          completionRate: item.totalTasks > 0 ? (item.completedTasks / item.totalTasks) * 100 : 0
        }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 5);
    };
    
    const topProjects = processWorkload(projectWorkload);
    const topServices = processWorkload(serviceWorkload);
    
    // Calculate balance metrics
    const totalHours = topProjects.reduce((sum, p) => sum + p.totalHours, 0);
    const maxProjectHours = topProjects.length > 0 ? topProjects[0].totalHours : 0;
    const minProjectHours = topProjects.length > 0 ? topProjects[topProjects.length - 1].totalHours : 0;
    
    const isImbalanced = maxProjectHours > 0 && (maxProjectHours / (minProjectHours || 1)) > 3;
    
    return {
      topProjects,
      topServices,
      totalHours,
      isImbalanced,
      balanceRatio: maxProjectHours > 0 && minProjectHours > 0 ? maxProjectHours / minProjectHours : 0
    };
  }, [allJiras]);
  
  const { topProjects, topServices, totalHours, isImbalanced, balanceRatio } = workloadData;
  
  if (totalHours === 0) {
    return (
      <div className="bg-white p-6 border border-gray-300">
        <h2 className="text-xl font-light text-black mb-4 flex items-center">
          <FontAwesomeIcon icon={faBalanceScale} className="mr-2 text-gray-600 text-base" />
          Workload Balance
        </h2>
        <p className="text-gray-500 text-center py-4">No workload data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-black flex items-center">
          <FontAwesomeIcon icon={faBalanceScale} className="mr-2 text-gray-600 text-base" />
          Workload Balance
        </h2>
        {isImbalanced && (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Imbalanced
          </div>
        )}
      </div>

      {/* Balance Overview */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Balance Ratio:</span>
          <span className={`font-medium ${balanceRatio > 3 ? 'text-red-600' : balanceRatio > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
            {balanceRatio.toFixed(1)}:1
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {balanceRatio > 3 ? 'High imbalance detected' : 
           balanceRatio > 2 ? 'Moderate imbalance' : 'Well balanced'}
        </div>
      </div>

      {/* Project Workload */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Projects</h3>
        <div className="space-y-2">
          {topProjects.map((project, index) => {
            const percentage = totalHours > 0 ? (project.totalHours / totalHours) * 100 : 0;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {project.name}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {project.totalHours.toFixed(1)}h ({percentage.toFixed(0)}%)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{project.totalTasks} tasks</span>
                  <span>{project.completionRate.toFixed(0)}% complete</span>
                  <span>{project.avgHoursPerTask.toFixed(1)}h/task</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Workload */}
      {topServices.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Services</h3>
          <div className="space-y-2">
            {topServices.slice(0, 3).map((service, index) => {
              const serviceTotal = topServices.reduce((sum, s) => sum + s.totalHours, 0);
              const percentage = serviceTotal > 0 ? (service.totalHours / serviceTotal) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">
                    {service.name}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-16 h-1 bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-gray-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-600 text-xs w-12 text-right">
                      {service.totalHours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          {isImbalanced ? (
            <div className="text-red-600">
              • Consider redistributing tasks from high-load projects
            </div>
          ) : (
            <div className="text-green-600">
              • Workload is well distributed across projects
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkloadBalance;