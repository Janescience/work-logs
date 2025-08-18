// app/(auth)/it-lead-summary/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, faProjectDiagram, faUsers, faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { 
  LoadingSpinner, ErrorMessage, PageHeader, 
  TabNavigation, SummaryTable, TeamGrid, Button, Select
} from '@/components/ui';
import { YearlySummaryChart } from '@/components/reports';

const ProjectSummaryTable = ({ data }) => {
    const columns = [
        { key: 'name', title: 'Summary', align: 'left' },
        { key: 'nonCore', title: 'Non-Core', align: 'right' },
        { key: 'core', title: 'Core', align: 'right' },
        { key: 'total', title: 'Total', align: 'right' }
    ];

    const calculateGroupTotal = (group) => {
        return group.projects.reduce((acc, proj) => {
            acc.total += proj.totalHours;
            acc.nonCore += proj.nonCoreHours;
            acc.core += proj.coreHours;
            return acc;
        }, { total: 0, nonCore: 0, core: 0 });
    };

    const calculateGrandTotal = (data) => {
        return data.reduce((acc, group) => {
            const groupTotal = calculateGroupTotal(group);
            acc.total += groupTotal.total;
            acc.nonCore += groupTotal.nonCore;
            acc.core += groupTotal.core;
            return acc;
        }, { total: 0, nonCore: 0, core: 0 });
    };

    const renderGroupHeader = (group) => group._id;

    const renderRow = (project) => (
        <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">{project.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{project.nonCoreHours.toFixed(1)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{project.coreHours.toFixed(1)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">{project.totalHours.toFixed(1)}</td>
        </>
    );

    // Transform data to match SummaryTable format
    const transformedData = data.map(group => ({
        ...group,
        items: group.projects.sort((a, b) => b.totalHours - a.totalHours)
    }));

    return (
        <SummaryTable
            title="Project Performance"
            data={transformedData}
            columns={columns}
            calculateGroupTotal={calculateGroupTotal}
            calculateGrandTotal={calculateGrandTotal}
            renderGroupHeader={renderGroupHeader}
            renderRow={renderRow}
            emptyMessage="No project data for the selected period."
        />
    );
};

const IndividualSummary = ({ data }) => {
    const capacity = 22 * 8;
    const teams = [
        { type: 'Non-Core', label: 'NON-CORE' },
        { type: 'Core', label: 'CORE' }
    ];

    return (
        <TeamGrid
            title="Individual Efforts"
            data={data}
            teams={teams}
            capacity={capacity}
            emptyMessage="No members found."
        />
    );
};

const WorkDoneSummaryTable = ({ summaryData, selectedMonth, selectedYear }) => {
    if (!summaryData || !summaryData.individualSummary) {
        return (
            <div className="bg-white border border-black">
                <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-light text-black">Work Done Summary</h2>
                </div>
                <div className="p-6 text-center text-gray-500">
                    No data available for the selected period
                </div>
            </div>
        );
    }

    // Process data to create summary by project
    const projectSummary = {};
    let totalHours = 0;

    summaryData.individualSummary.forEach(member => {
        member.projects?.forEach(project => {
            const projectName = project.projectName || 'Others';
            const hours = project.totalHours || 0;
            
            if (!projectSummary[projectName]) {
                projectSummary[projectName] = 0;
            }
            projectSummary[projectName] += hours;
            totalHours += hours;
        });
    });

    // Convert to array and sort by hours (descending)
    const sortedProjects = Object.entries(projectSummary)
        .map(([name, hours]) => ({
            name,
            hours,
            percentage: totalHours > 0 ? (hours / totalHours * 100) : 0
        }))
        .sort((a, b) => b.hours - a.hours);

    // Group projects by category
    const bauProjects = sortedProjects.filter(p => 
        p.name.toLowerCase().includes('bau') || 
        p.name.toLowerCase().includes('maintenance')
    );
    
    const otherProjects = sortedProjects.filter(p => 
        !p.name.toLowerCase().includes('bau') && 
        !p.name.toLowerCase().includes('maintenance') &&
        p.name !== 'Others'
    );

    const uncategorizedProjects = sortedProjects.filter(p => p.name === 'Others');

    const monthName = new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' });

    return (
        <div className="bg-white border border-black">
            <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-light text-black">
                    Work Done Summary - {monthName} {selectedYear}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Total Hours: {totalHours.toFixed(1)} | Projects: {sortedProjects.length}
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Project / Task
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hours
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                % of Month
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                % of Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* BAU Section */}
                        {bauProjects.length > 0 && (
                            <>
                                <tr className="bg-gray-100">
                                    <td colSpan="4" className="px-6 py-2 text-sm font-medium text-gray-700 uppercase">
                                        BAU & Maintenance
                                    </td>
                                </tr>
                                {bauProjects.map((project, index) => (
                                    <tr key={`bau-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-8">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                            {project.hours.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}

                        {/* Other Projects Section */}
                        {otherProjects.length > 0 && (
                            <>
                                <tr className="bg-gray-100">
                                    <td colSpan="4" className="px-6 py-2 text-sm font-medium text-gray-700 uppercase">
                                        Development Projects
                                    </td>
                                </tr>
                                {otherProjects.map((project, index) => (
                                    <tr key={`dev-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900 pl-8">
                                            <div className="break-words max-w-sm">
                                                {project.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                            {project.hours.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}

                        {/* Uncategorized Section */}
                        {uncategorizedProjects.length > 0 && (
                            <>
                                <tr className="bg-gray-100">
                                    <td colSpan="4" className="px-6 py-2 text-sm font-medium text-gray-700 uppercase">
                                        Others
                                    </td>
                                </tr>
                                {uncategorizedProjects.map((project, index) => (
                                    <tr key={`other-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-8">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                            {project.hours.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600">
                                            {project.percentage.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}

                        {/* Total Row */}
                        <tr className="bg-black text-white font-medium">
                            <td className="px-6 py-3 text-sm">
                                TOTAL
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono">
                                {totalHours.toFixed(1)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono">
                                100.00%
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono">
                                100.00%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function ITLeadSummaryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [summaryData, setSummaryData] = useState(null);
    const [yearlyData, setYearlyData] = useState([]); // 2. ADD STATE FOR YEARLY CHART DATA
    const [loading, setLoading] = useState(true);
    const [loadingChart, setLoadingChart] = useState(true); // 3. ADD LOADING STATE FOR CHART
    const [error, setError] = useState('');
    
    const [date, setDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const [activeTab, setActiveTab] = useState('projects'); // projects, teams, summary

    useEffect(() => {
        if (status === 'authenticated') {
            if (!session.user.roles?.includes('IT LEAD')) {
                router.push('/denied');
            } else {
                fetchMonthlyData(date.year, date.month);
                fetchYearlyData(date.year);            
            }
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, session]);

    const fetchMonthlyData = async (year, month) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/summary/it-lead?year=${year}&month=${month}`);
            if (!res.ok) throw new Error('Failed to fetch monthly data');
            const data = await res.json();
            setSummaryData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchYearlyData = async (year) => {
        setLoadingChart(true);
        try {
            const res = await fetch(`/api/summary/it-lead/yearly?year=${year}`);
            if (!res.ok) throw new Error('Failed to fetch yearly data');
            const data = await res.json();
            setYearlyData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChart(false);
        }
    };


   

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newDate = { ...date, [name]: parseInt(value, 10) };
        setDate(newDate);

        if (name === 'year') {
            fetchYearlyData(newDate.year);
        }
        fetchMonthlyData(newDate.year, newDate.month);
    };


    if (status === 'loading' || !summaryData && loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-black">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
                    <span className="text-lg font-light">Loading Dashboard...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 text-black">
            <div className="mx-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="mx-auto px-6 py-8">
                        <PageHeader title="BACKLOG" />
                        
                        {/* Date Filters - Centered */}
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Select
                                value={date.month}
                                onChange={(e) => handleDateChange({ target: { name: 'month', value: e.target.value } })}
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    value: i + 1,
                                    label: new Date(0, i).toLocaleString('default', { month: 'long' })
                                }))}
                            />
                            <Select
                                value={date.year}
                                onChange={(e) => handleDateChange({ target: { name: 'year', value: e.target.value } })}
                                options={Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return { value: year, label: year.toString() };
                                })}
                            />
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-6">
                        <TabNavigation
                            tabs={[
                                {
                                    id: 'projects',
                                    label: 'Projects',
                                    icon: <FontAwesomeIcon icon={faProjectDiagram} className="text-xs" />
                                },
                                {
                                    id: 'teams',
                                    label: 'Teams',
                                    icon: <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                },
                                {
                                    id: 'summary',
                                    label: 'Work Done Summary',
                                    icon: <FontAwesomeIcon icon={faChartBar} className="text-xs" />
                                }
                            ]}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-20">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-gray-600 mb-4" />
                            <p className="text-gray-600">Loading dashboard data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 text-xl" /> 
                            <div>
                                <h3 className="font-semibold">Error Loading Data</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Projects Tab */}
                            {activeTab === 'projects' && (
                                <div className="space-y-6">
                                    <YearlySummaryChart 
                                        data={yearlyData} 
                                        loading={loadingChart}
                                        onMonthClick={(monthData) => {
                                            setDate(prev => ({ ...prev, month: monthData.month }));
                                            fetchMonthlyData(date.year, monthData.month);
                                        }}
                                    />
                                    <ProjectSummaryTable data={summaryData.projectSummary || []} />
                                </div>
                            )}

                            {/* Teams Tab */}
                            {activeTab === 'teams' && (
                                <div className="space-y-4">
                                    {/* Team Overview Stats */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h2 className="text-lg font-light text-black">Team Overview</h2>
                                        </div>
                                        <div className="p-4">
                                            {(() => {
                                                const totalMembers = summaryData.individualSummary?.length || 0;
                                                const totalHours = summaryData.individualSummary?.reduce((sum, m) => sum + (m.totalHours || 0), 0) || 0;
                                                const coreMembers = summaryData.individualSummary?.filter(m => m.user?.type === 'Core').length || 0;
                                                const nonCoreMembers = summaryData.individualSummary?.filter(m => m.user?.type === 'Non-Core').length || 0;
                                                const avgHoursPerMember = totalMembers > 0 ? totalHours / totalMembers : 0;
                                                
                                                return (
                                                    <div className="grid grid-cols-5 gap-3">
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-xl font-light text-black">{totalMembers}</div>
                                                            <p className="text-xs text-gray-600">Total Members</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-xl font-light text-black">{coreMembers}</div>
                                                            <p className="text-xs text-gray-600">Core Team</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-xl font-light text-black">{nonCoreMembers}</div>
                                                            <p className="text-xs text-gray-600">Non-Core Team</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-xl font-light text-black">{totalHours.toFixed(0)}</div>
                                                            <p className="text-xs text-gray-600">Total Hours</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-xl font-light text-black">{avgHoursPerMember.toFixed(0)}</div>
                                                            <p className="text-xs text-gray-600">Avg Hours/Member</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Individual Performance - Minimal */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h2 className="text-lg font-light text-black">Individual Performance</h2>
                                        </div>
                                        <div className="p-4">
                                            {(() => {
                                                const capacity = 22 * 8; // 176 hours per month
                                                
                                                // Use individualSummary data, ensure all have totalHours
                                                const allMembers = (summaryData.individualSummary || []).map(item => ({
                                                    ...item,
                                                    totalHours: item.totalHours || 0
                                                }));
                                                
                                                const coreTeam = allMembers.filter(item => item.user?.type === 'Core');
                                                const nonCoreTeam = allMembers.filter(item => item.user?.type === 'Non-Core');
                                                
                                                const TeamSection = ({ title, members, bgColor = 'bg-white' }) => (
                                                    <div className={`border border-gray-200 ${bgColor}`}>
                                                        <div className="p-3 border-b border-gray-200">
                                                            <h3 className="text-sm font-medium text-black">{title} ({members.length})</h3>
                                                        </div>
                                                        <div className="p-3">
                                                            {members.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {members
                                                                        .sort((a, b) => (b.totalHours || 0) - (a.totalHours || 0))
                                                                        .map(item => {
                                                                            const totalHours = item.totalHours || 0;
                                                                            const utilizationRate = (totalHours / capacity) * 100;
                                                                            const hasLogs = totalHours > 0;
                                                                            
                                                                            return (
                                                                                <div key={item.user._id} className={`flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0 ${!hasLogs ? 'bg-gray-50' : ''}`}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-8 h-8 ${hasLogs ? 'bg-gray-300' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                                                                                            <span className={`text-xs font-medium ${hasLogs ? 'text-black' : 'text-gray-500'}`}>
                                                                                                {(item.user.name || item.user.username).charAt(0).toUpperCase()}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className={`text-sm font-medium ${hasLogs ? 'text-black' : 'text-gray-600'}`}>
                                                                                                {item.user.name || item.user.username}
                                                                                                {!hasLogs && <span className="text-xs text-red-500 ml-2">(No logs)</span>}
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-600">
                                                                                                {item.user.teamName || 'No Team'}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-right">
                                                                                            <div className={`text-sm font-light ${hasLogs ? 'text-black' : 'text-gray-500'}`}>
                                                                                                {totalHours.toFixed(0)}h
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-600">
                                                                                                {utilizationRate.toFixed(0)}% capacity
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                                                                                            <div 
                                                                                                className={`h-2 rounded-full ${
                                                                                                    !hasLogs ? 'bg-red-300' :
                                                                                                    utilizationRate >= 90 ? 'bg-black' :
                                                                                                    utilizationRate >= 70 ? 'bg-gray-600' :
                                                                                                    utilizationRate >= 50 ? 'bg-gray-400' : 'bg-gray-300'
                                                                                                }`}
                                                                                                style={{ width: `${Math.max(Math.min(utilizationRate, 100), hasLogs ? 0 : 2)}%` }}
                                                                                            ></div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            ) : (
                                                                <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} members found</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                                
                                                return (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <TeamSection title="Core Team" members={coreTeam} />
                                                        <TeamSection title="Non-Core Team" members={nonCoreTeam} />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Team Insights */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h2 className="text-lg font-light text-black">Team Insights</h2>
                                        </div>
                                        <div className="p-4">
                                            {(() => {
                                                const individualSummary = summaryData.individualSummary || [];
                                                const totalHours = individualSummary.reduce((sum, m) => sum + (m.totalHours || 0), 0);
                                                const capacity = individualSummary.length * 22 * 8;
                                                const utilizationRate = capacity > 0 ? (totalHours / capacity) * 100 : 0;
                                                
                                                const highPerformers = individualSummary.filter(m => {
                                                    const memberUtilization = ((m.totalHours || 0) / (22 * 8)) * 100;
                                                    return memberUtilization >= 80;
                                                }).length;
                                                
                                                const underutilized = individualSummary.filter(m => {
                                                    const memberUtilization = ((m.totalHours || 0) / (22 * 8)) * 100;
                                                    return memberUtilization < 50;
                                                }).length;
                                                
                                                return (
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-lg font-light text-black">{utilizationRate.toFixed(0)}%</div>
                                                            <p className="text-xs text-gray-600">Team Utilization</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-lg font-light text-black">{highPerformers}</div>
                                                            <p className="text-xs text-gray-600">High Performers (≥80%)</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-lg font-light text-black">{underutilized}</div>
                                                            <p className="text-xs text-gray-600">Underutilized (&lt;50%)</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className={`text-lg font-light ${
                                                                utilizationRate >= 80 ? 'text-black' :
                                                                utilizationRate >= 60 ? 'text-gray-600' : 'text-gray-400'
                                                            }`}>
                                                                {utilizationRate >= 80 ? 'Optimal' :
                                                                utilizationRate >= 60 ? 'Good' : 'Low'}
                                                            </div>
                                                            <p className="text-xs text-gray-600">Team Status</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Work Done Summary Tab */}
                            {activeTab === 'summary' && (
                                <div className="space-y-6">
                                    <WorkDoneSummaryTable 
                                        summaryData={summaryData} 
                                        selectedMonth={date.month}
                                        selectedYear={date.year}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}