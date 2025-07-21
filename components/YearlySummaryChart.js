'use client';

import React from 'react';

const YearlySummaryChart = ({ data, loading }) => {
    if (loading) {
        return <div className="text-center p-10 text-gray-500">Loading chart data...</div>;
    }
    if (!data || data.length === 0) {
        return <div className="text-center p-10 text-gray-500">No data available for this year.</div>;
    }

    const maxValue = Math.max(...data.map(d => d.coreHours + d.nonCoreHours), 1); // Ensure maxValue is at least 1 to prevent division by zero
    const getBarHeight = (value) => (maxValue > 0 ? (value / maxValue) * 100 : 0);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-light text-black mb-4">Yearly Efforts Overview</h2>
            <div className="flex justify-end space-x-4 mb-4 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 bg-gray-800 mr-2"></div><span>Non-Core</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-gray-400 mr-2"></div><span>Core</span></div>
            </div>
            <div className="w-full h-64 flex items-end justify-around border-b-2 border-black pb-1">
                {data.map(item => (
                    <div key={item.month} className="h-full w-full flex items-end justify-center mx-1 group relative">
                        {/* --- FIX IS HERE: Added 'h-full' to this div --- */}
                        <div className="w-3/4 h-full flex items-end"> 
                            <div
                                className="w-1/2 bg-gray-800 hover:bg-black transition-all"
                                style={{ height: `${getBarHeight(item.nonCoreHours)}%` }}
                            ></div>
                            <div
                                className="w-1/2 bg-gray-400 hover:bg-gray-500 transition-all"
                                style={{ height: `${getBarHeight(item.coreHours)}%` }}
                            ></div>
                        </div>
                        <div className="absolute -bottom-6 text-xs font-semibold text-gray-600">{monthLabels[item.month - 1]}</div>
                        <div className="absolute bottom-full mb-2 w-32 p-2 bg-black text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="font-bold text-center mb-1">{monthLabels[item.month - 1]}</div>
                            <div>Non-Core: {item.nonCoreHours.toFixed(1)} hrs</div>
                            <div>Core: {item.coreHours.toFixed(1)} hrs</div>
                            <div className="font-bold border-t mt-1 pt-1">Total: {(item.coreHours + item.nonCoreHours).toFixed(1)} hrs</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default YearlySummaryChart;