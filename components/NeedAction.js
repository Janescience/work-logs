'use client';
import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateUtils'; // Assuming formatDate exists and works

const NeedAction = ({ allJiras }) => {
  const [needActionItems, setNeedActionItems] = useState({ production: [], preProduction: [] });

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

    const filteredItems = { production: [], preProduction: [] };

    allJiras.forEach(jira => {
      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        logDate.setHours(0, 0, 0, 0); // Normalize logDate to beginning of the day

        const descriptionLower = log.taskDescription?.toLowerCase() || '';

        const isDeployProduction = descriptionLower.includes('deploy production') || descriptionLower.includes('deploy prod');
        const isDeployPreProduction = descriptionLower.includes('deploy pre production') || descriptionLower.includes('deploy preprod');

        // Only consider logs that are today or in the future and are deployment-related
        if (logDate >= today && (isDeployProduction || isDeployPreProduction)) {
          const timeDifference = logDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Days remaining (0 for today, 1 for tomorrow, etc.)
    
          const item = {
            logDate: logDate,
            jiraNumber: jira.jiraNumber,
            jiraDescription: jira.description,
            environment: log.envDetail,
            sql: log.sqlDetail,
            daysRemaining: daysRemaining,
          };

          if (isDeployProduction) {
            filteredItems.production.push(item);
          } else { // It's preProduction
            filteredItems.preProduction.push(item);
          }
        }
      });
    });

    // Sort items by logDate for chronological order
    filteredItems.production.sort((a, b) => a.logDate - b.logDate);
    filteredItems.preProduction.sort((a, b) => a.logDate - b.logDate);

    setNeedActionItems(filteredItems);
  }, [allJiras]); // Re-run effect when allJiras changes

  return (
    // Main container with border, white background, and padding
    <div className="mb-4 border border-gray-300 bg-white p-4 ">
      {/* Header for Deployment Schedule */}
      <h2 className="text-xl font-bold mb-4 text-black flex items-center font-light">
        Deployment Schedule
      </h2>

      {/* Production Section */}
      {needActionItems.production.length > 0 && (
        <div className="mb-4 pb-4 ">
          {/* Section Header */}
          <h3 className="text-black mb-2 bg-black text-white font-light p-2">PRODUCTION</h3>
          <ul className="space-y-1">
            {needActionItems.production.map((item, index) => (
              <li key={`production-${index}`} className="flex items-center space-x-3 text-sm py-2 border-b border-gray-300 last:border-b-0">
                {/* Date */}
                <span className="text-black font-mono whitespace-nowrap">{formatDate(item.logDate)}</span>
                {/* Jira Number (highlighted with gray background) */}
                <span className="font-bold text-black font-mono  whitespace-nowrap bg-gray-200 px-2 py-1">{item.jiraNumber}</span>
                {/* Jira Description (takes remaining space) */}
                <span className="flex-grow text-black">{item.jiraDescription}</span>
                {/* Days Remaining/Today indicator */}
                <span className={`px-2 py-1 text-xs font-bold whitespace-nowrap border border-black ${
                  item.daysRemaining === 0
                    ? 'bg-black text-white' // "TODAY" style
                    : 'bg-white text-black' // Future days style
                }`}>
                  {item.daysRemaining === 0 ? 'TODAY' : `${item.daysRemaining} DAYS`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pre Production Section */}
      {needActionItems.preProduction.length > 0 && (
        <div className="pb-4">
          {/* Section Header */}
          <h3 className=" text-black text-lg mb-2 bg-gray-200 text-black font-light p-2">PRE-PRODUCTION</h3>
          <ul className="space-y-1">
            {needActionItems.preProduction.map((item, index) => (
              <li key={`pre-production-${index}`} className="flex items-center space-x-3 text-sm py-2 border-b border-gray-300 last:border-b-0">
                {/* Date */}
                <span className="text-black font-mono whitespace-nowrap">{formatDate(item.logDate)}</span>
                {/* Jira Number (highlighted with gray background) */}
                <span className="font-bold text-black font-mono  whitespace-nowrap bg-gray-200 px-2 py-1">{item.jiraNumber}</span>
                {/* Jira Description (takes remaining space) */}
                <span className="flex-grow text-black">{item.jiraDescription}</span>
                {/* Days Remaining/Today indicator */}
                <span className={`px-2 py-1 text-xs font-bold whitespace-nowrap border border-black ${
                  item.daysRemaining === 0
                    ? 'bg-black text-white' // "TODAY" style
                    : 'bg-white text-black' // Future days style
                }`}>
                  {item.daysRemaining === 0 ? 'TODAY' : `${item.daysRemaining} DAYS`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message when no actions are needed */}
      {needActionItems.production.length === 0 && needActionItems.preProduction.length === 0 && (
        <p className="text-gray-600 text-sm p-4 text-center border border-gray-300 bg-gray-50">
          No deployment actions scheduled for today or future dates.
        </p>
      )}
    </div>
  );
};

export default NeedAction;
