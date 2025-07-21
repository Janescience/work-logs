// components/DueDateAlert.js
'use client';
import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';

const DueDateAlert = ({ allJiras }) => {
  const [dueSoonJiras, setDueSoonJiras] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const alerts = allJiras.filter(jira => {
      if (jira.dueDate && jira.actualStatus?.toLowerCase() === 'in progress') {
        const dueDate = new Date(jira.dueDate);
        return dueDate >= today && dueDate <= threeDaysLater;
      }
      return false;
    });

    alerts.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const alertsWithDaysRemaining = alerts.map(jira => {
      const dueDate = new Date(jira.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const timeLeft = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.round(timeLeft / (1000 * 3600 * 24));
      return { ...jira, daysRemaining };
    });

    setDueSoonJiras(alertsWithDaysRemaining);
  }, [allJiras]);

  if (dueSoonJiras.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 bg-white p-4 border border-gray-300">
      <h2 className="text-xl font-bold mb-2 text-black flex items-center font-light">
        Deadline Alert
      </h2>
      <ul className="space-y-2">
        {dueSoonJiras.map(jira => (
          <li key={jira._id?.$oid || jira._id} className="text-black p-3 border border-gray-300 bg-gray-50 flex items-center space-x-2">
            <span className={`px-3 py-1 font-bold text-sm border border-black ${
              jira.daysRemaining === 0 
                ? 'bg-black text-white' 
                : 'bg-white text-black'
            }`}>
              {jira.daysRemaining > 0 ? `${jira.daysRemaining} DAY(S)` : 'TODAY!'}
            </span>
            <span className="px-2 py-1 bg-gray-200 text-black font-mono text-sm border border-black">
              {formatDate(jira.dueDate)}
            </span>
            <span className="px-2 py-1 bg-black text-white font-bold text-sm">
              {jira.jiraNumber}
            </span>
            <span className="flex-grow text-black">{jira.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DueDateAlert;