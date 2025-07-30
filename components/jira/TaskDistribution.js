// components/TaskDistribution.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPieChart } from '@fortawesome/free-solid-svg-icons';

const TaskDistribution = ({ allJiras }) => {
  const distribution = useMemo(() => {
    const projectCount = {};
    const serviceCount = {};
    const projectHours = {};
    const serviceHours = {};
    const projectCompletion = {};
    const serviceCompletion = {};
    const statusCount = {
      'In Progress': 0,
      'Done': 0,
      'Cancel': 0
    };

    // Get current month for filtering
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    allJiras.forEach(jira => {
      // Calculate total hours for this jira
      const totalHours = jira.dailyLogs?.reduce((sum, log) => {
        const logDate = new Date(log.logDate);
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
          return sum + parseFloat(log.timeSpent || 0);
        }
        return sum;
      }, 0) || 0;

      // Count by project
      if (jira.projectName) {
        projectCount[jira.projectName] = (projectCount[jira.projectName] || 0) + 1;
        projectHours[jira.projectName] = (projectHours[jira.projectName] || 0) + totalHours;
        
        if (!projectCompletion[jira.projectName]) {
          projectCompletion[jira.projectName] = { total: 0, done: 0 };
        }
        projectCompletion[jira.projectName].total++;
        if (jira.actualStatus === 'Done') {
          projectCompletion[jira.projectName].done++;
        }
      }

      // Count by service
      if (jira.serviceName) {
        serviceCount[jira.serviceName] = (serviceCount[jira.serviceName] || 0) + 1;
        serviceHours[jira.serviceName] = (serviceHours[jira.serviceName] || 0) + totalHours;
        
        if (!serviceCompletion[jira.serviceName]) {
          serviceCompletion[jira.serviceName] = { total: 0, done: 0 };
        }
        serviceCompletion[jira.serviceName].total++;
        if (jira.actualStatus === 'Done') {
          serviceCompletion[jira.serviceName].done++;
        }
      }

      // Count by status
      const status = jira.actualStatus || 'Unknown';
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      }
    });

    // Get top 5 projects with detailed metrics
    const topProjects = Object.entries(projectCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        hours: projectHours[name] || 0,
        completionRate: projectCompletion[name] 
          ? Math.round((projectCompletion[name].done / projectCompletion[name].total) * 100)
          : 0,
        avgHoursPerTask: count > 0 ? ((projectHours[name] || 0) / count).toFixed(1) : '0.0'
      }));

    // Get top 5 services with detailed metrics
    const topServices = Object.entries(serviceCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        hours: serviceHours[name] || 0,
        completionRate: serviceCompletion[name]
          ? Math.round((serviceCompletion[name].done / serviceCompletion[name].total) * 100)
          : 0,
        avgHoursPerTask: count > 0 ? ((serviceHours[name] || 0) / count).toFixed(1) : '0.0'
      }));

    const totalTasks = allJiras.length;
    const totalHours = Object.values(projectHours).reduce((sum, hours) => sum + hours, 0);

    return { topProjects, topServices, statusCount, totalTasks, totalHours };
  }, [allJiras]);

  const statusColors = {
    'In Progress': 'bg-black',
    'Done': 'bg-black',
    'Cancel': 'bg-red-400'
  };

  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faPieChart} className="mr-2 text-gray-600 text-base" />
        Task Distribution
      </h2>

      {/* Status Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-600 mb-3">By Status</h3>
        <div className="space-y-2">
          {Object.entries(distribution.statusCount).map(([status, count]) => {
            const percentage = distribution.totalTasks > 0 
              ? Math.round((count / distribution.totalTasks) * 100) 
              : 0;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1 text-black">
                  <span className="text-gray-700">{status}</span>
                  <span className="font-medium">{count} ({percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${statusColors[status]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded text-center">
          <div className="text-xl font-bold text-black">{distribution.totalTasks}</div>
          <div className="text-xs text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-gray-50 p-3 rounded text-center">
          <div className="text-xl font-bold text-black">{distribution.totalHours.toFixed(1)}h</div>
          <div className="text-xs text-gray-600">Total Hours</div>
        </div>
      </div>

      {/* Top Projects */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-600 mb-3">Top Projects (This Month)</h3>
        <div className="space-y-3">
          {distribution.topProjects.map((project, index) => (
            <div key={index} className="border border-gray-200 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{project.name}</span>
                <span className="text-xs text-gray-500">{project.completionRate}% done</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>{project.count} tasks</div>
                <div>{project.hours.toFixed(1)}h total</div>
                <div>{project.avgHoursPerTask}h/task</div>
              </div>
              <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${project.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 mb-3">Top Services (This Month)</h3>
        <div className="space-y-3">
          {distribution.topServices.map((service, index) => (
            <div key={index} className="border border-gray-200 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{service.name}</span>
                <span className="text-xs text-gray-500">{service.completionRate}% done</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>{service.count} tasks</div>
                <div>{service.hours.toFixed(1)}h total</div>
                <div>{service.avgHoursPerTask}h/task</div>
              </div>
              <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${service.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskDistribution;