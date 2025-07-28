'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faExpand, 
  faCompress,
  faInfoCircle,
  faTrendUp,
  faTrendDown,
  faEquals
} from '@fortawesome/free-solid-svg-icons';

const YearlySummaryChart = ({ data, loading, onMonthClick }) => {
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    if (loading) {
        return (
            <div className="mb-8">
                <div className="bg-white border border-gray-300 rounded-lg p-6">
                    <div className="text-center p-10 text-gray-500">
                        <FontAwesomeIcon icon={faChartBar} className="text-3xl mb-3" />
                        <p>Loading chart data...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!data || data.length === 0) {
        return (
            <div className="mb-8">
                <div className="bg-white border border-gray-300 rounded-lg p-6">
                    <div className="text-center p-10 text-gray-500">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-3xl mb-3" />
                        <p>No data available for this year.</p>
                    </div>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.coreHours + d.nonCoreHours), 1);
    const getBarHeight = (value) => (maxValue > 0 ? (value / maxValue) * 100 : 0);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Calculate trends
    const totalHoursByMonth = data.map(d => d.coreHours + d.nonCoreHours);
    const avgHours = totalHoursByMonth.reduce((sum, h) => sum + h, 0) / totalHoursByMonth.length;
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthData = data.find(d => d.month === currentMonth);
    const currentHours = currentMonthData ? currentMonthData.coreHours + currentMonthData.nonCoreHours : 0;
    
    const getTrendIcon = () => {
        if (currentHours > avgHours * 1.1) return faTrendUp;
        if (currentHours < avgHours * 0.9) return faTrendDown;
        return faEquals;
    };
    
    const getTrendColor = () => {
        if (currentHours > avgHours * 1.1) return 'text-green-600';
        if (currentHours < avgHours * 0.9) return 'text-red-600';
        return 'text-gray-600';
    };

    const handleBarClick = (monthData) => {
        setSelectedMonth(selectedMonth?.month === monthData.month ? null : monthData);
        if (onMonthClick) {
            onMonthClick(monthData);
        }
    };

    return (
        <div className="mb-8">
            <div className="bg-white border border-gray-300 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-light text-black flex items-center">
                        <FontAwesomeIcon icon={faChartBar} className="mr-3 text-gray-600" />
                        Yearly Efforts Overview
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <FontAwesomeIcon icon={getTrendIcon()} className={`${getTrendColor()} text-lg`} />
                            <span className="text-gray-600">
                                This month: {currentHours.toFixed(0)}h vs avg: {avgHours.toFixed(0)}h
                            </span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                        >
                            <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-800 mr-2 rounded"></div>
                            <span>Non-Core</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-400 mr-2 rounded"></div>
                            <span>Core</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        Click bars for details • Max: {maxValue.toFixed(0)}h
                    </div>
                </div>

                <div className={`w-full ${isExpanded ? 'h-96' : 'h-64'} flex items-end justify-around border-b-2 border-gray-200 pb-1 transition-all duration-300`}>
                    {data.map(item => {
                        const isSelected = selectedMonth?.month === item.month;
                        const isCurrentMonth = item.month === currentMonth;
                        
                        return (
                            <div 
                                key={item.month} 
                                className="h-full w-full flex items-end justify-center mx-1 group relative cursor-pointer"
                                onClick={() => handleBarClick(item)}
                            >
                                <div className={`w-3/4 h-full flex items-end transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}> 
                                    <div
                                        className={`w-1/2 transition-all duration-200 ${
                                            isSelected ? 'bg-black' : 
                                            isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800 hover:bg-black'
                                        } ${isSelected || isCurrentMonth ? 'shadow-lg' : ''}`}
                                        style={{ height: `${getBarHeight(item.nonCoreHours)}%` }}
                                    ></div>
                                    <div
                                        className={`w-1/2 transition-all duration-200 ${
                                            isSelected ? 'bg-gray-600' : 
                                            isCurrentMonth ? 'bg-gray-500' : 'bg-gray-400 hover:bg-gray-600'
                                        } ${isSelected || isCurrentMonth ? 'shadow-lg' : ''}`}
                                        style={{ height: `${getBarHeight(item.coreHours)}%` }}
                                    ></div>
                                </div>
                                
                                <div className={`absolute -bottom-6 text-xs font-semibold transition-colors ${
                                    isCurrentMonth ? 'text-black' : 'text-gray-600'
                                }`}>
                                    {monthLabels[item.month - 1]}
                                    {isCurrentMonth && <div className="w-1 h-1 bg-black rounded-full mx-auto mt-1"></div>}
                                </div>
                                
                                {/* Enhanced tooltip */}
                                <div className={`absolute bottom-full mb-2 w-40 p-3 bg-black text-white text-xs rounded-lg shadow-xl transition-opacity duration-200 pointer-events-none z-10 ${
                                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                    <div className="font-bold text-center mb-2 text-sm">
                                        {monthLabels[item.month - 1]} Details
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span>Non-Core:</span>
                                            <span className="font-mono">{item.nonCoreHours.toFixed(1)}h</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Core:</span>
                                            <span className="font-mono">{item.coreHours.toFixed(1)}h</span>
                                        </div>
                                        <div className="border-t border-gray-600 pt-1 mt-1">
                                            <div className="flex justify-between font-bold">
                                                <span>Total:</span>
                                                <span className="font-mono">{(item.coreHours + item.nonCoreHours).toFixed(1)}h</span>
                                            </div>
                                        </div>
                                        <div className="text-center text-gray-300 text-xs mt-2">
                                            {((item.coreHours + item.nonCoreHours) / maxValue * 100).toFixed(0)}% of peak
                                        </div>
                                    </div>
                                    {/* Tooltip arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center">
                        <div className="text-lg font-light text-black">{totalHoursByMonth.reduce((sum, h) => sum + h, 0).toFixed(0)}h</div>
                        <p className="text-xs text-gray-600">Total YTD</p>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-light text-black">{avgHours.toFixed(0)}h</div>
                        <p className="text-xs text-gray-600">Monthly Avg</p>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-light text-black">{Math.max(...totalHoursByMonth).toFixed(0)}h</div>
                        <p className="text-xs text-gray-600">Peak Month</p>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-light text-black">
                            {data.filter(d => d.coreHours + d.nonCoreHours > 0).length}/12
                        </div>
                        <p className="text-xs text-gray-600">Active Months</p>
                    </div>
                </div>

                {selectedMonth && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-black mb-2">
                            {monthLabels[selectedMonth.month - 1]} Deep Dive
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Non-Core Ratio:</span>
                                <span className="ml-2 font-mono">
                                    {((selectedMonth.nonCoreHours / (selectedMonth.coreHours + selectedMonth.nonCoreHours)) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">vs Average:</span>
                                <span className={`ml-2 font-mono ${
                                    (selectedMonth.coreHours + selectedMonth.nonCoreHours) > avgHours ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {((selectedMonth.coreHours + selectedMonth.nonCoreHours) - avgHours > 0 ? '+' : '')}
                                    {((selectedMonth.coreHours + selectedMonth.nonCoreHours) - avgHours).toFixed(0)}h
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Efficiency:</span>
                                <span className="ml-2 font-mono">
                                    {((selectedMonth.coreHours + selectedMonth.nonCoreHours) / maxValue * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YearlySummaryChart;