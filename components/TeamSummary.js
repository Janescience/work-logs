// components/TeamSummary.js
'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarCheck, faFire, faExclamationTriangle, faBalanceScale, faPauseCircle } from '@fortawesome/free-solid-svg-icons';

// --- Helper Functions ---
const getAvatarUrl = (username) => {
    if (!username) return 'https://placehold.co/24x24/cccccc/ffffff?text=NA';
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
};

const getWorkingDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= lastDay; day++) {
        const d = new Date(year, month, day);
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
            workingDays++;
        }
    }
    return workingDays;
};

// --- Main Component ---
const TeamSummary = ({ teamData }) => {
    const summary = useMemo(() => {
        if (!teamData || Object.keys(teamData).length === 0) {
            return {
                totalLoggedHours: 0,
                totalCapacity: 0,
                utilization: 0,
                totalActiveJiras: 0,
                tasksByAssignee: [],
                upcomingDeadlines: [],
                staleTasks: [],
            };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);

        let totalLoggedHours = 0;
        const tasksByAssignee = {};
        const upcomingDeadlines = [];
        const staleTasks = [];
        const inactiveStatuses = ['done', 'closed', 'canceled', 'cancelled', 'deployed to production'];
        
        const allUsers = Object.values(teamData);

        allUsers.forEach(({ memberInfo, jiras }) => {
            if (!memberInfo) return;

            tasksByAssignee[memberInfo.username] = tasksByAssignee[memberInfo.username] || {
                username: memberInfo.username,
                activeTaskCount: 0,
            };

            if (jiras && Array.isArray(jiras)) {
                jiras.forEach(jira => {
                    // --- Calculations ---
                    const status = (jira.actualStatus || jira.jiraStatus || '').toLowerCase();
                    const isActive = !inactiveStatuses.some(inactive => status.includes(inactive));

                    // 1. Logged Hours
                    if (jira.dailyLogs && Array.isArray(jira.dailyLogs)) {
                        jira.dailyLogs.forEach(log => {
                            const logDate = new Date(log.logDate);
                            if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                                totalLoggedHours += parseFloat(log.timeSpent || 0);
                            }
                        });
                    }

                    if(isActive) {
                        // 2. Active Tasks
                        tasksByAssignee[memberInfo.username].activeTaskCount++;
                        
                        // 3. Upcoming Deadlines
                        if (jira.dueDate) {
                            const dueDate = new Date(jira.dueDate);
                            dueDate.setHours(0,0,0,0);
                            if(dueDate >= today && dueDate <= sevenDaysLater) {
                                const timeLeft = dueDate.getTime() - today.getTime();
                                const daysRemaining = Math.round(timeLeft / (1000 * 3600 * 24));
                                upcomingDeadlines.push({ ...jira, assignee: memberInfo.username, daysRemaining });
                            }
                        }

                        // 4. Stale Tasks
                        if (jira.dailyLogs && jira.dailyLogs.length > 0) {
                            const lastLogDate = new Date(Math.max(...jira.dailyLogs.map(log => new Date(log.logDate))));
                            const daysSinceLastLog = Math.floor((today - lastLogDate) / (1000 * 3600 * 24));
                            if (daysSinceLastLog > 3) {
                                staleTasks.push({ ...jira, assignee: memberInfo.username, daysSinceLastLog });
                            }
                        } else { // Task has no logs at all
                           const daysSinceCreation = Math.floor((today - new Date(jira.createdAt)) / (1000 * 3600 * 24));
                           if (daysSinceCreation > 3) {
                                staleTasks.push({ ...jira, assignee: memberInfo.username, daysSinceLastLog: daysSinceCreation });
                           }
                        }
                    }
                });
            }
        });

        // --- Post-processing ---
        const workingDays = getWorkingDaysInMonth();
        const totalCapacity = workingDays * 8 * allUsers.length;
        const utilization = totalCapacity > 0 ? Math.round((totalLoggedHours / totalCapacity) * 100) : 0;
        const totalActiveJiras = Object.values(tasksByAssignee).reduce((sum, user) => sum + user.activeTaskCount, 0);

        upcomingDeadlines.sort((a,b) => a.daysRemaining - b.daysRemaining);
        staleTasks.sort((a, b) => b.daysSinceLastLog - a.daysSinceLastLog);
        const tasksByAssigneeArray = Object.values(tasksByAssignee).sort((a,b) => b.activeTaskCount - a.activeTaskCount);

        return {
            totalLoggedHours,
            totalCapacity,
            utilization,
            totalActiveJiras,
            tasksByAssignee: tasksByAssigneeArray,
            upcomingDeadlines,
            staleTasks
        };

    }, [teamData]);

    const getUtilizationColor = (percentage) => {
        if (percentage > 95) return 'bg-red-500';
        if (percentage > 80) return 'bg-yellow-500';
        return 'bg-teal-500';
    };

    return (
        <div className="space-y-6">
            {/* --- Top Row Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Team Capacity */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center mb-4 text-base">
                        <FontAwesomeIcon icon={faBalanceScale} className="mr-3 text-gray-400" />
                        Team Capacity (Current Month)
                    </h3>
                    <div className="text-4xl font-light text-black">
                        {summary.totalLoggedHours.toFixed(1)}
                        <span className="text-xl text-gray-500 font-normal"> / {summary.totalCapacity} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 my-3">
                        <div 
                            className={`${getUtilizationColor(summary.utilization)} h-2.5 rounded-full transition-all duration-500`} 
                            style={{ width: `${summary.utilization}%` }}
                        ></div>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-700">{summary.utilization}% Utilization</div>
                </div>

                {/* Card 2: Workload Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center mb-4 text-base">
                        <FontAwesomeIcon icon={faUsers} className="mr-3 text-gray-400" />
                        Workload Distribution ({summary.totalActiveJiras} Tasks)
                    </h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {summary.tasksByAssignee.length > 0 ? (
                            summary.tasksByAssignee.map(user => (
                                <div key={user.username}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <div className="flex items-center">
                                            <img src={getAvatarUrl(user.username)} alt={user.username} className="w-6 h-6 rounded-full mr-2" />
                                            <span className="text-gray-700 font-medium">{user.username}</span>
                                        </div>
                                        <span className="font-bold text-black">{user.activeTaskCount}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div 
                                            className="bg-black h-1.5 rounded-full" 
                                            style={{ width: `${summary.totalActiveJiras > 0 ? (user.activeTaskCount / summary.totalActiveJiras) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No active tasks.</p>
                        )}
                    </div>
                </div>

                 {/* Card 3: Stale Tasks */}
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center mb-4 text-base">
                        <FontAwesomeIcon icon={faPauseCircle} className="mr-3 text-gray-400" />
                        Stale Tasks
                    </h3>
                    <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                        {summary.staleTasks.length > 0 ? (
                            summary.staleTasks.map(jira => (
                                <div key={jira._id} className="flex items-center justify-between p-1.5 rounded hover:bg-red-50">
                                    <div className="flex items-center overflow-hidden">
                                        <img src={getAvatarUrl(jira.assignee)} alt={jira.assignee} className="w-6 h-6 rounded-full mr-2" />
                                        <div className="overflow-hidden">
                                          <div className="font-mono text-xs text-black truncate">{jira.jiraNumber}</div>
                                          <p className="text-gray-600 text-xs truncate" title={jira.description}>{jira.description}</p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-xs whitespace-nowrap text-red-600">
                                        {jira.daysSinceLastLog}d ago
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No stale tasks. Great job!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Full-width Table for Deadlines --- */}
            {summary.upcomingDeadlines.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center mb-4 text-base">
                        <FontAwesomeIcon icon={faCalendarCheck} className="mr-3 text-gray-400" />
                        Approaching Deadlines
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-gray-500">
                                <tr>
                                    <th className="p-2 font-medium">Assignee</th>
                                    <th className="p-2 font-medium">Task</th>
                                    <th className="p-2 font-medium">Due</th>
                                </tr>
                            </thead>
                            <tbody>
                            {summary.upcomingDeadlines.map(jira => (
                                <tr key={jira._id} className="border-t border-gray-200">
                                    <td className="p-2 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={getAvatarUrl(jira.assignee)} alt={jira.assignee} className="w-7 h-7 rounded-full mr-3" />
                                            <span className="font-medium text-gray-800">{jira.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <div className="font-mono text-xs text-black">{jira.jiraNumber}</div>
                                        <p className="text-gray-600 text-xs truncate" title={jira.description}>{jira.description}</p>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">
                                        <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${jira.daysRemaining <= 1 ? 'text-red-800 bg-red-100' : 'text-amber-800 bg-amber-100'}`}>
                                            <FontAwesomeIcon icon={jira.daysRemaining <= 1 ? faFire : faExclamationTriangle} className="mr-1.5"/>
                                            {jira.daysRemaining === 0 ? 'Today' : `in ${jira.daysRemaining} day(s)`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamSummary;