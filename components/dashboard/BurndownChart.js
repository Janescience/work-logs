// components/BurndownChart.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartArea, faTrendUp, faTrendDown } from '@fortawesome/free-solid-svg-icons';

const BurndownChart = ({ allJiras }) => {
  const burndownData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current month data
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate total tasks for current month
    const monthlyTasks = allJiras.filter(jira => {
      const createdDate = new Date(jira.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    });
    
    const totalTasks = monthlyTasks.length;
    
    if (totalTasks === 0) {
      return { chartData: [], totalTasks: 0, completedTasks: 0, remainingTasks: 0, projectedCompletion: null };
    }
    
    // Generate daily data points
    const chartData = [];
    let completedTasks = 0;
    const daysInMonth = lastDay.getDate();
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d > today) break;
      
      // Count tasks completed by this date
      const completedByDate = monthlyTasks.filter(jira => {
        if (jira.actualStatus !== 'Done' || !jira.updatedAt) return false;
        const completedDate = new Date(jira.updatedAt);
        return completedDate <= d;
      }).length;
      
      const remainingTasks = totalTasks - completedByDate;
      const dayOfMonth = d.getDate();
      
      // Calculate ideal remaining tasks - linear decrease from totalTasks to 0
      const idealRemaining = Math.max(0, totalTasks - ((totalTasks / daysInMonth) * dayOfMonth));
      
      chartData.push({
        day: dayOfMonth,
        date: new Date(d),
        completed: completedByDate,
        remaining: remainingTasks,
        ideal: idealRemaining,
        isToday: d.toDateString() === today.toDateString()
      });
      
      if (d.toDateString() === today.toDateString()) {
        completedTasks = completedByDate;
      }
    }
    
    // Calculate projection
    let projectedCompletion = null;
    if (chartData.length >= 7) { // Need at least a week of data
      const recentData = chartData.slice(-7);
      const completionRate = (recentData[recentData.length - 1].completed - recentData[0].completed) / 7;
      
      if (completionRate > 0) {
        const remainingTasks = totalTasks - completedTasks;
        const daysNeeded = Math.ceil(remainingTasks / completionRate);
        projectedCompletion = daysNeeded;
      }
    }
    
    return {
      chartData,
      totalTasks,
      completedTasks,
      remainingTasks: totalTasks - completedTasks,
      projectedCompletion,
      daysInMonth,
      currentDay: today.getDate()
    };
  }, [allJiras]);
  
  const { chartData, totalTasks, completedTasks, remainingTasks, projectedCompletion, daysInMonth, currentDay } = burndownData;
  
  if (totalTasks === 0) {
    return (
      <div className="bg-white p-6 border border-gray-300">
        <h2 className="text-xl font-light text-black mb-4 flex items-center">
          <FontAwesomeIcon icon={faChartArea} className="mr-2 text-gray-600 text-base" />
          Burndown Chart
        </h2>
        <p className="text-gray-500 text-center py-4">No tasks created this month</p>
      </div>
    );
  }
  
  const maxValue = Math.max(totalTasks, ...chartData.map(d => Math.max(d.remaining, d.ideal)));
  const isAhead = chartData.length > 0 && chartData[chartData.length - 1].remaining < chartData[chartData.length - 1].ideal;
  
  return (
    <div className="bg-white p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-light text-black flex items-center">
          <FontAwesomeIcon icon={faChartArea} className="mr-2 text-gray-600 text-base" />
          Burndown Chart
        </h2>
        <div className="text-xs text-gray-600">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* Explanation */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
        <div className="text-xs text-gray-700 leading-relaxed">
          <strong>What is this?</strong> Shows tasks remaining vs. ideal completion pace.
          <br />
          <strong>Goal:</strong> Actual line should follow or stay below ideal line.
        </div>
      </div>

      {/* Chart Container with proper spacing */}
      <div className="mb-4 ml-12 mr-2">
        {/* Y-axis label */}
        <div className="text-xs text-gray-600 mb-2 text-center">
          Tasks Remaining
        </div>
        
        <div className="relative">
          {/* Y-axis values - positioned outside chart area */}
          <div className="absolute -left-12 top-0 h-40 flex flex-col justify-between text-xs text-gray-600 items-end">
            <span>{maxValue}</span>
            <span>{Math.round(maxValue * 0.75)}</span>
            <span>{Math.round(maxValue * 0.5)}</span>
            <span>{Math.round(maxValue * 0.25)}</span>
            <span>0</span>
          </div>
          
          <div className="flex items-end gap-1 h-40 border-b-2 border-l-2 border-gray-400 relative">
            {chartData.map((point, index) => {
              // Calculate heights properly
              const actualHeight = maxValue > 0 ? (point.remaining / maxValue) * 100 : 0;
              const idealHeight = maxValue > 0 ? (point.ideal / maxValue) * 100 : 0;
              
              // Determine color based on performance vs ideal
              let barColor = 'bg-gray-400'; // default
              if (point.isToday) {
                barColor = 'bg-black';
              } else {
                // On track if remaining tasks <= ideal (with small tolerance)
                const isOnTrack = point.remaining <= (point.ideal + 0.1);
                barColor = isOnTrack ? 'bg-green-500' : 'bg-red-500';
              }
              
              return (
                <div key={index} className="flex-1 flex flex-col justify-end h-full relative group">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-2 whitespace-nowrap z-30 pointer-events-none rounded shadow-lg">
                    Day {point.day}: {point.remaining} tasks left
                    <br />
                    Ideal: {point.ideal.toFixed(1)} tasks
                    <br />
                    Status: {point.remaining <= (point.ideal + 0.1) ? 'On Track' : 'Behind'}
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>
                  
                  {/* Background area for full height reference */}
                  <div className="w-full h-full bg-gray-50 absolute bottom-0" />
                  
                  {/* Actual bar */}
                  <div
                    className={`w-full transition-all duration-300 relative z-10 ${barColor}`}
                    style={{ height: `${Math.max(actualHeight, 2)}%` }}
                  />
                  
                  {/* Ideal line point */}
                  {idealHeight > 0 && (
                    <div
                      className="w-full border-t-2 border-red-400 border-dashed absolute z-20 pointer-events-none"
                      style={{ bottom: `${idealHeight}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex gap-1 mt-1">
          {chartData.map((point, index) => (
            <div key={index} className="flex-1 text-center">
              {(index === 0 || index === chartData.length - 1 || point.day % 5 === 0 || point.isToday) && (
                <div className={`text-xs ${point.isToday ? 'font-bold text-black' : 'text-gray-600'}`}>
                  {point.isToday ? 'Today' : point.day}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* X-axis label */}
        <div className="text-xs text-gray-600 mt-2 text-center">
          Days of Month
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 border-t-2 border-red-400 border-dashed" />
          <span className="text-gray-600">Ideal Pace</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-black" />
          <span className="text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500" />
          <span className="text-gray-600">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500" />
          <span className="text-gray-600">Behind</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs border-t border-gray-200 pt-3">
        <div>
          <div className="text-lg font-bold text-black">{completedTasks}</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div>
          <div className="text-lg font-bold text-black">{remainingTasks}</div>
          <div className="text-gray-600">Remaining</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
            <FontAwesomeIcon icon={isAhead ? faTrendUp : faTrendDown} className="mr-1" />
            {isAhead ? 'Ahead' : 'Behind'}
          </div>
          <div className="text-gray-600">Schedule</div>
        </div>
      </div>

      {/* Projection */}
      {projectedCompletion && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-600">
            Projected completion: {projectedCompletion > daysInMonth - currentDay ? 'Next month' : `${projectedCompletion} days`}
          </div>
        </div>
      )}
    </div>
  );
};

export default BurndownChart;