'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp,
  faArrowDown,
  faEquals
} from '@fortawesome/free-solid-svg-icons';

const BurndownChart = ({ teamData }) => {
  const chartData = useMemo(() => {
    if (!teamData || Object.keys(teamData).length === 0) {
      return null;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate working days in current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let workingDays = [];
    let workingDaysPassed = 0;
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        workingDays.push(new Date(d));
        if (d <= today) {
          workingDaysPassed++;
        }
      }
    }

    const todayIndex = workingDaysPassed - 1;

    // Calculate task metrics
    let totalTasks = 0;
    let completedTasks = 0;
    let burndownData = [];
    let idealBurndownData = [];

    Object.values(teamData).forEach(({ memberInfo, jiras }) => {
      if (!memberInfo || !jiras) return;

      jiras.forEach(jira => {
        const isActive = !['done', 'closed', 'cancelled', 'deployed'].some(s => 
          (jira.actualStatus || '').toLowerCase().includes(s)
        );

        if (isActive || jira.actualStatus?.toLowerCase() === 'done') {
          totalTasks++;
          if (jira.actualStatus?.toLowerCase() === 'done') {
            completedTasks++;
          }
        }
      });
    });

    // Generate burndown data for each working day
    workingDays.forEach((day, index) => {
      const isPast = day <= today;
      
      // Ideal burndown: linear decrease
      const idealRemaining = totalTasks * (1 - (index + 1) / workingDays.length);
      idealBurndownData.push({
        date: day,
        remaining: Math.max(0, idealRemaining),
        isPast
      });

      // Actual burndown (simplified - assuming steady completion)
      let actualRemaining = totalTasks;
      if (isPast && todayIndex >= 0) {
        const progressRatio = Math.min((index + 1) / (todayIndex + 1), 1);
        actualRemaining = totalTasks - (completedTasks * progressRatio);
      }
      
      burndownData.push({
        date: day,
        remaining: Math.max(0, actualRemaining),
        isPast
      });
    });

    const currentRemaining = totalTasks - completedTasks;
    const idealRemainingToday = todayIndex >= 0 ? 
      totalTasks * (1 - (todayIndex + 1) / workingDays.length) : totalTasks;
    
    const variance = currentRemaining - idealRemainingToday;
    const completionRate = totalTasks > 0 ? ((totalTasks - currentRemaining) / totalTasks) * 100 : 0;
    const expectedCompletionRate = todayIndex >= 0 ? ((todayIndex + 1) / workingDays.length) * 100 : 0;

    return {
      burndownData,
      idealBurndownData,
      totalTasks,
      currentRemaining,
      variance,
      completionRate,
      expectedCompletionRate,
      workingDays: workingDays.length,
      currentDay: workingDaysPassed
    };
  }, [teamData]);

  if (!chartData) return null;

  const getVarianceColor = (variance) => {
    if (variance > 5) return 'text-black';
    if (variance < -5) return 'text-gray-600';
    return 'text-gray-500';
  };

  const getVarianceIcon = (variance) => {
    if (variance > 5) return faArrowUp;
    if (variance < -5) return faArrowDown;
    return faEquals;
  };

  const getTrendStatus = (variance) => {
    if (variance > 5) return 'Behind Schedule';
    if (variance < -5) return 'Ahead of Schedule';
    return 'On Track';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-light text-black">{chartData.totalTasks}</div>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-light text-black">{chartData.currentRemaining}</div>
          <p className="text-xs text-gray-600">Remaining</p>
        </div>
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-light text-black">{chartData.completionRate.toFixed(0)}%</div>
          <p className="text-xs text-gray-600">Done</p>
        </div>
        <div className="text-center p-2 border border-gray-200">
          <div className={`text-lg font-light ${getVarianceColor(chartData.variance)}`}>
            {chartData.variance > 0 ? '+' : ''}{chartData.variance.toFixed(0)}
          </div>
          <p className="text-xs text-gray-600">Variance</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className={`flex items-center gap-1 px-2 py-1 ${
          chartData.variance > 5 ? 'bg-black text-white' :
          chartData.variance < -5 ? 'bg-gray-600 text-white' :
          'bg-gray-300 text-black'
        }`}>
          <FontAwesomeIcon icon={getVarianceIcon(chartData.variance)} className="text-xs" />
          {getTrendStatus(chartData.variance)}
        </div>
        <span>Day {chartData.currentDay} of {chartData.workingDays}</span>
      </div>
    </div>
  );
};

export default BurndownChart;