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

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: faListCheck,
      color: 'bg-gray-100',
      textColor: 'text-gray-800'
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks,
      icon: faSpinner,
      color: 'bg-gray-100',
      textColor: 'text-blue-800'
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: faCheckCircle,
      color: 'bg-gray-100',
      textColor: 'text-green-800'
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      icon: faExclamationTriangle,
      color: stats.overdueTasks > 0 ? 'bg-gray-100' : 'bg-gray-100',
      textColor: stats.overdueTasks > 0 ? 'text-red-800' : 'text-gray-800'
    },
    {
      title: 'Today\'s Hours',
      value: stats.todayHours.toFixed(1),
      icon: faClock,
      color: 'bg-gray-100',
      textColor: 'text-purple-800',
      suffix: 'hrs'
    },
    {
      title: 'Monthly Hours',
      value: stats.monthlyHours.toFixed(1),
      icon: faFire,
      color: 'bg-gray-100',
      textColor: 'text-orange-800',
      suffix: 'hrs'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.color} p-4 border border-gray-200 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon 
              icon={stat.icon} 
              className={`${stat.textColor} text-xl`}
            />
          </div>
          <div className={`text-2xl font-bold ${stat.textColor}`}>
            {stat.value}{stat.suffix && <span className="text-sm font-normal ml-1">{stat.suffix}</span>}
          </div>
          <div className="text-xs text-gray-600 mt-1">{stat.title}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;