// components/RecentActivity.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlus, faEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '@/utils/dateUtils';

const RecentActivity = ({ allJiras }) => {
  const activities = useMemo(() => {
    const recentActivities = [];
    
    // Get recent logs
    allJiras.forEach(jira => {
      jira.dailyLogs.forEach(log => {
        recentActivities.push({
          type: 'log',
          date: new Date(log.logDate),
          jiraNumber: jira.jiraNumber,
          jiraDescription: jira.description,
          description: log.taskDescription,
          hours: log.timeSpent,
          icon: faClock,
          color: 'text-blue-600'
        });
      });

      // Track status changes to Done
      if (jira.actualStatus === 'Done' && jira.updatedAt) {
        recentActivities.push({
          type: 'completed',
          date: new Date(jira.updatedAt),
          jiraNumber: jira.jiraNumber,
          jiraDescription: jira.description,
          description: 'Task completed',
          icon: faCheckCircle,
          color: 'text-green-600'
        });
      }

      // Track new tasks (created within last 7 days)
      const createdDate = new Date(jira.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (createdDate > sevenDaysAgo) {
        recentActivities.push({
          type: 'created',
          date: createdDate,
          jiraNumber: jira.jiraNumber,
          jiraDescription: jira.description,
          description: 'New task created',
          icon: faPlus,
          color: 'text-purple-600'
        });
      }
    });

    // Sort by date descending and take top 10
    return recentActivities
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
  }, [allJiras]);

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(date);
  };

  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faClock} className="mr-2" />
        Recent Activity
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
            >
              <div className={`mt-1 ${activity.color}`}>
                <FontAwesomeIcon icon={activity.icon} className="text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-mono text-xs text-gray-600">{activity.jiraNumber}</span>
                  {activity.type === 'log' && activity.hours && (
                    <span className="ml-2 text-xs font-medium text-black">
                      {activity.hours}h
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {activity.description}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getRelativeTime(activity.date)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length >= 10 && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <button className="text-sm text-gray-600 hover:text-black transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;