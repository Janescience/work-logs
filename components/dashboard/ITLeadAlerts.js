'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle,
  faCheckCircle,
  faBell,
  faUsers,
  faChartLine,
  faExclamationCircle,
  faClock,
  faFire,
  faShieldAlt,
  faTrendUp,
  faTrendDown
} from '@fortawesome/free-solid-svg-icons';

const ITLeadAlerts = ({ summaryData }) => {
  const alerts = useMemo(() => {
    if (!summaryData) return [];

    const alertsList = [];
    const capacity = 22 * 8; // Working days * 8 hours

    // 1. Calculate team utilization rates
    const teamUtilization = {};
    const teamWorkload = {};
    
    if (summaryData.individualSummary) {
      summaryData.individualSummary.forEach(member => {
        const teamName = member.user.teamName || 'Unassigned';
        const utilizationRate = (member.totalHours / capacity) * 100;
        
        if (!teamUtilization[teamName]) {
          teamUtilization[teamName] = [];
          teamWorkload[teamName] = { totalHours: 0, memberCount: 0 };
        }
        
        teamUtilization[teamName].push(utilizationRate);
        teamWorkload[teamName].totalHours += member.totalHours;
        teamWorkload[teamName].memberCount++;
      });
    }

    // 2. Over/Under utilized teams
    Object.entries(teamUtilization).forEach(([teamName, rates]) => {
      const avgUtilization = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      
      if (avgUtilization > 120) {
        alertsList.push({
          id: `overutil_${teamName}`,
          type: 'critical',
          icon: faFire,
          title: 'Team Over-Capacity',
          message: `${teamName} team at ${avgUtilization.toFixed(0)}% capacity`,
          details: `${rates.length} members averaging ${(teamWorkload[teamName].totalHours / rates.length).toFixed(1)}h each`,
          teamName,
          priority: 'critical',
          action: 'Redistribute workload or add resources'
        });
      } else if (avgUtilization < 60) {
        alertsList.push({
          id: `underutil_${teamName}`,
          type: 'warning',
          icon: faChartLine,
          title: 'Team Under-Utilized',
          message: `${teamName} team at ${avgUtilization.toFixed(0)}% capacity`,
          details: `Opportunity to take on more work or redistribute tasks`,
          teamName,
          priority: 'medium',
          action: 'Consider additional project assignments'
        });
      }
    });

    // 3. Project resource concentration
    if (summaryData.projectSummary) {
      const allProjects = summaryData.projectSummary.flatMap(group => group.projects);
      const topProjects = allProjects.sort((a, b) => b.totalHours - a.totalHours).slice(0, 3);
      const totalHours = allProjects.reduce((sum, proj) => sum + proj.totalHours, 0);
      
      topProjects.forEach(project => {
        const concentration = (project.totalHours / totalHours) * 100;
        if (concentration > 40) {
          alertsList.push({
            id: `concentration_${project.name}`,
            type: 'warning',
            icon: faExclamationTriangle,
            title: 'High Resource Concentration',
            message: `${project.name} consumes ${concentration.toFixed(0)}% of total resources`,
            details: `${project.totalHours.toFixed(1)} hours out of ${totalHours.toFixed(1)} total`,
            priority: 'medium',
            action: 'Monitor project risk and resource dependencies'
          });
        }
      });
    }

    // 4. Core vs Non-Core balance
    if (summaryData.individualSummary) {
      const coreMembers = summaryData.individualSummary.filter(m => m.user.type === 'Core');
      const nonCoreMembers = summaryData.individualSummary.filter(m => m.user.type === 'Non-Core');
      
      const coreHours = coreMembers.reduce((sum, m) => sum + m.totalHours, 0);
      const nonCoreHours = nonCoreMembers.reduce((sum, m) => sum + m.totalHours, 0);
      const totalHours = coreHours + nonCoreHours;
      
      if (totalHours > 0) {
        const coreRatio = (coreHours / totalHours) * 100;
        
        if (coreRatio > 70) {
          alertsList.push({
            id: 'core_heavy',
            type: 'info',
            icon: faShieldAlt,
            title: 'Core-Heavy Resource Allocation',
            message: `${coreRatio.toFixed(0)}% of effort from core team`,
            details: `Consider leveraging non-core resources for suitable tasks`,
            priority: 'low',
            action: 'Review task distribution strategy'
          });
        } else if (coreRatio < 30) {
          alertsList.push({
            id: 'noncore_heavy',
            type: 'info',
            icon: faUsers,
            title: 'Non-Core Heavy Resource Allocation',
            message: `${(100 - coreRatio).toFixed(0)}% of effort from non-core team`,
            details: `Ensure knowledge transfer and core oversight`,
            priority: 'low',
            action: 'Monitor quality and knowledge management'
          });
        }
      }
    }

    // 5. Individual performance outliers
    if (summaryData.individualSummary) {
      const hoursData = summaryData.individualSummary.map(m => m.totalHours);
      const avgHours = hoursData.reduce((sum, h) => sum + h, 0) / hoursData.length;
      const maxHours = Math.max(...hoursData);
      const minHours = Math.min(...hoursData);
      
      summaryData.individualSummary.forEach(member => {
        const deviation = Math.abs(member.totalHours - avgHours);
        const deviationPercent = (deviation / avgHours) * 100;
        
        if (member.totalHours === maxHours && deviationPercent > 50) {
          alertsList.push({
            id: `overwork_${member.user._id}`,
            type: 'warning',
            icon: faExclamationCircle,
            title: 'Potential Overwork Risk',
            message: `${member.user.name || member.user.username} logged ${member.totalHours.toFixed(1)}h`,
            details: `${deviationPercent.toFixed(0)}% above team average (${avgHours.toFixed(1)}h)`,
            priority: 'medium',
            action: 'Check workload and well-being'
          });
        } else if (member.totalHours === minHours && deviationPercent > 50) {
          alertsList.push({
            id: `underwork_${member.user._id}`,
            type: 'info',
            icon: faInfoCircle,
            title: 'Low Activity Member',
            message: `${member.user.name || member.user.username} logged ${member.totalHours.toFixed(1)}h`,
            details: `${deviationPercent.toFixed(0)}% below team average`,
            priority: 'low',
            action: 'Check availability and assignment status'
          });
        }
      });
    }

    // 6. If no issues - positive feedback
    if (alertsList.length === 0) {
      alertsList.push({
        id: 'all_good',
        type: 'success',
        icon: faCheckCircle,
        title: 'Operations Running Smoothly',
        message: 'All teams operating within optimal parameters',
        details: 'Resource utilization and workload distribution look healthy',
        priority: 'info',
        action: 'Continue monitoring for trends'
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    return alertsList.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  }, [summaryData]);

  if (!summaryData) return null;

  const getAlertStyles = (type) => {
    switch (type) {
      case 'critical':
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
      case 'critical':
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

  const getPriorityBadge = (priority) => {
    const styles = {
      critical: 'bg-black text-white',
      high: 'bg-gray-700 text-white',
      medium: 'bg-gray-500 text-white',
      low: 'bg-gray-300 text-black',
      info: 'bg-gray-400 text-white'
    };
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium ${styles[priority] || styles.info}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const criticalCount = alerts.filter(a => a.priority === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-black mb-2" />
        <p className="text-sm text-gray-600">No alerts - all systems normal</p>
      </div>
    );
  }

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
                {getPriorityBadge(alert.priority)}
              </div>
              <p className="text-xs text-gray-600 mb-1">{alert.message}</p>
              {alert.action && (
                <p className="text-xs text-gray-500">Action: {alert.action}</p>
              )}
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

export default ITLeadAlerts;