'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport,
  faDownload,
  faSpinner,
  faCheckCircle,
  faCalendarAlt,
  faFilter,
  faChartBar,
  faUsers,
  faProjectDiagram,
  faCog,
  faEnvelope,
  faPrint,
  faFileWord,
  faFilePdf,
  faFileExcel,
  faFileCode,
  faEye,
  faShare
} from '@fortawesome/free-solid-svg-icons';

const AdvancedReportGenerator = ({ summaryData, yearlyData, onClose }) => {
  const [selectedReport, setSelectedReport] = useState('executive');
  const [reportConfig, setReportConfig] = useState({
    dateRange: 'current_month',
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: true,
    format: 'pdf',
    recipients: [],
    customFilters: {
      teams: 'all',
      projects: 'all',
      members: 'all'
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const downloadLinkRef = useRef(null);

  const reportTypes = {
    executive: {
      name: 'Executive Summary',
      description: 'High-level overview for senior management',
      icon: faChartBar,
      color: 'bg-blue-500',
      includes: ['Key metrics', 'Trends analysis', 'Critical alerts', 'Strategic recommendations']
    },
    operational: {
      name: 'Operational Report',
      description: 'Detailed operational metrics and team performance',
      icon: faUsers,
      color: 'bg-green-500',
      includes: ['Team utilization', 'Resource allocation', 'Productivity metrics', 'Capacity planning']
    },
    project: {
      name: 'Project Portfolio',
      description: 'Project-focused analysis and status',
      icon: faProjectDiagram,
      color: 'bg-purple-500',
      includes: ['Project status', 'Resource consumption', 'Timeline analysis', 'Risk assessment']
    },
    financial: {
      name: 'Financial Analysis',
      description: 'Cost analysis and budget tracking',
      icon: faFileExcel,
      color: 'bg-orange-500',
      includes: ['Cost per project', 'ROI analysis', 'Budget variance', 'Cost optimization']
    }
  };

  const formatOptions = {
    pdf: { name: 'PDF Report', icon: faFilePdf, color: 'text-red-600' },
    excel: { name: 'Excel Workbook', icon: faFileExcel, color: 'text-green-600' },
    word: { name: 'Word Document', icon: faFileWord, color: 'text-blue-600' },
    json: { name: 'JSON Data', icon: faFileCode, color: 'text-gray-600' }
  };

  const generateReportData = () => {
    const currentDate = new Date();
    const reportData = {
      metadata: {
        title: reportTypes[selectedReport].name,
        generatedAt: currentDate.toISOString(),
        generatedBy: 'IT Lead Dashboard',
        period: reportConfig.dateRange,
        format: reportConfig.format
      },
      executive_summary: {
        total_members: summaryData?.individualSummary?.length || 0,
        total_hours: summaryData?.individualSummary?.reduce((sum, m) => sum + m.totalHours, 0) || 0,
        active_projects: summaryData?.projectSummary?.reduce((sum, g) => sum + g.projects.length, 0) || 0,
        utilization_rate: calculateUtilizationRate(),
        key_insights: generateKeyInsights()
      },
      detailed_metrics: generateDetailedMetrics(),
      recommendations: generateRecommendations(),
      charts_data: reportConfig.includeCharts ? generateChartsData() : null
    };

    return reportData;
  };

  const calculateUtilizationRate = () => {
    if (!summaryData?.individualSummary) return 0;
    const capacity = 22 * 8; // Working days * 8 hours
    const totalCapacity = summaryData.individualSummary.length * capacity;
    const totalHours = summaryData.individualSummary.reduce((sum, m) => sum + m.totalHours, 0);
    return totalCapacity > 0 ? (totalHours / totalCapacity) * 100 : 0;
  };

  const generateKeyInsights = () => {
    const insights = [];
    const utilizationRate = calculateUtilizationRate();
    
    if (utilizationRate > 90) {
      insights.push('High team utilization - consider capacity expansion');
    } else if (utilizationRate < 60) {
      insights.push('Low team utilization - opportunities for optimization');
    }
    
    if (summaryData?.individualSummary) {
      const capacity = 22 * 8;
      const overCapacityCount = summaryData.individualSummary.filter(m => 
        (m.totalHours / capacity) > 1.2
      ).length;
      
      if (overCapacityCount > 0) {
        insights.push(`${overCapacityCount} team members over capacity - workload rebalancing needed`);
      }
    }
    
    return insights;
  };

  const generateDetailedMetrics = () => {
    if (!summaryData) return {};
    
    return {
      team_breakdown: summaryData.individualSummary?.map(member => ({
        name: member.user.name || member.user.username,
        team: member.user.teamName || 'Unassigned',
        type: member.user.type,
        hours: member.totalHours,
        utilization: (member.totalHours / (22 * 8)) * 100
      })) || [],
      project_breakdown: summaryData.projectSummary?.flatMap(group => 
        group.projects.map(project => ({
          name: project.name,
          group: group._id,
          total_hours: project.totalHours,
          core_hours: project.coreHours,
          non_core_hours: project.nonCoreHours
        }))
      ) || []
    };
  };

  const generateRecommendations = () => {
    const recommendations = [];
    const utilizationRate = calculateUtilizationRate();
    
    if (utilizationRate > 100) {
      recommendations.push({
        priority: 'high',
        category: 'Resource Management',
        title: 'Address Over-Capacity Issues',
        description: 'Redistribute workload or consider hiring additional resources',
        impact: 'Prevent team burnout and maintain quality'
      });
    }
    
    if (utilizationRate < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'Optimization',
        title: 'Increase Team Utilization',
        description: 'Identify additional projects or cross-training opportunities',
        impact: 'Maximize ROI on human resources'
      });
    }
    
    recommendations.push({
      priority: 'low',
      category: 'Process Improvement',
      title: 'Regular Performance Reviews',
      description: 'Implement monthly performance review cycles',
      impact: 'Continuous improvement and early issue detection'
    });
    
    return recommendations;
  };

  const generateChartsData = () => {
    if (!yearlyData) return null;
    
    return {
      monthly_trends: yearlyData.map(month => ({
        month: month.month,
        core_hours: month.coreHours,
        non_core_hours: month.nonCoreHours,
        total: month.coreHours + month.nonCoreHours
      })),
      team_utilization: summaryData?.individualSummary?.map(member => ({
        name: member.user.name || member.user.username,
        utilization: (member.totalHours / (22 * 8)) * 100
      })) || []
    };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation time
      
      const reportData = generateReportData();
      const blob = createReportBlob(reportData);
      
      setGeneratedReport({
        data: reportData,
        blob,
        filename: `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${reportConfig.format}`,
        size: (blob.size / 1024).toFixed(1) + ' KB'
      });
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const createReportBlob = (data) => {
    switch (reportConfig.format) {
      case 'pdf':
        return new Blob([generatePDFContent(data)], { type: 'application/pdf' });
      case 'excel':
        return new Blob([generateExcelContent(data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      case 'word':
        return new Blob([generateWordContent(data)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      default:
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
  };

  const generatePDFContent = (data) => {
    return `%PDF-1.4
${JSON.stringify(data, null, 2)}
%EOF`;
  };

  const generateExcelContent = (data) => {
    // Simplified Excel-like content
    let content = "Report Type,Value\n";
    content += `Generated At,${data.metadata.generatedAt}\n`;
    content += `Total Members,${data.executive_summary.total_members}\n`;
    content += `Total Hours,${data.executive_summary.total_hours}\n`;
    content += `Utilization Rate,${data.executive_summary.utilization_rate.toFixed(1)}%\n`;
    return content;
  };

  const generateWordContent = (data) => {
    return `
${data.metadata.title}
Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}

EXECUTIVE SUMMARY
Total Members: ${data.executive_summary.total_members}
Total Hours: ${data.executive_summary.total_hours}
Utilization Rate: ${data.executive_summary.utilization_rate.toFixed(1)}%

KEY INSIGHTS:
${data.executive_summary.key_insights.map(insight => `- ${insight}`).join('\n')}

RECOMMENDATIONS:
${data.recommendations.map(rec => `${rec.priority.toUpperCase()}: ${rec.title} - ${rec.description}`).join('\n')}
`;
  };

  const handleDownload = () => {
    if (!generatedReport) return;
    
    const url = URL.createObjectURL(generatedReport.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedReport.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = async () => {
    if (!emailRecipient || !generatedReport) return;
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Report sent to ${emailRecipient}`);
    setEmailRecipient('');
  };

  const addEmailRecipient = () => {
    if (emailRecipient && !reportConfig.recipients.includes(emailRecipient)) {
      setReportConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, emailRecipient]
      }));
      setEmailRecipient('');
    }
  };

  const removeRecipient = (email) => {
    setReportConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faFileExport} className="mr-3 text-blue-600" />
            Advanced Report Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* Report Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Type</h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(reportTypes).map(([key, report]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedReport(key)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReport === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${report.color} rounded flex items-center justify-center`}>
                        <FontAwesomeIcon icon={report.icon} className="text-white text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Includes: {report.includes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Options */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
              
              {/* Date Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={reportConfig.dateRange}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="current_month">Current Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Format Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formatOptions).map(([key, format]) => (
                    <div
                      key={key}
                      onClick={() => setReportConfig(prev => ({ ...prev, format: key }))}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        reportConfig.format === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={format.icon} className={format.color} />
                        <span className="text-sm font-medium">{format.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Include in Report</label>
                <div className="space-y-2">
                  {[
                    { key: 'includeCharts', label: 'Charts and Visualizations' },
                    { key: 'includeDetails', label: 'Detailed Metrics' },
                    { key: 'includeRecommendations', label: 'Strategic Recommendations' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportConfig[option.key]}
                        onChange={(e) => setReportConfig(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email Recipients */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addEmailRecipient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {reportConfig.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reportConfig.recipients.map(email => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="text-gray-400 hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Actions */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
              
              {!generatedReport ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FontAwesomeIcon icon={faFileExport} className="text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Generate a report to see preview</p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isGenerating ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faFileExport} />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
                    <div>
                      <h4 className="font-medium text-gray-900">Report Generated Successfully</h4>
                      <p className="text-sm text-gray-600">
                        {generatedReport.filename} ({generatedReport.size})
                      </p>
                    </div>
                  </div>

                  {/* Report Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Executive Summary</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Members:</span>
                        <span className="font-medium ml-2">{generatedReport.data.executive_summary.total_members}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Hours:</span>
                        <span className="font-medium ml-2">{generatedReport.data.executive_summary.total_hours}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Projects:</span>
                        <span className="font-medium ml-2">{generatedReport.data.executive_summary.active_projects}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Utilization:</span>
                        <span className="font-medium ml-2">{generatedReport.data.executive_summary.utilization_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      Download
                    </button>
                    {reportConfig.recipients.length > 0 && (
                      <button
                        onClick={handleEmail}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
                      >
                        <FontAwesomeIcon icon={faEnvelope} />
                        Email ({reportConfig.recipients.length})
                      </button>
                    )}
                    <button
                      onClick={() => setGeneratedReport(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Team Members:</span>
                  <span className="font-medium ml-2">{summaryData?.individualSummary?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium ml-2">
                    {summaryData?.individualSummary?.reduce((sum, m) => sum + m.totalHours, 0) || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Projects:</span>
                  <span className="font-medium ml-2">
                    {summaryData?.projectSummary?.reduce((sum, g) => sum + g.projects.length, 0) || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-medium ml-2">{calculateUtilizationRate().toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportGenerator;