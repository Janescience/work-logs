'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle,
  faCheckCircle,
  faClock,
  faUsers,
  faTasks,
  faChartLine,
  faBell
} from '@fortawesome/free-solid-svg-icons';

const PerformanceAlerts = ({ teamData }) => {
  const alerts = useMemo(() => {
    if (!teamData || Object.keys(teamData).length === 0) {
      return [];
    }

    const alertsList = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate team metrics
    let totalActiveTasks = 0;
    let totalCompletedThisMonth = 0;
    let totalLoggedHours = 0;
    let blockedTasks = [];
    let memberStats = {};
    // Removed overdueDeployments tracking
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let workingDaysPassed = 0;
    for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        workingDaysPassed++;
      }
    }

    Object.values(teamData).forEach(({ memberInfo, jiras }) => {
      if (!memberInfo || !jiras) return;

      memberStats[memberInfo.username] = {
        activeTasks: 0,
        hoursThisMonth: 0,
        blockedTasks: 0,
        lastActivity: null
      };

      jiras.forEach(jira => {
        const isActive = !['done', 'closed', 'cancelled', 'deployed'].some(s => 
          (jira.actualStatus || '').toLowerCase().includes(s)
        );

        if (isActive) {
          totalActiveTasks++;
          memberStats[memberInfo.username].activeTasks++;
          
          // Check for blocked tasks
          const statusLower = (jira.actualStatus || '').toLowerCase();
          if (statusLower.includes('block') || statusLower.includes('wait') || statusLower.includes('hold')) {
            blockedTasks.push({
              ...jira,
              assignee: memberInfo.username,
              daysSinceUpdate: Math.floor((today - new Date(jira.updatedAt || jira.createdAt)) / (1000 * 60 * 60 * 24))
            });
            memberStats[memberInfo.username].blockedTasks++;
          }
          
          // Removed overdue deployment checking as we don't track completion status
        } else {
          // Check if completed this month
          if (jira.updatedAt) {
            const updatedDate = new Date(jira.updatedAt);
            if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
              totalCompletedThisMonth++;
            }
          }
        }

        // Calculate hours and last activity
        if (jira.dailyLogs && Array.isArray(jira.dailyLogs)) {
          jira.dailyLogs.forEach(log => {
            const logDate = new Date(log.logDate);
            if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
              const hours = parseFloat(log.timeSpent || 0);
              totalLoggedHours += hours;
              memberStats[memberInfo.username].hoursThisMonth += hours;
              
              if (!memberStats[memberInfo.username].lastActivity || logDate > memberStats[memberInfo.username].lastActivity) {
                memberStats[memberInfo.username].lastActivity = logDate;
              }
            }
          });
        }
      });
    });

    // Generate alerts based on analysis
    const teamSize = Object.keys(memberStats).length;
    const expectedHours = workingDaysPassed * 8 * teamSize;
    const utilizationRate = expectedHours > 0 ? (totalLoggedHours / expectedHours) * 100 : 0;
    const avgTasksPerPerson = teamSize > 0 ? totalActiveTasks / teamSize : 0;
    
    // 1. Low utilization alert
    if (utilizationRate < 60) {
      alertsList.push({
        id: 'low_utilization',
        type: 'warning',
        icon: faClock,
        title: 'Low Team Utilization',
        message: `Team utilization is ${utilizationRate.toFixed(0)}% (expected 80%+)`,
        details: `Only ${totalLoggedHours.toFixed(0)} hours logged out of ${expectedHours} expected hours this month`,
        priority: 'high'
      });
    }
    
    // 2. High utilization alert
    if (utilizationRate > 110) {
      alertsList.push({
        id: 'high_utilization',
        type: 'info',
        icon: faExclamationTriangle,
        title: 'High Team Utilization',
        message: `Team utilization is ${utilizationRate.toFixed(0)}% (over capacity)`,
        details: 'Consider workload redistribution or additional resources',
        priority: 'medium'
      });
    }
    
    // 3. Blocked tasks alert
    if (blockedTasks.length > 0) {
      const oldBlocked = blockedTasks.filter(task => task.daysSinceUpdate > 3);
      alertsList.push({
        id: 'blocked_tasks',
        type: 'warning',
        icon: faExclamationTriangle,
        title: 'Blocked Tasks Detected',
        message: `${blockedTasks.length} blocked tasks, ${oldBlocked.length} over 3 days old`,
        details: 'Review blocked tasks and remove impediments',
        priority: 'high'
      });
    }
    
    // 4. Uneven workload distribution
    const taskCounts = Object.values(memberStats).map(stat => stat.activeTasks);
    const maxTasks = Math.max(...taskCounts);
    const minTasks = Math.min(...taskCounts);
    if (maxTasks - minTasks > 5 && teamSize > 1) {
      alertsList.push({
        id: 'uneven_workload',
        type: 'info',
        icon: faUsers,
        title: 'Uneven Workload Distribution',
        message: `Task distribution varies from ${minTasks} to ${maxTasks} per person`,
        details: 'Consider rebalancing tasks across team members',
        priority: 'medium'
      });
    }
    
    // 5. Low productivity alert
    const completionRate = workingDaysPassed > 0 ? totalCompletedThisMonth / workingDaysPassed : 0;
    if (completionRate < 1 && workingDaysPassed > 5) {
      alertsList.push({
        id: 'low_productivity',
        type: 'warning',
        icon: faChartLine,
        title: 'Low Completion Rate',
        message: `Only ${completionRate.toFixed(1)} tasks completed per day`,
        details: 'Review process efficiency and remove bottlenecks',
        priority: 'medium'
      });
    }
    
    // 6. Inactive team members
    Object.entries(memberStats).forEach(([username, stats]) => {
      if (stats.lastActivity) {
        const daysSinceActivity = Math.floor((today - stats.lastActivity) / (1000 * 60 * 60 * 24));
        if (daysSinceActivity > 5) {
          alertsList.push({
            id: `inactive_${username}`,
            type: 'info',
            icon: faUsers,
            title: 'Inactive Team Member',
            message: `${username} hasn't logged time in ${daysSinceActivity} days`,
            details: 'Check if assistance is needed or if there are blockers',
            priority: 'low'
          });
        }
      }
    });
    
    // 7. Overdue deployments - Removed as we don't track deployment completion status
    
    // 8. Good performance recognition
    if (utilizationRate >= 80 && utilizationRate <= 100 && blockedTasks.length === 0) {
      alertsList.push({
        id: 'good_performance',
        type: 'success',
        icon: faCheckCircle,
        title: 'Team Performance On Track',
        message: `Great job! ${utilizationRate.toFixed(0)}% utilization with no blocked tasks`,
        details: 'Continue maintaining this performance level',
        priority: 'low'
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return alertsList.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
  }, [teamData]);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-black mb-2" />
        <p className="text-sm text-gray-600">No performance alerts</p>
      </div>
    );
  }

  const getAlertStyles = (type) => {
    switch (type) {
      case 'error':
        return 'border-l-4 border-l-black bg-gray-50 text-black';
      case 'warning':
        return 'border-l-4 border-l-gray-600 bg-gray-50 text-black';
      case 'info':
        return 'border-l-4 border-l-gray-400 bg-white text-black';
      case 'success':
        return 'border-l-4 border-l-black bg-white text-black';
      default:
        return 'border-l-4 border-l-gray-300 bg-white text-black';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-black';
      case 'warning':
        return 'text-gray-600';
      case 'info':
        return 'text-gray-500';
      case 'success':
        return 'text-black';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`p-3 ${getAlertStyles(alert.type)}`}
        >
          <div className="flex items-start gap-3">
            <FontAwesomeIcon 
              icon={alert.icon} 
              className={`text-sm mt-0.5 ${getIconColor(alert.type)}`} 
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium">{alert.title}</h4>
                <span className={`px-2 py-0.5 text-xs font-medium ${
                  alert.priority === 'high' ? 'bg-black text-white' :
                  alert.priority === 'medium' ? 'bg-gray-600 text-white' :
                  'bg-gray-300 text-black'
                }`}>
                  {alert.priority}
                </span>
              </div>
              <p className="text-xs text-gray-600">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}
      {alerts.length > 3 && (
        <p className="text-xs text-gray-500 text-center">+{alerts.length - 3} more alerts</p>
      )}
    </div>
  );
};

export default PerformanceAlerts;