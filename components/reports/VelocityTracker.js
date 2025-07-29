'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp, 
  faArrowDown,
  faEquals
} from '@fortawesome/free-solid-svg-icons';

const VelocityTracker = ({ teamData }) => {
  const velocityData = useMemo(() => {
    if (!teamData || Object.keys(teamData).length === 0) {
      return null;
    }

    const now = new Date();
    
    // Calculate current week metrics
    let totalTasks = 0;
    let completedTasks = 0;
    let totalHours = 0;
    let teamSize = Object.keys(teamData).length;

    Object.values(teamData).forEach(({ memberInfo, jiras }) => {
      if (!memberInfo || !jiras) return;

      jiras.forEach(jira => {
        totalTasks++;
        if (jira.actualStatus?.toLowerCase() === 'done') {
          completedTasks++;
        }
        
        // Calculate hours from daily logs
        if (jira.dailyLogs && Array.isArray(jira.dailyLogs)) {
          const thisWeekHours = jira.dailyLogs
            .filter(log => {
              const logDate = new Date(log.logDate);
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - now.getDay());
              return logDate >= weekStart;
            })
            .reduce((sum, log) => sum + (parseFloat(log.timeSpent) || 0), 0);
          
          totalHours += thisWeekHours;
        }
      });
    });

    const tasksPerWeek = totalTasks / teamSize;
    const hoursPerWeek = totalHours / teamSize;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      totalHours,
      teamSize,
      tasksPerWeek,
      hoursPerWeek,
      completionRate
    };
  }, [teamData]);

  if (!velocityData) return (
    <div className="text-center py-6">
      <p className="text-sm text-gray-600">No velocity data available</p>
    </div>
  );

  const getTrendIcon = (rate) => {
    if (rate >= 80) return faArrowUp;
    if (rate >= 60) return faEquals;
    return faArrowDown;
  };

  const getTrendColor = (rate) => {
    if (rate >= 80) return 'text-black';
    if (rate >= 60) return 'text-gray-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-light text-black">{velocityData.tasksPerWeek.toFixed(1)}</div>
          <p className="text-xs text-gray-600">Tasks/Person</p>
        </div>
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-light text-black">{velocityData.hoursPerWeek.toFixed(1)}</div>
          <p className="text-xs text-gray-600">Hours/Person</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className={`flex items-center gap-1 px-2 py-1 ${
          velocityData.completionRate >= 80 ? 'bg-black text-white' :
          velocityData.completionRate >= 60 ? 'bg-gray-600 text-white' :
          'bg-gray-300 text-black'
        }`}>
          <FontAwesomeIcon icon={getTrendIcon(velocityData.completionRate)} className="text-xs" />
          {velocityData.completionRate.toFixed(0)}% Complete
        </div>
        <span>{velocityData.teamSize} members</span>
      </div>
    </div>
  );
};

export default VelocityTracker;