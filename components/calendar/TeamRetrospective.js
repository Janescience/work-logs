// components/TeamRetrospective.js
'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faLightbulb, faStar, faProjectDiagram, faCogs } from '@fortawesome/free-solid-svg-icons';

const getAvatarUrl = (username) => {
    if (!username) return 'https://placehold.co/24x24/cccccc/ffffff?text=NA';
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
};

const TeamRetrospective = ({ teamData }) => {
    const retroData = useMemo(() => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthIndex = lastMonth.getMonth();
        const lastMonthYear = lastMonth.getFullYear();

        const serviceHours = {};
        const projectHours = {};
        const memberHours = {};
        const taskTypeHours = { 'Develop': 0, 'Deploy': 0, 'Meeting': 0, 'Support': 0, 'Other': 0 };

        Object.values(teamData).forEach(({ memberInfo, jiras }) => {
            if (!memberInfo) return;
            memberHours[memberInfo.username] = memberHours[memberInfo.username] || 0;

            jiras.forEach(jira => {
                jira.dailyLogs.forEach(log => {
                    const logDate = new Date(log.logDate);
                    if (logDate.getMonth() === lastMonthIndex && logDate.getFullYear() === lastMonthYear) {
                        const hours = parseFloat(log.timeSpent || 0);
                        
                        // Aggregate hours
                        if (jira.serviceName) {
                            serviceHours[jira.serviceName] = (serviceHours[jira.serviceName] || 0) + hours;
                        }
                        if (jira.projectName) {
                            projectHours[jira.projectName] = (projectHours[jira.projectName] || 0) + hours;
                        }
                        memberHours[memberInfo.username] += hours;

                        // Task Type Analysis
                        const desc = (log.taskDescription || '').toLowerCase();
                        if (desc.includes('deploy')) taskTypeHours['Deploy'] += hours;
                        else if (desc.includes('develop') || desc.includes('code')) taskTypeHours['Develop'] += hours;
                        else if (desc.includes('meeting') || desc.includes('discuss')) taskTypeHours['Meeting'] += hours;
                        else if (desc.includes('support') || desc.includes('fix')) taskTypeHours['Support'] += hours;
                        else taskTypeHours['Other'] += hours;
                    }
                });
            });
        });

        const sortedServices = Object.entries(serviceHours).sort(([,a],[,b]) => b-a).slice(0, 3);
        const sortedProjects = Object.entries(projectHours).sort(([,a],[,b]) => b-a).slice(0, 3);
        const mostActiveMember = Object.entries(memberHours).sort(([,a],[,b]) => b-a)[0] || [null, 0];

        return {
            monthName: lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            topServices: sortedServices,
            topProjects: sortedProjects,
            taskTypeHours,
            mostActiveMember: {
                name: mostActiveMember[0],
                hours: mostActiveMember[1]
            }
        };

    }, [teamData]);

    if(retroData.topServices.length === 0 && retroData.topProjects.length === 0) {
        return null; // Don't render if there's no data for last month
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6">
            <h3 className="font-semibold text-gray-800 flex items-center mb-4 text-base">
                <FontAwesomeIcon icon={faLightbulb} className="mr-3 text-gray-400" />
                Monthly Retrospective ({retroData.monthName})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Top Projects/Services */}
                <div className="space-y-4">
                    <div className="flex items-center text-sm font-medium text-gray-600">
                        <FontAwesomeIcon icon={faProjectDiagram} className="mr-2"/>
                        Top Projects
                    </div>
                    <ul className="space-y-2">
                        {retroData.topProjects.map(([name, hours]) => (
                            <li key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-800 truncate" title={name}>{name}</span>
                                <span className="font-bold text-black">{hours.toFixed(1)} hrs</span>
                            </li>
                        ))}
                    </ul>
                     <div className="flex items-center text-sm font-medium text-gray-600">
                        <FontAwesomeIcon icon={faCogs} className="mr-2"/>
                        Top Services
                    </div>
                     <ul className="space-y-2">
                        {retroData.topServices.map(([name, hours]) => (
                            <li key={name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-800">{name}</span>
                                <span className="font-bold text-black">{hours.toFixed(1)} hrs</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Task Type Breakdown */}
                <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-gray-600 mb-2">
                         <FontAwesomeIcon icon={faChartPie} className="mr-2"/>
                        Task Type Breakdown
                    </div>
                    {Object.entries(retroData.taskTypeHours).map(([type, hours]) => (
                        <div key={type} className="text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-700">{type}</span>
                                <span className="text-black font-semibold">{hours.toFixed(1)} hrs</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-gray-600 h-1.5 rounded-full" style={{width: `${(hours / (retroData.mostActiveMember.hours || 1)) * 100}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Most Active Member */}
                <div className="text-center bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-sm font-medium text-gray-600 mb-3">
                        <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500"/>
                        Top Contributor
                    </div>
                    {retroData.mostActiveMember.name ? (
                        <>
                            <img src={getAvatarUrl(retroData.mostActiveMember.name)} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-yellow-400"/>
                            <div className="font-bold text-lg text-black">{retroData.mostActiveMember.name}</div>
                            <div className="text-gray-600 text-sm">{retroData.mostActiveMember.hours.toFixed(1)} hours logged</div>
                        </>
                    ): (
                        <p className="text-gray-500 text-sm">No activity last month.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TeamRetrospective;