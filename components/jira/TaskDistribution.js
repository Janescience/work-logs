// components/TaskDistribution.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPieChart } from '@fortawesome/free-solid-svg-icons';

const TaskDistribution = ({ allJiras }) => {
  const distribution = useMemo(() => {
    const projectCount = {};
    const serviceCount = {};
    const statusCount = {
      'In Progress': 0,
      'Done': 0,
      'Cancel': 0
    };

    allJiras.forEach(jira => {
      // Count by project
      if (jira.projectName) {
        projectCount[jira.projectName] = (projectCount[jira.projectName] || 0) + 1;
      }

      // Count by service
      if (jira.serviceName) {
        serviceCount[jira.serviceName] = (serviceCount[jira.serviceName] || 0) + 1;
      }

      // Count by status
      const status = jira.actualStatus || 'Unknown';
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      }
    });

    // Get top 5 projects
    const topProjects = Object.entries(projectCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Get top 5 services
    const topServices = Object.entries(serviceCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const totalTasks = allJiras.length;

    return { topProjects, topServices, statusCount, totalTasks };
  }, [allJiras]);

  const statusColors = {
    'In Progress': 'bg-black',
    'Done': 'bg-black',
    'Cancel': 'bg-red-400'
  };

  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faPieChart} className="mr-2" />
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

      {/* Top Projects */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-600 mb-3">Top Projects</h3>
        <div className="space-y-2">
          {distribution.topProjects.map((project, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 truncate flex-1 mr-2">{project.name}</span>
              <span className="font-medium text-black">{project.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 mb-3">Top Services</h3>
        <div className="space-y-2">
          {distribution.topServices.map((service, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 truncate flex-1 mr-2">{service.name}</span>
              <span className="font-medium text-black">{service.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskDistribution;