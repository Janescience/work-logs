// components/DailyLogsSummary.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faFire, 
  faSpinner,
  faCalendarWeek,
  faCalendarAlt,
  faTrendUp,
  faTrendDown,
  faEquals
} from '@fortawesome/free-solid-svg-icons';

const DailyLogsSummary = ({ stats, allJiras }) => {
  const enhancedStats = useMemo(() => {
    // Default stats if not provided
    const defaultStats = {
      totalTasks: 0,
      activeCount: 0, 
      doneCount: 0,
      monthHours: 0,
      todayHours: 0,
      weekHours: 0
    };
    
    const currentStats = stats || defaultStats;
    
    if (!allJiras) return currentStats;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Calculate additional metrics
    let todayTasks = 0;
    let yesterdayHours = 0;
    let avgSessionTime = 0;
    let totalSessions = 0;
    let streakDays = 0;
    let loggedDatesSet = new Set();

    allJiras.forEach(jira => {
      // Count today's tasks
      if (jira.actualStatus === 'In Progress') {
        const hasLogToday = jira.dailyLogs?.some(log => {
          const logDate = new Date(log.logDate);
          return logDate.toDateString() === today.toDateString() && parseFloat(log.timeSpent || 0) > 0;
        });
        if (hasLogToday) todayTasks++;
      }

      // Process daily logs for additional metrics
      jira.dailyLogs?.forEach(log => {
        const logDate = new Date(log.logDate);
        const hours = parseFloat(log.timeSpent || 0);
        
        if (hours > 0) {
          loggedDatesSet.add(logDate.toDateString());
          totalSessions++;
          avgSessionTime += hours;
          
          // Yesterday's hours
          if (logDate.toDateString() === yesterday.toDateString()) {
            yesterdayHours += hours;
          }
        }
      });
    });

    // Calculate average session time
    avgSessionTime = totalSessions > 0 ? avgSessionTime / totalSessions : 0;

    // Calculate streak (simplified)
    const sortedDates = Array.from(loggedDatesSet)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b - a);
    
    streakDays = 0;
    let currentDate = new Date(today);
    for (let date of sortedDates) {
      if (date.toDateString() === currentDate.toDateString()) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate trends
    const todayVsYesterday = yesterdayHours > 0 
      ? ((currentStats.todayHours - yesterdayHours) / yesterdayHours) * 100 
      : currentStats.todayHours > 0 ? 100 : 0;

    return {
      ...currentStats,
      todayTasks,
      yesterdayHours,
      avgSessionTime,
      streakDays,
      todayVsYesterday,
      efficiency: currentStats.todayHours > 0 ? todayTasks / currentStats.todayHours : 0
    };
  }, [stats, allJiras]);

  const getTrendIcon = (change) => {
    if (change > 5) return { icon: faTrendUp, color: 'text-green-600' };
    if (change < -5) return { icon: faTrendDown, color: 'text-red-600' };
    return { icon: faEquals, color: 'text-gray-600' };
  };

  const statItems = [
    { 
      label: 'TASKS TODAY', 
      value: enhancedStats.todayTasks || 0,
      subtext: 'active',
      icon: faSpinner,
      color: 'text-blue-600'
    },
    { 
      label: 'HOURS TODAY', 
      value: `${(enhancedStats.todayHours || 0).toFixed(1)}h`,
      subtext: Math.abs(enhancedStats.todayVsYesterday || 0).toFixed(0) + '% vs yesterday',
      icon: faClock,
      color: 'text-purple-600',
      trend: getTrendIcon(enhancedStats.todayVsYesterday || 0)
    },
    { 
      label: 'THIS WEEK', 
      value: `${(enhancedStats.weekHours || 0).toFixed(1)}h`,
      subtext: 'logged',
      icon: faCalendarWeek,
      color: 'text-indigo-600'
    },
    { 
      label: 'THIS MONTH', 
      value: `${(enhancedStats.monthHours || 0).toFixed(1)}h`,
      subtext: 'total',
      icon: faCalendarAlt,
      color: 'text-gray-700'
    },
    { 
      label: 'EFFICIENCY', 
      value: (enhancedStats.efficiency || 0).toFixed(1),
      subtext: 'tasks/hour',
      icon: faTrendUp,
      color: 'text-green-600'
    },
    { 
      label: 'STREAK', 
      value: `${enhancedStats.streakDays || 0}`,
      subtext: 'days logged',
      icon: faFire,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-4 bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-center mb-2">
              <FontAwesomeIcon icon={item.icon} className={`text-lg ${item.color}`} />
              {item.trend && (
                <FontAwesomeIcon 
                  icon={item.trend.icon} 
                  className={`text-xs ml-1 ${item.trend.color}`} 
                />
              )}
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

export default DailyLogsSummary;