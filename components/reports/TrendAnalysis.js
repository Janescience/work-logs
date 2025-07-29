'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrendUp,
  faTrendDown,
  faEquals,
  faChartLine,
  faUsers,
  faProjectDiagram,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const TrendAnalysis = ({ yearlyData, currentMonthData }) => {
  if (!currentMonthData) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-600">No data available</p>
      </div>
    );
  }

  // Calculate current month totals
  const currentTotal = currentMonthData.individualSummary?.reduce((sum, member) => 
    sum + (member.totalHours || 0), 0) || 0;
  
  const currentCore = currentMonthData.individualSummary?.filter(m => m.user?.type === 'Core')
    .reduce((sum, member) => sum + (member.totalHours || 0), 0) || 0;
  
  const currentNonCore = currentMonthData.individualSummary?.filter(m => m.user?.type === 'Non-Core')
    .reduce((sum, member) => sum + (member.totalHours || 0), 0) || 0;

  const teamSize = currentMonthData.individualSummary?.length || 0;
  const activeProjects = currentMonthData.projectSummary?.reduce((sum, group) => 
    sum + group.projects.length, 0) || 0;
  
  const capacity = teamSize * 22 * 8;
  const utilizationRate = capacity > 0 ? (currentTotal / capacity) * 100 : 0;

  // Simple trend calculation from yearly data
  let monthlyChange = 0;
  let quarterGrowth = 0;
  
  if (yearlyData && yearlyData.length > 1) {
    const currentMonth = new Date().getMonth() + 1;
    const thisMonthData = yearlyData.find(d => d.month === currentMonth);
    const lastMonthData = yearlyData.find(d => d.month === currentMonth - 1);
    const threeMonthsAgo = yearlyData.find(d => d.month === currentMonth - 3);
    
    if (thisMonthData && lastMonthData) {
      const thisTotal = thisMonthData.individualSummary?.reduce((sum, m) => sum + (m.totalHours || 0), 0) || 0;
      const lastTotal = lastMonthData.individualSummary?.reduce((sum, m) => sum + (m.totalHours || 0), 0) || 0;
      monthlyChange = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;
    }
    
    if (thisMonthData && threeMonthsAgo) {
      const thisTotal = thisMonthData.individualSummary?.reduce((sum, m) => sum + (m.totalHours || 0), 0) || 0;
      const threeMonthsTotal = threeMonthsAgo.individualSummary?.reduce((sum, m) => sum + (m.totalHours || 0), 0) || 0;
      quarterGrowth = threeMonthsTotal > 0 ? ((thisTotal - threeMonthsTotal) / threeMonthsTotal) * 100 : 0;
    }
  }

  // Debug yearlyData structure first
  console.log('TrendAnalysis Debug - yearlyData:', {
    yearlyDataExists: !!yearlyData,
    yearlyDataLength: yearlyData?.length,
    currentMonthDataExists: !!currentMonthData,
    yearlyDataSample: yearlyData?.[0],
    currentMonthSample: currentMonthData
  });

  // Create monthly trend data
  const monthlyTrends = [];
  if (yearlyData && yearlyData.length > 0) {
    const currentMonth = new Date().getMonth() + 1;
    
    // Try different approaches to get data
    const dataWithHours = yearlyData.map(monthData => {
      // Try multiple ways to calculate totalHours
      let totalHours = 0;
      
      // Method 1: Direct totalHours field
      if (monthData.totalHours) {
        totalHours = monthData.totalHours;
      }
      // Method 2: individualSummary
      else if (monthData.individualSummary?.length > 0) {
        totalHours = monthData.individualSummary.reduce((sum, m) => sum + (m.totalHours || 0), 0);
      }
      // Method 3: projectSummary
      else if (monthData.projectSummary?.length > 0) {
        totalHours = monthData.projectSummary.reduce((sum, group) => 
          sum + group.projects.reduce((pSum, proj) => pSum + (proj.totalHours || 0), 0), 0);
      }
      
      return {
        ...monthData,
        calculatedHours: totalHours,
        hasIndividualSummary: !!monthData.individualSummary?.length,
        hasProjectSummary: !!monthData.projectSummary?.length,
        hasDirectTotal: !!monthData.totalHours
      };
    });
    
    console.log('TrendAnalysis Debug - processed data:', dataWithHours);
    
    const last6Months = dataWithHours
      .filter(d => d.month <= currentMonth)
      .slice(-6)
      .sort((a, b) => a.month - b.month);
    
    last6Months.forEach((monthData, index) => {
      const totalHours = monthData.calculatedHours;
      const prevMonth = index > 0 ? last6Months[index - 1] : null;
      const prevHours = prevMonth ? prevMonth.calculatedHours : 0;
      
      const changePercent = prevHours > 0 ? ((totalHours - prevHours) / prevHours) * 100 : 0;
      
      monthlyTrends.push({
        month: monthData.month,
        monthName: new Date(2024, monthData.month - 1).toLocaleString('default', { month: 'short' }),
        totalHours,
        changePercent,
        isPositive: changePercent > 0
      });
    });
  }
  
  console.log('TrendAnalysis Debug - monthlyTrends:', monthlyTrends);

  const getTrendIcon = (value) => {
    if (value > 5) return faTrendUp;
    if (value < -5) return faTrendDown;
    return faEquals;
  };

  const getTrendColor = (value) => {
    if (value > 5) return 'text-black';
    if (value < -5) return 'text-gray-600';
    return 'text-gray-500';
  };

  const getHealthStatus = () => {
    if (utilizationRate >= 85) return { color: 'text-black', bg: 'bg-black', text: 'High Load' };
    if (utilizationRate >= 70) return { color: 'text-gray-600', bg: 'bg-gray-600', text: 'Optimal' };
    if (utilizationRate >= 50) return { color: 'text-gray-500', bg: 'bg-gray-500', text: 'Moderate' };
    return { color: 'text-gray-400', bg: 'bg-gray-400', text: 'Low Usage' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-4">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 border border-gray-200 bg-white">
          <div className="text-xl font-light text-black">{currentTotal.toFixed(0)}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <FontAwesomeIcon 
              icon={getTrendIcon(monthlyChange)} 
              className={getTrendColor(monthlyChange)} 
            />
            <span>Total Hours</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {monthlyChange !== 0 ? `${monthlyChange >= 0 ? '+' : ''}${monthlyChange.toFixed(1)}%` : '~0%'}
          </div>
        </div>
        
        <div className="text-center p-3 border border-gray-200 bg-white">
          <div className="text-xl font-light text-black">{utilizationRate.toFixed(0)}%</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <FontAwesomeIcon icon={faCheckCircle} className={healthStatus.color} />
            <span>Utilization</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{healthStatus.text}</div>
        </div>
        
        <div className="text-center p-3 border border-gray-200 bg-white">
          <div className="text-xl font-light text-black">{activeProjects}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-500" />
            <span>Active Projects</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {activeProjects > 0 ? `${(currentTotal / activeProjects).toFixed(0)}h avg` : '0h avg'}
          </div>
        </div>
        
        <div className="text-center p-3 border border-gray-200 bg-white">
          <div className="text-xl font-light text-black">{teamSize}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <FontAwesomeIcon icon={faUsers} className="text-gray-500" />
            <span>Team Members</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {teamSize > 0 ? `${(currentTotal / teamSize).toFixed(0)}h avg` : '0h avg'}
          </div>
        </div>
      </div>

      {/* Monthly Trend Graph */}
      {monthlyTrends.length > 0 && (
        <div className="border border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-black">Monthly Trend Analysis</h4>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {/* Graph Bars */}
              <div className="flex items-end justify-between h-24 border-b border-gray-200 pb-2">
                {monthlyTrends.map((month, index) => {
                  const maxHours = Math.max(...monthlyTrends.map(m => m.totalHours));
                  const height = maxHours > 0 ? (month.totalHours / maxHours) * 100 : 5;
                  
                  return (
                    <div key={month.month} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full max-w-8 bg-gray-600 relative group cursor-pointer transition-colors hover:bg-black"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${month.monthName}: ${month.totalHours.toFixed(0)} hours`}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="bg-black text-white text-xs px-2 py-1 whitespace-nowrap rounded">
                            {month.monthName}: {month.totalHours.toFixed(0)} hours
                            {index > 0 && (
                              <div className="text-gray-300">
                                {month.changePercent >= 0 ? '+' : ''}{month.changePercent.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 mt-1">{month.monthName}</span>
                      <span className="text-xs text-gray-500">{month.totalHours.toFixed(0)}h</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Percentage Changes */}
              <div className="grid grid-cols-6 gap-1">
                {monthlyTrends.slice(0, 6).map((month, index) => (
                  <div key={month.month} className="text-center">
                    {index > 0 ? (
                      <div className={`text-xs px-1 py-0.5 ${
                        Math.abs(month.changePercent) <= 2 ? 'text-gray-500' :
                        month.isPositive ? 'text-black font-medium' : 'text-gray-600 font-medium'
                      }`}>
                        {Math.abs(month.changePercent) <= 2 ? '~0%' : 
                         `${month.changePercent >= 0 ? '+' : ''}${month.changePercent.toFixed(1)}%`}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Base</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-black">Resource Distribution</h4>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Core Team</span>
              <span className="text-sm font-light text-black">{currentCore.toFixed(0)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Non-Core Team</span>
              <span className="text-sm font-light text-black">{currentNonCore.toFixed(0)}h</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Core Ratio</span>
                <span className="text-black">
                  {currentTotal > 0 ? ((currentCore / currentTotal) * 100).toFixed(0) : 50}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-black">Performance Trends</h4>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Monthly Change</span>
              <div className={`px-2 py-0.5 text-xs ${
                Math.abs(monthlyChange) > 5 ? 
                  (monthlyChange > 0 ? 'bg-black text-white' : 'bg-gray-600 text-white') :
                'bg-gray-300 text-black'
              }`}>
                {Math.abs(monthlyChange) < 0.1 ? '~0%' : 
                 `${monthlyChange >= 0 ? '+' : ''}${monthlyChange.toFixed(1)}%`}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Quarter Growth</span>
              <div className={`px-2 py-0.5 text-xs ${
                Math.abs(quarterGrowth) > 10 ? 
                  (quarterGrowth > 0 ? 'bg-black text-white' : 'bg-gray-600 text-white') :
                'bg-gray-300 text-black'
              }`}>
                {Math.abs(quarterGrowth) < 0.1 ? '~0%' : 
                 `${quarterGrowth >= 0 ? '+' : ''}${quarterGrowth.toFixed(1)}%`}
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Status</span>
                <span className={`${healthStatus.color} font-medium`}>
                  {Math.abs(monthlyChange) < 0.1 ? 'Stable' : 
                   monthlyChange > 5 ? 'Growing' : monthlyChange < -5 ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className={`flex items-center gap-2 px-3 py-1 ${healthStatus.bg} text-white`}>
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>{healthStatus.text} - {utilizationRate.toFixed(0)}% Capacity</span>
        </div>
        <div className="text-gray-500">
          {activeProjects} projects • {teamSize} members • {currentTotal.toFixed(0)}h total
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;