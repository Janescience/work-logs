// components/WorkLogCalendar.js
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faRocket, faCalendarCheck,faListCheck } from '@fortawesome/free-solid-svg-icons';
import CalendarDetailModal from '@/components/CalendarDetailModal'; // Import DetailModal for showing details

// Helper function to format date to DD-MM-YYYY
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

export default function WorkLogCalendar({ allJiras }) {
    const [currentDate, setCurrentDate] = useState(new Date()); // State for current month/year displayed

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // State for the detail modal
    const [showCalendarDetailModal, setShowCalendarDetailModal] = useState(false);
    const [calendarModalDailySummary, setCalendarModalDailySummary] = useState({}); // Stores the entire daily summary for the modal
    const [calendarModalTitle, setCalendarModalTitle] = useState('');


    // Calculate calendar data for the displayed month
    const { days: calendarDays, totalMonthlyHours } = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        
        const dailySummary = {};
        let monthlyHours = 0;

        // Initialize dailySummary for all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateKey = date.toISOString().split('T')[0];
            dailySummary[dateKey] = {
                totalHours: 0,
                taskLogCount: 0,
                totalDeploymentHours: 0,
                deploymentLogCount: 0,
                deploymentProductionCount: 0,
                deploymentPreProductionCount: 0,
                allLogs: [], // All logs for the day (for modal)
                deploymentLogs: [], // Only deployment logs (for modal section)
                taskAndOtherLogs: [], // Non-deployment and non-Jira logs (for modal section)
                dueJiraCount: 0,
                dueJiras: [] // Due Jiras with their associated logs
            };
        }


        allJiras.forEach(jira => {
            // Process due dates
            if (jira.dueDate) {
                const dueDate = new Date(jira.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
                    const dateKey = dueDate.toISOString().split('T')[0];
                    if (dailySummary[dateKey]) { 
                        dailySummary[dateKey].dueJiraCount += 1;
                        dailySummary[dateKey].dueJiras.push({
                            jiraNumber: jira.jiraNumber,
                            description: jira.description,
                            summary: jira.summary, 
                            dueDate: jira.dueDate,
                            // Filter logs that belong to this specific Jira and are on the due date
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
                // Normalize logDate to start of the day for comparison
                logDate.setHours(0, 0, 0, 0); 
                
                // Only process logs within the current displayed month
                if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                    const dateKey = logDate.toISOString().split('T')[0]; //YYYY-MM-DD
                    
                    // This check is mainly for robustness, as we pre-initialize dailySummary
                    if (!dailySummary[dateKey]) {
                        dailySummary[dateKey] = {
                            totalHours: 0,
                            taskLogCount: 0,
                            totalDeploymentHours: 0,
                            deploymentLogCount: 0,
                            deploymentProductionCount: 0,
                            deploymentPreProductionCount: 0,
                            allLogs: [], 
                            deploymentLogs: [],
                            taskAndOtherLogs: [],
                            dueJiraCount: 0, 
                            dueJiras: []
                        };
                    }

                    const hours = parseFloat(log.timeSpent || 0);
                    dailySummary[dateKey].totalHours += hours;
                    monthlyHours += hours; 

                    const isJiraLog = jira.jiraNumber && jira.jiraNumber.trim() !== '';
                    const isDeploy = (log.taskDescription?.toLowerCase().includes('deploy production') || log.taskDescription?.toLowerCase().includes('deploy prod') || log.taskDescription?.toLowerCase().includes('deploy pre production') || log.taskDescription?.toLowerCase().includes('deploy preprod'));

                    const logEntry = {
                        type: isJiraLog ? (isDeploy ? 'Deployment (Jira)' : 'Task (Jira)') : 'Non-Jira', 
                        jiraNumber: jira.jiraNumber,
                        description: log.taskDescription,
                        hours: hours,
                        isDeploy: isDeploy,
                        logDate: log.logDate 
                    };

                    dailySummary[dateKey].allLogs.push(logEntry);

                    if (isDeploy) {
                        dailySummary[dateKey].deploymentLogCount += 1;
                        dailySummary[dateKey].totalDeploymentHours += hours;
                        dailySummary[dateKey].deploymentLogs.push(logEntry); // Add to deployment specific list

                        const descriptionLower = log.taskDescription?.toLowerCase() || '';
                        const isDeployProduction = descriptionLower.includes('deploy production') || descriptionLower.includes('deploy prod');
                        const isDeployPreProduction = descriptionLower.includes('deploy pre production') || descriptionLower.includes('deploy preprod');

                        if (isDeployProduction) {
                            dailySummary[dateKey].deploymentProductionCount += 1;
                        } else if (isDeployPreProduction) {
                            dailySummary[dateKey].deploymentPreProductionCount += 1;
                        }
                    } else {
                        // This is a non-deployment log (either Jira Task or Non-Jira)
                        dailySummary[dateKey].taskLogCount += 1; 
                        dailySummary[dateKey].taskAndOtherLogs.push(logEntry); // Add to tasks/other specific list
                    }
                }
            });
        });

        // Sort allLogs for consistent modal display
        Object.keys(dailySummary).forEach(dateKey => {
            dailySummary[dateKey].allLogs.sort((a, b) => {
                if (a.isDeploy && !b.isDeploy) return -1;
                if (!a.isDeploy && b.isDeploy) return 1;
                // Then sort by type (e.g., 'Task (Jira)' before 'Non-Jira')
                if (a.type.includes('Deployment') && !b.type.includes('Deployment')) return -1;
                if (!a.type.includes('Deployment') && b.type.includes('Deployment')) return 1;
                return (a.jiraNumber || a.description).localeCompare(b.jiraNumber || b.description);
            });
        });


        const days = [];
        // Add empty cells for days before the 1st of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateKey = date.toISOString().split('T')[0];
            days.push({
                date: date,
                dayOfMonth: i,
                summary: dailySummary[dateKey] // Pass the full summary object
            });
        }

        return { days, totalMonthlyHours: monthlyHours }; 
    }, [currentDate, allJiras, currentMonth, currentYear]); // Re-calculate if date or allJiras changes

    const goToPreviousMonth = useCallback(() => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }, []);

    // Changed to English month name format
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // English short day names

    // Function to open the detail modal
    const openCalendarDetailModal = (daySummary, date) => {
        // Updated modal title to include total hours
        const modalTitle = `Work Log for ${formatDate(date)}`;
        
        setCalendarModalTitle(modalTitle);
        setCalendarModalDailySummary(daySummary); // Pass the entire summary object
        setShowCalendarDetailModal(true);
    };

    const closeCalendarDetailModal = () => {
        setShowCalendarDetailModal(false);
        setCalendarModalDailySummary({});
        setCalendarModalTitle('');
    };


    return (
        <div className="bg-white p-6">
            <h2 className="text-xl font-bold mb-2 text-black font-light">Task Calendar</h2>
            <p className="text-sm text-gray-600 mb-4">Summary of hours logged per day</p>
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-full text-black" title="Previous Month">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <h3 className="text-xl font-light text-black">{monthName}</h3>
                <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-black" title="Next Month">
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-light text-gray-600 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="py-1">{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const hasWork = day && day.summary.totalHours > 0;
                    const hasDueDates = day && day.summary.dueJiraCount > 0; 
                    const isToday = day && day.date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={index}
                            className={`
                                p-2 border border-gray-200 rounded-md flex flex-col items-center justify-start h-32 relative overflow-hidden
                                ${day ? 'bg-gray-50' : 'bg-gray-100'} /* Differentiate empty cells */
                                ${isToday ? 'ring-2 ring-black' : ''} /* Highlight today */
                                ${hasWork || hasDueDates ? 'cursor-pointer hover:bg-gray-200' : ''} /* Add cursor and hover for clickable cells if has work or due dates */
                            `}
                            onClick={() => day && (hasWork || hasDueDates) && openCalendarDetailModal(day.summary, day.date)} // Click to open modal if work or due dates exist
                        >
                            <span className="font-mono text-gray-900 text-xs">{day ? day.dayOfMonth : ''}</span>
                            
                            {day && (hasWork || hasDueDates) && ( // Only show content if there's work or due dates
                                <div className="w-full text-xs"> {/* Added w-full and px-1 for alignment */}
                                    {/* Total Hours Row */}
                                    {day.summary.totalHours > 0 && ( // Only show if total hours > 0
                                        <div className="flex justify-center items-center mb-0.5 ">
                                            <span className="font-light bg-gray-600 rounded-full px-2 py-0.5 text-white">{day.summary.totalHours} h</span>
                                        </div>
                                    )}
                                    
                                    {/* Deploy Row (if any deployments) */}
                                    {day.summary.deploymentProductionCount > 0 && (
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-light text-gray-700"><FontAwesomeIcon icon={faRocket} className="mr-1 text-black"/>PROD</span>
                                            <span className="font-light text-black">
                                                {day.summary.deploymentProductionCount}
                                            </span>
                                        </div>
                                    )}
                                    {day.summary.deploymentPreProductionCount > 0 && (
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-light text-gray-700"><FontAwesomeIcon icon={faRocket} className="mr-1 text-gray-600"/>PREPROD</span>
                                            <span className="font-light text-black">
                                                {day.summary.deploymentPreProductionCount}
                                            </span>
                                        </div>
                                    )}

                                    {/* Task Row (if any tasks) */}
                                    {day.summary.taskLogCount > 0 && (
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-light text-gray-700"><FontAwesomeIcon icon={faListCheck} className="mr-1 text-black"/>Task</span>
                                            <span className="font-light text-gray-700">
                                                {day.summary.taskLogCount}
                                            </span>
                                        </div>
                                    )}

                                    {/* Due Row (if any due dates) */}
                                    {hasDueDates && (
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-light text-gray-700"><FontAwesomeIcon icon={faCalendarCheck} className="mr-1"/>Due</span>
                                            <span className="font-mono text-gray-700">
                                                {day.summary.dueJiraCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Total Monthly Hours Display */}
            <div className="text-center mt-4 pt-4 ">
                <p className="text-lg font-light text-black">Total Monthly {totalMonthlyHours} hrs.</p>
            </div>

            {/* Detail Modal for calendar day */}
            {showCalendarDetailModal && (
                <CalendarDetailModal
                    isOpen={showCalendarDetailModal}
                    onClose={closeCalendarDetailModal}
                    title={calendarModalTitle}
                    dailySummary={calendarModalDailySummary} // Pass the entire summary
                />
            )}
        </div>
    );
}