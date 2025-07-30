// components/DashboardStats.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, 
  faClock, 
  faFire, 
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const DashboardStats = ({ allJiras }) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get start of current week (Monday)
    const currentWeek = new Date(today);
    const day = currentWeek.getDay();
    const diff = currentWeek.getDate() - day + (day === 0 ? -6 : 1);
    currentWeek.setDate(diff);
    currentWeek.setHours(0, 0, 0, 0);

    let totalTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let monthlyHours = 0;
    let weeklyHours = 0;
    let todayHours = 0;
    let activeProjects = new Set();
    let loggedDays = new Set();
    let completedThisWeek = 0;

    allJiras.forEach(jira => {
      totalTasks++;
      
      const status = (jira.actualStatus || '').toLowerCase();
      if (status === 'in progress') {
        inProgressTasks++;
        if (jira.projectName) activeProjects.add(jira.projectName);
      } else if (status === 'done') {
        completedTasks++;
        
        // Check if completed this week
        if (jira.updatedAt) {
          const completedDate = new Date(jira.updatedAt);
          if (completedDate >= currentWeek) {
            completedThisWeek++;
          }
        }
      }

      // Calculate hours and track logged days
      if (Array.isArray(jira.dailyLogs)) {
        jira.dailyLogs.forEach(log => {
          const logDate = new Date(log.logDate);
          const hours = parseFloat(log.timeSpent || 0);
          
          if (hours > 0) {
            loggedDays.add(logDate.toDateString());
          }
          
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            monthlyHours += hours;
          }
          
          if (logDate >= currentWeek) {
            weeklyHours += hours;
          }
          
          if (logDate.toDateString() === today.toDateString()) {
            todayHours += hours;
          }
        });
      }
    });

    // Calculate working days in current month for average
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    let workingDays = 0;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
    }
    
    const avgHoursPerDay = workingDays > 0 ? monthlyHours / workingDays : 0;

    return {
      totalTasks,
      inProgressTasks,
      completedTasks,
      monthlyHours,
      weeklyHours,
      todayHours,
      activeProjects: activeProjects.size,
      avgHoursPerDay,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      weeklyVelocity: completedThisWeek
    };
  }, [allJiras]);

  const statItems = [
    { 
      label: 'TOTAL TASKS', 
      value: stats.totalTasks, 
      subtext: 'all time',
      icon: faListCheck,
      color: 'text-gray-700'
    },
    { 
      label: 'IN PROGRESS', 
      value: stats.inProgressTasks, 
      subtext: 'active now',
      icon: faSpinner,
      color: 'text-blue-600'
    },
    { 
      label: 'COMPLETED', 
      value: `${stats.completedTasks}`, 
      subtext: `${stats.completionRate}% rate`,
      icon: faCheckCircle,
      color: 'text-green-600'
    },
    { 
      label: 'PROJECTS', 
      value: stats.activeProjects, 
      subtext: 'active',
      icon: faFire,
      color: 'text-orange-600'
    },
    { 
      label: 'TODAY', 
      value: `${stats.todayHours.toFixed(1)}h`, 
      subtext: 'logged',
      icon: faClock,
      color: 'text-purple-600'
    },
    { 
      label: 'WEEKLY', 
      value: `${stats.weeklyHours.toFixed(1)}h`, 
      subtext: `${stats.weeklyVelocity} done`,
      icon: faFire,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-4 bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-center mb-2">
              <FontAwesomeIcon icon={item.icon} className={`text-lg ${item.color}`} />
            </div>
            <div className="text-xl font-bold text-black mb-1">
              {item.value}
            </div>
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
              {item.label}
            </div>
            <div className="text-xs text-gray-500">
              {item.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;