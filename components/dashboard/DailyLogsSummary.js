// components/DailyLogsSummary.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faSpinner,
  faCalendarWeek,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const DailyLogsSummary = ({ stats }) => {
  const enhancedStats = useMemo(() => {
    // Default stats if not provided
    const defaultStats = {
      totalTasks: 0,
      activeCount: 0, 
      doneCount: 0,
      todayHours: 0,
      weekHours: 0,
      monthHours: 0
    };
    
    return stats || defaultStats;
  }, [stats]);


  const statItems = [
    { 
      label: 'TOTAL TASKS', 
      value: enhancedStats.totalTasks || 0,
      subtext: 'all tasks',
      icon: faSpinner,
      color: 'text-blue-600'
    },
    { 
      label: 'ACTIVE TASKS', 
      value: enhancedStats.activeCount || 0,
      subtext: 'in progress',
      icon: faClock,
      color: 'text-orange-600'
    },
    { 
      label: 'COMPLETED', 
      value: enhancedStats.doneCount || 0,
      subtext: 'finished',
      icon: faCalendarWeek,
      color: 'text-green-600'
    },
    { 
      label: 'TODAY HOURS', 
      value: `${(enhancedStats.todayHours || 0).toFixed(1)}h`,
      subtext: 'logged today',
      icon: faClock,
      color: 'text-blue-500'
    },
    { 
      label: 'THIS WEEK', 
      value: `${(enhancedStats.weekHours || 0).toFixed(1)}h`,
      subtext: 'logged this week',
      icon: faCalendarWeek,
      color: 'text-indigo-600'
    },
    { 
      label: 'THIS MONTH', 
      value: `${(enhancedStats.monthHours || 0).toFixed(1)}h`,
      subtext: 'total hours',
      icon: faCalendarAlt,
      color: 'text-purple-600'
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

export default DailyLogsSummary;