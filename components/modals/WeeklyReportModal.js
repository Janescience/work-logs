'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCalendarWeek,
  faChartLine,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import CompactTaskListView from '@/components/jira/CompactTaskListView';

const WeeklyReportModal = ({ isOpen, onClose, allJiras = [] }) => {
  const weeklyData = useMemo(() => {
    if (!isOpen || !allJiras.length) return {
      dailyData: [],
      totalHours: 0,
      totalTasks: 0,
      dateRange: { start: null, end: null }
    };

    const today = new Date();
    const weeklyData = [];
    let totalHours = 0;
    let totalTasks = 0;

    // Create array of 7 working days (excluding weekends): today down to 7 working days ago
    let daysAdded = 0;
    let daysToCheck = 0;

    while (daysAdded < 7) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysToCheck);

      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        daysToCheck++;
        continue;
      }

      // Filter JIRAs that have logs from this specific day
      const dayJiras = allJiras.filter(jira => {
        if (!jira.dailyLogs || jira.dailyLogs.length === 0) return false;

        return jira.dailyLogs.some(log => {
          const logDate = new Date(log.logDate);
          return logDate.toDateString() === targetDate.toDateString();
        });
      }).map(jira => {
        // Only include logs from that specific day
        const relevantLogs = jira.dailyLogs.filter(log => {
          const logDate = new Date(log.logDate);
          return logDate.toDateString() === targetDate.toDateString();
        });

        return {
          ...jira,
          dailyLogs: relevantLogs
        };
      });

      // Calculate daily hours
      const dayHours = dayJiras.reduce((total, jira) => {
        return total + jira.dailyLogs.reduce((jiraTotal, log) => jiraTotal + (log.timeSpent || 0), 0);
      }, 0);

      totalHours += dayHours;
      totalTasks += dayJiras.length;

      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      weeklyData.push({
        date: new Date(targetDate),
        weekday: weekdayNames[targetDate.getDay()],
        jiras: dayJiras,
        hours: dayHours,
        tasksCount: dayJiras.length,
        isToday: daysAdded === 0,
        isLastWeek: daysAdded === 6
      });

      daysAdded++;
      daysToCheck++;
    }

    return {
      dailyData: weeklyData,
      totalHours,
      totalTasks,
      dateRange: {
        start: weeklyData[6]?.date,
        end: weeklyData[0]?.date
      }
    };
  }, [isOpen, allJiras]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-4 bottom-4 lg:inset-x-auto lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:w-full lg:max-w-6xl bg-white border border-gray-300 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-black flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarWeek} className="text-gray-600 text-base" />
                Weekly Report - 7 Days Overview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {weeklyData.dateRange.start?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })} - {weeklyData.dateRange.end?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} ({weeklyData.totalHours.toFixed(1)}h total)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Past 7 days</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>
          </div>

          {/* Stats */}
          {weeklyData.totalTasks > 0 && (
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-600" />
                <span className="text-gray-600">
                  {weeklyData.totalTasks} tasks logged
                </span>
              </div>
              <div className="text-gray-600">
                {weeklyData.totalHours.toFixed(1)} hours total
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {weeklyData.dailyData.length > 0 ? (
            <div>
              {weeklyData.dailyData.map((dayData, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                    {/* Compact Day Header */}
                    <div className={`p-3 ${dayData.isToday ? 'bg-blue-50 border-l-4 border-l-blue-500' :
                      dayData.isLastWeek ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {dayData.weekday}
                            {dayData.isToday && <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">TODAY</span>}
                            {dayData.isLastWeek && <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">LAST WEEK</span>}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {dayData.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">{dayData.hours.toFixed(1)}h</div>
                          <div className="text-xs text-gray-500">{dayData.tasksCount} tasks</div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Day Tasks */}
                    {dayData.tasksCount > 0 ? (
                      <div className="px-3 pb-3">
                        <CompactTaskListView
                          jiras={dayData.jiras}
                          externalStatuses={{}}
                        />
                      </div>
                    ) : (
                      <div className="px-3 pb-3 text-center text-gray-400 text-xs py-4">
                        No logs recorded
                      </div>
                    )}
                  </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <FontAwesomeIcon icon={faCalendarWeek} className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-600 mb-2">No logs found</p>
                <p className="text-sm text-gray-500">
                  No work was logged in the past 7 days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {weeklyData.totalTasks > 0 && (
          <div className="bg-gray-50 p-3 border-t border-gray-200 flex-shrink-0">
            <div className="text-xs text-gray-600 text-center">
              {weeklyData.dateRange.start?.toLocaleDateString('en-GB')} - {weeklyData.dateRange.end?.toLocaleDateString('en-GB')} •
              {weeklyData.totalTasks} total tasks • {weeklyData.totalHours.toFixed(1)} total hours
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReportModal;