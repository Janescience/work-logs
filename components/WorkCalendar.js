// components/WorkCalendar.js
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import CalendarDetailModal from '@/components/CalendarDetailModal';

// Helper function to format date to DD-MM-YYYY
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

export default function WorkLogCalendar({ allJiras }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- LOGIC SECTION (UNCHANGED) ---
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const [showCalendarDetailModal, setShowCalendarDetailModal] = useState(false);
    const [calendarModalDailySummary, setCalendarModalDailySummary] = useState({});
    const [calendarModalTitle, setCalendarModalTitle] = useState('');

    const { days: calendarDays, totalMonthlyHours } = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const dailySummary = {};
        let monthlyHours = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateKey = date.toISOString().split('T')[0];
            dailySummary[dateKey] = {
                totalHours: 0, taskLogCount: 0, totalDeploymentHours: 0, deploymentLogCount: 0,
                deploymentProductionCount: 0, deploymentPreProductionCount: 0, allLogs: [],
                deploymentLogs: [], taskAndOtherLogs: [], dueJiraCount: 0, dueJiras: []
            };
        }
        allJiras.forEach(jira => {
            if (jira.dueDate) {
                const dueDate = new Date(jira.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
                    const dateKey = dueDate.toISOString().split('T')[0];
                    if (dailySummary[dateKey]) {
                        dailySummary[dateKey].dueJiraCount += 1;
                        dailySummary[dateKey].dueJiras.push({
                            jiraNumber: jira.jiraNumber, description: jira.description, summary: jira.summary, dueDate: jira.dueDate,
                            logs: jira.dailyLogs.filter(log => {
                                const logDate = new Date(log.logDate);
                                logDate.setHours(0,0,0,0);
                                return logDate.getTime() === dueDate.getTime();
                            })
                        });
                    }
                }
            }
            jira.dailyLogs.forEach(log => {
                const logDate = new Date(log.logDate);
                logDate.setHours(0, 0, 0, 0);
                if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                    const dateKey = logDate.toISOString().split('T')[0];
                    if (!dailySummary[dateKey]) { /* Failsafe */ }
                    const hours = parseFloat(log.timeSpent || 0);
                    dailySummary[dateKey].totalHours += hours;
                    monthlyHours += hours;
                    const isJiraLog = jira.jiraNumber && jira.jiraNumber.trim() !== '';
                    const isDeploy = (log.taskDescription?.toLowerCase().includes('deploy production') || log.taskDescription?.toLowerCase().includes('deploy prod') || log.taskDescription?.toLowerCase().includes('deploy pre production') || log.taskDescription?.toLowerCase().includes('deploy preprod'));
                    const logEntry = { type: isJiraLog ? (isDeploy ? 'Deployment (Jira)' : 'Task (Jira)') : 'Non-Jira', jiraNumber: jira.jiraNumber, description: log.taskDescription, hours: hours, isDeploy: isDeploy, logDate: log.logDate };
                    dailySummary[dateKey].allLogs.push(logEntry);
                    if (isDeploy) {
                        dailySummary[dateKey].deploymentLogCount += 1;
                        dailySummary[dateKey].totalDeploymentHours += hours;
                        dailySummary[dateKey].deploymentLogs.push(logEntry);
                        const descriptionLower = log.taskDescription?.toLowerCase() || '';
                        if (descriptionLower.includes('deploy production') || descriptionLower.includes('deploy prod')) {
                            dailySummary[dateKey].deploymentProductionCount += 1;
                        } else if (descriptionLower.includes('deploy pre production') || descriptionLower.includes('deploy preprod')) {
                            dailySummary[dateKey].deploymentPreProductionCount += 1;
                        }
                    } else {
                        dailySummary[dateKey].taskLogCount += 1;
                        dailySummary[dateKey].taskAndOtherLogs.push(logEntry);
                    }
                }
            });
        });
        Object.keys(dailySummary).forEach(dateKey => {
            dailySummary[dateKey].allLogs.sort((a, b) => {
                if (a.isDeploy && !b.isDeploy) return -1; if (!a.isDeploy && b.isDeploy) return 1;
                if (a.type.includes('Deployment') && !b.type.includes('Deployment')) return -1; if (!a.type.includes('Deployment') && b.type.includes('Deployment')) return 1;
                return (a.jiraNumber || a.description).localeCompare(b.jiraNumber || b.description);
            });
        });
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) { days.push(null); }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateKey = date.toISOString().split('T')[0];
            days.push({ date: date, dayOfMonth: i, summary: dailySummary[dateKey] });
        }
        return { days, totalMonthlyHours: monthlyHours };
    }, [currentDate, allJiras, currentMonth, currentYear]);

    const goToPreviousMonth = useCallback(() => { setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1))); }, []);
    const goToNextMonth = useCallback(() => { setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1))); }, []);
    
    const openCalendarDetailModal = (daySummary, date) => {
        const modalTitle = `Work Log for ${formatDate(date)}`;
        setCalendarModalTitle(modalTitle);
        setCalendarModalDailySummary(daySummary);
        setShowCalendarDetailModal(true);
    };
    const closeCalendarDetailModal = () => { setShowCalendarDetailModal(false); };
    // --- END OF LOGIC SECTION ---


    // --- UI / RENDER SECTION (MODIFIED) ---
    return (
        <div className="bg-white p-4 md:p-6 border border-gray-300">
            <h2 className="text-xl font-light mb-2 text-black">Task Calendar</h2>
            <p className="text-sm text-gray-600 mb-4">Summary of hours logged per day.</p>
            
            <div className="flex justify-between items-center mb-4">
                <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-full text-black"><FontAwesomeIcon icon={faChevronLeft} /></button>
                <h3 className="text-xl font-semibold text-black">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-black"><FontAwesomeIcon icon={faChevronRight} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm font-light text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-1">{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="aspect-square bg-gray-50 rounded-md"></div>;

                    const { summary } = day;
                    const hasActivity = summary.totalHours > 0 || summary.dueJiraCount > 0;
                    const isToday = day.date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={index}
                            className={`
                                aspect-square flex flex-col justify-between p-2 rounded-md transition-colors
                                ${isToday ? 'bg-gray-100 border-2 border-black' : 'bg-white border border-gray-200'}
                                ${hasActivity ? 'cursor-pointer hover:bg-gray-200' : ''}
                            `}
                            onClick={() => hasActivity && openCalendarDetailModal(summary, day.date)}
                        >
                            <span className={`self-end text-xs font-medium ${isToday ? 'text-black' : 'text-gray-400'}`}>
                                {day.dayOfMonth}
                            </span>
                            
                            <div className="flex flex-col items-center justify-end flex-grow">
                                {summary.totalHours > 0 && (
                                    <div className=" font-light text-black leading-none">
                                        {summary.totalHours.toFixed(1)}<span className="text-xs">h</span>
                                    </div>
                                )}
                                <div className="flex space-x-1.5 mt-2 h-3">
                                    {summary.taskLogCount > 0 && <div className="w-2 h-2 bg-black rounded-full" title="Tasks Logged"></div>}
                                    {summary.deploymentPreProductionCount > 0 && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Pre-Prod Deploy"></div>}
                                    {summary.deploymentProductionCount > 0 && <div className="w-2 h-2 bg-red-500 rounded-full" title="Production Deploy"></div>}
                                    {summary.dueJiraCount > 0 && <div className="w-2 h-2 bg-green-500 rounded-full" title="Due Date"></div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center mt-6">
                <p className="text-lg font-light text-black">Total Monthly {totalMonthlyHours.toFixed(2)} hrs.</p>
            </div>

            {showCalendarDetailModal && (
                <CalendarDetailModal
                    isOpen={showCalendarDetailModal}
                    onClose={closeCalendarDetailModal}
                    title={calendarModalTitle}
                    dailySummary={calendarModalDailySummary}
                />
            )}
        </div>
    );
}