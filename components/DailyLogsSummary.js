// components/DailyLogsSummary.js
'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, 
  faClock, 
  faCheckCircle, 
  faExclamationTriangle,
  faSpinner,
  faCalendarDay
} from '@fortawesome/free-solid-svg-icons';

const DailyLogsSummary = ({ stats }) => {
  const cards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: faListCheck,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600'
    },
    {
      title: 'Active',
      value: stats.activeCount,
      icon: faSpinner,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: stats.doneCount,
      icon: faCheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: stats.overdueCount,
      icon: faExclamationTriangle,
      bgColor: stats.overdueCount > 0 ? 'bg-red-100' : 'bg-gray-100',
      iconColor: stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-600'
    },
    {
      title: 'Today',
      value: `${stats.todayHours.toFixed(1)}h`,
      icon: faCalendarDay,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'This Week',
      value: `${stats.weekHours.toFixed(1)}h`,
      icon: faClock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-lg p-4 border border-gray-200`}>
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={card.icon} className={`${card.iconColor} text-lg`} />
          </div>
          <div className="text-2xl font-bold text-black">{card.value}</div>
          <div className="text-xs text-gray-600 mt-1">{card.title}</div>
        </div>
      ))}
    </div>
  );
};

export default DailyLogsSummary;