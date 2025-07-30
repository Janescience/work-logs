// components/TimeTrackingCharts.js
'use client';
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarWeek, faCalendarDay } from '@fortawesome/free-solid-svg-icons';

const TimeTrackingCharts = ({ allJiras }) => {
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'

  const chartData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    if (viewMode === 'week') {
      // Weekly data (last 4 weeks)
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        let totalHours = 0;
        allJiras.forEach(jira => {
          jira.dailyLogs?.forEach(log => {
            const logDate = new Date(log.logDate);
            if (logDate >= weekStart && logDate <= weekEnd) {
              totalHours += parseFloat(log.timeSpent || 0);
            }
          });
        });

        weeklyData.push({
          label: `Week ${4 - i}`,
          date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: totalHours,
          isCurrentWeek: i === 0
        });
      }
      return weeklyData;
    } else {
      // Daily data (last 7 days)
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - i);
        
        let totalHours = 0;
        allJiras.forEach(jira => {
          jira.dailyLogs?.forEach(log => {
            const logDate = new Date(log.logDate);
            if (logDate.toDateString() === targetDate.toDateString()) {
              totalHours += parseFloat(log.timeSpent || 0);
            }
          });
        });

        dailyData.push({
          label: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
          date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: totalHours,
          isToday: targetDate.toDateString() === today.toDateString()
        });
      }
      return dailyData;
    }
  }, [allJiras, viewMode]);

  const maxHours = Math.max(...chartData.map(d => d.hours), 1);

  return (
    <div className="bg-white p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-light text-black flex items-center">
          <FontAwesomeIcon icon={faChartLine} className="mr-2 text-gray-600 text-base" />
          Time Tracking
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-xs border transition-colors ${
              viewMode === 'day'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarDay} className="mr-1" />
            Daily
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-xs border transition-colors ${
              viewMode === 'week'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarWeek} className="mr-1" />
            Weekly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-xs text-gray-600 text-right">
              {item.label}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 h-6 relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    item.isCurrentWeek || item.isToday
                      ? 'bg-black'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${(item.hours / maxHours) * 100}%` }}
                />
              </div>
              <div className="w-12 text-xs text-gray-700 font-medium">
                {item.hours.toFixed(1)}h
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-black">
              {chartData.reduce((sum, item) => sum + item.hours, 0).toFixed(1)}h
            </div>
            <div className="text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-black">
              {(chartData.reduce((sum, item) => sum + item.hours, 0) / chartData.length).toFixed(1)}h
            </div>
            <div className="text-gray-600">Average</div>
          </div>
          <div>
            <div className="text-lg font-bold text-black">
              {maxHours.toFixed(1)}h
            </div>
            <div className="text-gray-600">Peak</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingCharts;