'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRocket,
  faDownload,
  faFileExport,
  faEnvelope,
  faCalendarPlus,
  faUserPlus,
  faProjectDiagram,
  faChartBar,
  faCog,
  faRefresh,
  faExpand,
  faCompress,
  faBell,
  faClipboard,
  faShare
} from '@fortawesome/free-solid-svg-icons';

const QuickActions = ({ summaryData, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateQuickReport = async (type) => {
    setIsGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        type,
        generatedAt: new Date().toISOString(),
        data: summaryData
      };
      
      // Create and download report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (onAction) onAction('report_generated', { type });
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      if (onAction) onAction('copied_to_clipboard', { text });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getQuickSummary = () => {
    if (!summaryData) return 'No data available';
    
    const totalMembers = summaryData.individualSummary?.length || 0;
    const totalHours = summaryData.individualSummary?.reduce((sum, m) => sum + m.totalHours, 0) || 0;
    const activeProjects = summaryData.projectSummary?.reduce((sum, g) => sum + g.projects.length, 0) || 0;
    
    return `📊 Quick Summary:
- ${totalMembers} team members active
- ${totalHours.toFixed(0)} total hours logged
- ${activeProjects} active projects
- Generated: ${new Date().toLocaleString()}`;
  };

  const actions = [
    {
      id: 'advanced_reports',
      title: 'Advanced Reports',
      description: 'Open enterprise-level report generator with multiple formats',
      icon: faRocket,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        if (onAction) onAction('open_advanced_reports', {});
      },
      category: 'reports'
    },
    {
      id: 'monthly_report',
      title: 'Monthly Report',
      description: 'Generate comprehensive monthly performance report',
      icon: faFileExport,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => generateQuickReport('monthly'),
      category: 'reports'
    },
    {
      id: 'utilization_report',
      title: 'Utilization Report',
      description: 'Team capacity and resource utilization analysis',
      icon: faChartBar,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => generateQuickReport('utilization'),
      category: 'reports'
    },
    {
      id: 'copy_summary',
      title: 'Copy Summary',
      description: 'Copy quick summary to clipboard',
      icon: faClipboard,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => copyToClipboard(getQuickSummary()),
      category: 'tools'
    },
    {
      id: 'schedule_meeting',
      title: 'Schedule Review',
      description: 'Schedule team performance review meeting',
      icon: faCalendarPlus,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        // Simulate opening calendar
        if (onAction) onAction('schedule_meeting', {});
      },
      category: 'communication'
    },
    {
      id: 'send_notification',
      title: 'Team Alert',
      description: 'Send notification to team leads',
      icon: faBell,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        // Simulate sending notification
        if (onAction) onAction('send_notification', {});
      },
      category: 'communication'
    },
    {
      id: 'refresh_data',
      title: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: faRefresh,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => {
        if (onAction) onAction('refresh_data', {});
      },
      category: 'tools'
    },
    {
      id: 'export_csv',
      title: 'Export CSV',
      description: 'Export team data to CSV format',
      icon: faDownload,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => generateQuickReport('csv'),
      category: 'reports'
    },
    {
      id: 'share_dashboard',
      title: 'Share View',
      description: 'Generate shareable dashboard link',
      icon: faShare,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => {
        const url = window.location.href;
        copyToClipboard(url);
        if (onAction) onAction('share_dashboard', { url });
      },
      category: 'tools'
    }
  ];

  const categorizedActions = {
    reports: actions.filter(a => a.category === 'reports'),
    communication: actions.filter(a => a.category === 'communication'),
    tools: actions.filter(a => a.category === 'tools')
  };

  const QuickActionButton = ({ action, size = 'normal' }) => (
    <button
      onClick={action.action}
      disabled={isGeneratingReport}
      className={`
        ${action.color} text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${size === 'large' ? 'p-4' : 'p-3'}
        ${size === 'small' ? 'p-2' : ''}
        group relative overflow-hidden
      `}
      title={action.description}
    >
      <div className={`flex ${size === 'large' ? 'flex-col' : 'flex-row'} items-center gap-2`}>
        <FontAwesomeIcon 
          icon={action.icon} 
          className={`${size === 'large' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-lg'} ${isGeneratingReport ? 'animate-pulse' : ''}`}
        />
        <span className={`font-medium ${size === 'large' ? 'text-sm text-center' : size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {action.title}
        </span>
      </div>
      
      {/* Loading overlay */}
      {isGeneratingReport && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <FontAwesomeIcon icon={faRefresh} className="animate-spin text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="mb-8">
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-black flex items-center">
            <FontAwesomeIcon icon={faRocket} className="mr-3 text-purple-600" />
            Quick Actions
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} className="text-gray-600" />
          </button>
        </div>

        {!isExpanded ? (
          /* Compact View - Most Important Actions */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.slice(0, 4).map(action => (
              <QuickActionButton key={action.id} action={action} size="large" />
            ))}
          </div>
        ) : (
          /* Expanded View - All Actions Categorized */
          <div className="space-y-6">
            {/* Reports Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faFileExport} className="mr-2 text-blue-600" />
                Reports & Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categorizedActions.reports.map(action => (
                  <div key={action.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <QuickActionButton action={action} />
                    <p className="text-xs text-gray-600 mt-2">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-purple-600" />
                Communication & Collaboration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categorizedActions.communication.map(action => (
                  <div key={action.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <QuickActionButton action={action} />
                    <p className="text-xs text-gray-600 mt-2">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faCog} className="mr-2 text-gray-600" />
                Tools & Utilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categorizedActions.tools.map(action => (
                  <div key={action.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <QuickActionButton action={action} />
                    <p className="text-xs text-gray-600 mt-2">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Info Panel */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Quick Summary</h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{getQuickSummary()}</pre>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copyToClipboard(getQuickSummary())}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={() => generateQuickReport('summary')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            {isGeneratingReport && (
              <span className="flex items-center gap-2 text-blue-600">
                <FontAwesomeIcon icon={faRefresh} className="animate-spin" />
                Generating report...
              </span>
            )}
          </div>
          <div className="text-xs">
            {actions.length} quick actions available
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;