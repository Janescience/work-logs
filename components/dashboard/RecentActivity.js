// components/RecentActivity.js
'use client';
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlus, faEdit, faCheckCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '@/utils/dateUtils';

const RecentActivity = ({ allJiras }) => {
  const [showAll, setShowAll] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'logs', 'completed', 'created'

  const { allActivities, activities } = useMemo(() => {
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

    // Sort by date descending
    const sortedActivities = recentActivities.sort((a, b) => b.date - a.date);
    
    // Filter by type if needed
    const filteredActivities = activityFilter === 'all' 
      ? sortedActivities
      : sortedActivities.filter(activity => {
          if (activityFilter === 'logs') return activity.type === 'log';
          if (activityFilter === 'completed') return activity.type === 'completed';
          if (activityFilter === 'created') return activity.type === 'created';
          return true;
        });
    
    // Return both all activities (for counts) and filtered activities
    const displayActivities = showAll ? filteredActivities : filteredActivities.slice(0, 10);
    return { allActivities: sortedActivities, activities: displayActivities };
  }, [allJiras, showAll, activityFilter]);

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    // Handle future dates
    if (diffInMs < 0) {
      const futureMins = Math.floor(Math.abs(diffInMs) / 60000);
      const futureHours = Math.floor(Math.abs(diffInMs) / 3600000);
      const futureDays = Math.floor(Math.abs(diffInMs) / 86400000);
      
      if (futureMins < 60) return `in ${futureMins}m`;
      if (futureHours < 24) return `in ${futureHours}h`;
      if (futureDays < 7) return `in ${futureDays}d`;
      return formatDate(date);
    }

    // Handle past dates
    if (diffInMins < 1) return 'just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(date);
  };

  const activityTypes = {
    all: { label: 'All', count: allActivities.length },
    logs: { label: 'Logs', count: allActivities.filter(a => a.type === 'log').length },
    completed: { label: 'Completed', count: allActivities.filter(a => a.type === 'completed').length },
    created: { label: 'Created', count: allActivities.filter(a => a.type === 'created').length }
  };

  return (
    <div className="bg-white p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-black flex items-center">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-600 text-base" />
          Recent Activity
        </h2>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1"
        >
          <FontAwesomeIcon icon={showAll ? faEyeSlash : faEye} className="text-xs" />
          {showAll ? 'Show less' : 'Show all'}
        </button>
      </div>

      {/* Activity Filter Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {Object.entries(activityTypes).map(([key, { label, count }]) => (
          <button
            key={key}
            onClick={() => setActivityFilter(key)}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              activityFilter === key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className={`space-y-3 ${showAll ? 'max-h-none' : 'max-h-96'} overflow-y-auto`}>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No {activityFilter === 'all' ? '' : activityFilter} activity found
          </p>
        ) : (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className={`mt-1 ${activity.color}`}>
                <FontAwesomeIcon icon={activity.icon} className="text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {activity.jiraNumber}
                  </span>
                  {activity.type === 'log' && activity.hours && (
                    <span className="text-xs font-medium text-white bg-black px-2 py-0.5 rounded">
                      {activity.hours}h
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${
                    activity.type === 'log' ? 'bg-blue-500' :
                    activity.type === 'completed' ? 'bg-green-500' : 'bg-purple-500'
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <div className="text-sm text-gray-800">
                  {activity.description}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{getRelativeTime(activity.date)}</span>
                  {activity.jiraDescription && (
                    <span className="truncate max-w-48 opacity-75">
                      • {activity.jiraDescription}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!showAll && activities.length >= 10 && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-400">
            Showing 10 of {activities.length} activities
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;