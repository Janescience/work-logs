// components/DashboardStats.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, 
  faClock, 
  faFire, 
  faCheckCircle,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const DashboardStats = ({ allJiras }) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let totalTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let monthlyHours = 0;
    let todayHours = 0;

    allJiras.forEach(jira => {
      totalTasks++;
      
      const status = (jira.actualStatus || '').toLowerCase();
      if (status === 'in progress') {
        inProgressTasks++;
      } else if (status === 'done') {
        completedTasks++;
      }

      // Check if overdue
      if (jira.dueDate && status !== 'done') {
        const dueDate = new Date(jira.dueDate);
        if (dueDate < today) {
          overdueTasks++;
        }
      }

      // Calculate hours
      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        const hours = parseFloat(log.timeSpent || 0);
        
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
          monthlyHours += hours;
        }
        
        if (logDate.toDateString() === today.toDateString()) {
          todayHours += hours;
        }
      });
    });

    return {
      totalTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      monthlyHours,
      todayHours,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [allJiras]);

  const statItems = [
    { label: 'TOTAL', value: stats.totalTasks },
    { label: 'ACTIVE', value: stats.inProgressTasks },
    { label: 'DONE', value: stats.completedTasks },
    { label: 'OVERDUE', value: stats.overdueTasks, alert: stats.overdueTasks > 0 },
    { label: 'TODAY', value: `${stats.todayHours.toFixed(1)}H` },
    { label: 'MONTH', value: `${stats.monthlyHours.toFixed(1)}H` }
  ];

  return (
    <div className="p-4">
      <div className="grid grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className={`text-lg font-light ${item.alert ? 'text-red-600' : 'text-black'}`}>
              {item.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;