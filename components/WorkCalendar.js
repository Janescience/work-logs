// components/WorkCalendar.js
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

function useHolidays(year) {
    const [holidays, setHolidays] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [holidayDetails, setHolidayDetails] = useState(new Map());

    useEffect(() => {
        if (!year) return;
        setLoading(true);
        fetch(`/api/holidays?year=${year}`)
            .then(res => {
                if (!res.ok) {
                    console.error('Failed to fetch holidays, status:', res.status);
                    return { holidays: [] };
                }
                return res.json();
            })
            .then(data => {
                if (data.holidays) {
                    const holidaySet = new Set();
                    const detailsMap = new Map();
                    
                    data.holidays.forEach(h => {
                        // Format date consistently as YYYY-MM-DD
                        const date = new Date(h.date);
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        holidaySet.add(dateStr);
                        detailsMap.set(dateStr, h.name);
                    });
                    
                    setHolidays(holidaySet);
                    setHolidayDetails(detailsMap);
                }
            })
            .catch(err => console.error("Failed to fetch holidays:", err))
            .finally(() => setLoading(false));
    }, [year]);

    return { holidays, holidayDetails, isLoading: loading };
}

export default function WorkCalendar({ allJiras }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { holidays, holidayDetails, isLoading } = useHolidays(currentDate.getFullYear());

    const { timesheetData, daysInMonth, totalMonthlyHours, dailyTotals, allPublicHolidays, todayDate, holidayInfo } = useMemo(() => {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();

        const today = new Date();
        const todayDate = (today.getFullYear() === currentYear && today.getMonth() === currentMonth) ? today.getDate() : null;

        const jiraMap = new Map();
        const dailyTotalsMap = new Map();
        const publicHolidaysSet = new Set();
        const holidayInfoMap = new Map();

        let monthlyHours = 0;

        // Initialize daily totals map and check holidays
        for (let i = 1; i <= numDays; i++) {
            dailyTotalsMap.set(i, 0);
            const date = new Date(currentYear, currentMonth, i);
            const dayOfWeek = date.getDay();
            
            // Format date as YYYY-MM-DD to match the holiday set
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            // Check if it's a weekend
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Check if it's a holiday
            const isHoliday = holidays.has(dateString);
            
            if (isWeekend || isHoliday) {
                publicHolidaysSet.add(i);
                
                // Store holiday info for tooltip
                if (isHoliday) {
                    holidayInfoMap.set(i, holidayDetails.get(dateString));
                } else if (isWeekend) {
                    holidayInfoMap.set(i, dayOfWeek === 0 ? 'Sunday' : 'Saturday');
                }
            }
            
            // console.log(`Day ${i} (${dateString}): Weekend=${isWeekend}, Holiday=${isHoliday}`);
        }

        // console.log("Public holidays for month:", Array.from(publicHolidaysSet));
        // console.log("Holiday details:", Array.from(holidayInfoMap.entries()));

        // Process JIRA logs
        allJiras.forEach(jira => {
            jira.dailyLogs.forEach(log => {
                const logDate = new Date(log.logDate);
                if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                    const dayOfMonth = logDate.getDate();
                    const hours = parseFloat(log.timeSpent || 0);
                    monthlyHours += hours;

                    dailyTotalsMap.set(dayOfMonth, dailyTotalsMap.get(dayOfMonth) + hours);

                    if (!jiraMap.has(jira.jiraNumber)) {
                        jiraMap.set(jira.jiraNumber, {
                            jiraNumber: jira.jiraNumber,
                            description: jira.description,
                            totalHours: 0,
                            logsByDay: {}
                        });
                    }

                    const jiraEntry = jiraMap.get(jira.jiraNumber);
                    jiraEntry.totalHours += hours;
                    jiraEntry.logsByDay[dayOfMonth] = (jiraEntry.logsByDay[dayOfMonth] || 0) + hours;
                }
            });
        });

        return {
            timesheetData: Array.from(jiraMap.values()),
            daysInMonth: numDays,
            totalMonthlyHours: monthlyHours,
            dailyTotals: Array.from(dailyTotalsMap.values()),
            allPublicHolidays: publicHolidaysSet,
            todayDate: todayDate,
            holidayInfo: holidayInfoMap
        };
    }, [allJiras, currentDate, holidays, holidayDetails]);

    const goToPreviousMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)), []);
    const goToNextMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)), []);

    // Format date header
    const getDayHeader = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="text-center">
                <div className="text-xs">{dayNames[dayOfWeek]}</div>
                <div className="font-semibold">{day}</div>
            </div>
        );
    };

    return (
        <div className="bg-white p-4 md:p-6 text-xs border border-gray-300 text-black">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-light text-black">Monthly Summary</h2>
                <div className="flex items-center gap-4">
                    <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded-full text-black">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <h3 className="text-lg  text-black w-40 text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-black">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center text-gray-500 mb-2">Loading holidays...</div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-1 text-left font-semibold text-gray-700 w-10">No.</th>
                            <th className="border p-1 text-left font-semibold text-gray-700 w-32">Reference/JIRA#</th>
                            <th className="border p-1 text-left font-semibold text-gray-700 min-w-[300px]">Description</th>
                            <th className="border p-1 text-center font-semibold text-gray-700 w-24">Total HRs</th>
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const isHoliday = allPublicHolidays.has(day);
                                const holidayName = holidayInfo.get(day);
                                return (
                                    <th 
                                        key={day} 
                                        className={`border p-1 font-semibold w-12 relative ${
                                            isHoliday ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                                        } ${day === todayDate ? 'ring-1 bg-blue-100' : ''}`}
                                        title={holidayName || ''}
                                    >
                                        {getDayHeader(day)}
                                        {holidayName && !['Saturday', 'Sunday'].includes(holidayName) && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-500 rounded-full"></div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                        {/* Daily Total Row */}
                        <tr className="bg-gray-100">
                            <th colSpan="3" className="border p-1 text-right font-bold text-black">Daily Total</th>
                            <th className="border p-1 text-center font-bold text-black">{totalMonthlyHours.toFixed(1)}</th>
                            {dailyTotals.map((total, index) => {
                                const day = index + 1;
                                const isHoliday = allPublicHolidays.has(day);
                                return (
                                    <th key={index} className={`border p-2 font-bold w-12 ${
                                        isHoliday ? 'bg-gray-100 text-gray-800' : 'text-black'
                                    } ${day === todayDate ? 'ring-1 bg-blue-100' : ''}`}>
                                        {total > 0 ? total.toFixed(1) : ''}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {timesheetData.map((jira, index) => (
                            <tr key={jira.jiraNumber} className="hover:bg-gray-50">
                                <td className="border p-1 text-center">{index + 1}</td>
                                <td className="border p-1 font-mono">{jira.jiraNumber}</td>
                                <td className="border p-1">{jira.description}</td>
                                <td className="border p-1 text-center font-semibold bg-gray-50">{jira.totalHours.toFixed(1)}</td>
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                    const isHoliday = allPublicHolidays.has(day);
                                    const hours = jira.logsByDay[day];
                                    return (
                                        <td key={day} className={`border p-2 text-center font-mono ${
                                            isHoliday ? 'bg-gray-100' : ''
                                        } ${day === todayDate ? 'ring-1 bg-blue-100' : ''}`}>
                                            {hours || ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {timesheetData.length === 0 && (
                    <div className="text-center text-gray-500 py-10 border">
                        No work logged for this month.
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
                    <span>Weekend/Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-500"></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}