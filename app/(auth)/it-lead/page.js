// app/(auth)/it-lead-summary/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, faUser, faChartBar, faExclamationTriangle,
  faTachometerAlt, faProjectDiagram, faUsers, faFileAlt,
  faBell, faRocket
} from '@fortawesome/free-solid-svg-icons';
import YearlySummaryChart from '@/components/YearlySummaryChart';
import ITLeadAlerts from '@/components/ITLeadAlerts';
import ResourceHeatmap from '@/components/ResourceHeatmap';
import TrendAnalysis from '@/components/TrendAnalysis';
import QuickActions from '@/components/QuickActions';
import AdvancedReportGenerator from '@/components/AdvancedReportGenerator';

// --- Helper Components (defined in the same file for simplicity) ---

const getAvatarUrl = (username) => `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

const ProjectSummaryTable = ({ data }) => {
    const grandTotal = data.reduce((acc, group) => {
        const groupTotal = group.projects.reduce((groupAcc, proj) => {
            groupAcc.total += proj.totalHours;
            groupAcc.nonCore += proj.nonCoreHours;
            groupAcc.core += proj.coreHours;
            return groupAcc;
        }, { total: 0, nonCore: 0, core: 0 });
        
        acc.total += groupTotal.total;
        acc.nonCore += groupTotal.nonCore;
        acc.core += groupTotal.core;
        return acc;
    }, { total: 0, nonCore: 0, core: 0 });

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-light text-black mb-4">Project Performance</h2>
            <div className="overflow-x-auto border border-black bg-white  p-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left  font-medium text-gray-800 uppercase tracking-wider">Summary</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-800 uppercase tracking-wider">Non-Core</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-800 uppercase tracking-wider">Core</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-800 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length > 0 ? data.map(group => {
                            const groupTotal = group.projects.reduce((acc, proj) => {
                                acc.total += proj.totalHours;
                                acc.nonCore += proj.nonCoreHours;
                                acc.core += proj.coreHours;
                                return acc;
                            }, { total: 0, nonCore: 0, core: 0 });

                            return (
                                <React.Fragment key={group._id}>
                                    <tr className="bg-gray-50">
                                        <td className="px-6 py-3 font-bold text-black" colSpan="4">{group._id}</td>
                                    </tr>
                                    {group.projects.sort((a,b) => b.totalHours - a.totalHours).map(proj => (
                                        <tr key={proj.name}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">{proj.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{proj.nonCoreHours.toFixed(1)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{proj.coreHours.toFixed(1)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">{proj.totalHours.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100">
                                        <td className="px-6 py-3 text-right font-bold text-black"></td>
                                        <td className="px-6 py-3 text-right font-bold text-black font-mono">{groupTotal.nonCore.toFixed(1)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-black font-mono">{groupTotal.core.toFixed(1)}</td>
                                        <td className="px-6 py-3 text-right font-extrabold text-black font-mono">{groupTotal.total.toFixed(1)}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">No project data for the selected period.</td>
                            </tr>
                        )}
                    </tbody>
                     <tfoot>
                        <tr className="bg-black text-white">
                            <td className="px-6 py-3 font-bold ">Grand Total</td>
                            <td className="px-6 py-3 text-right font-bold font-mono">{grandTotal.nonCore.toFixed(1)}</td>
                            <td className="px-6 py-3 text-right font-bold font-mono">{grandTotal.core.toFixed(1)}</td>
                            <td className="px-6 py-3 text-right font-bold font-mono">{grandTotal.total.toFixed(1)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// --- UPDATED IndividualSummary component ---
const IndividualSummary = ({ data }) => {
    const capacity = 22 * 8; 

    // FIX: Use the 'type' field from the user object to filter
    const nonCoreTeam = data.filter(item => item.user.type === 'Non-Core');
    const coreTeam = data.filter(item => item.user.type === 'Core');

    const MemberRow = ({ item }) => (
        <div className="flex items-center p-3 border-b border-gray-100 last:border-b-0">
            <img src={getAvatarUrl(item.user.username)} alt="avatar" className="w-10 h-10 rounded-full mr-4" />
            <div className="flex-grow">
                <div className="font-semibold text-black uppercase">{item.user.name ? item.user.name : item.user.username}</div>
                <div className="text-xs text-gray-500">{item.user.teamName || 'No Team Assigned'}</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-black h-1.5 rounded-full" style={{ width: `${Math.min((item.totalHours / capacity) * 100, 100)}%` }}></div>
                </div>
            </div>
            <div className="text-right ml-4 min-w-[80px]">
                <span className="text-xl font-light text-black">{item.totalHours.toFixed(1)}</span>
                <span className="text-sm text-gray-500">/{capacity}</span>
            </div>
        </div>
    );

    return (
         <div className="mb-8">
            <h2 className="text-2xl font-light text-black mb-4">Individual Efforts</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-black p-4 bg-white">
                    <h3 className="font-semibold mb-3 border-b pb-2">NON-CORE</h3>
                    <div className="space-y-1">
                       {nonCoreTeam.length > 0 ? nonCoreTeam.map(item => <MemberRow key={item.user._id} item={item} />) : <p className="text-center text-gray-500 py-4">No non-core members found.</p>}
                    </div>
                </div>
                <div className="border border-black p-4 bg-white">
                     <h3 className="font-semibold mb-3 border-b pb-2">CORE</h3>
                     <div className="space-y-1">
                        {coreTeam.length > 0 ? coreTeam.map(item => <MemberRow key={item.user._id} item={item} />) : <p className="text-center text-gray-500 py-4">No core members found.</p>}
                    </div>
                </div>
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
    const [activeTab, setActiveTab] = useState('overview'); // overview, projects, teams, reports
    const [showReportGenerator, setShowReportGenerator] = useState(false);

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

    const handleQuickAction = (actionType, data) => {
        switch (actionType) {
            case 'refresh_data':
                fetchMonthlyData(date.year, date.month);
                fetchYearlyData(date.year);
                break;
            case 'report_generated':
                console.log('Report generated:', data.type);
                break;
            case 'copied_to_clipboard':
                console.log('Copied to clipboard');
                break;
            case 'schedule_meeting':
                console.log('Opening calendar...');
                break;
            case 'send_notification':
                console.log('Sending notification...');
                break;
            case 'share_dashboard':
                console.log('Dashboard shared:', data.url);
                break;
            case 'open_advanced_reports':
                setShowReportGenerator(true);
                break;
            default:
                console.log('Action:', actionType, data);
        }
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
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-light text-black mb-2">IT Leadership Dashboard</h1>
                            <p className="text-gray-600">Comprehensive organizational performance and resource management</p>
                        </div>
                        
                        {/* Date Filters */}
                        <div className="flex items-center gap-4">
                            <select 
                                name="month" 
                                value={date.month} 
                                onChange={handleDateChange} 
                                className="px-3 py-2 text-black bg-white border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select 
                                name="year" 
                                value={date.year} 
                                onChange={handleDateChange} 
                                className="px-3 py-2 text-black bg-white border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-6 border-b border-gray-200 -mb-px">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'overview'
                                        ? 'border-black text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FontAwesomeIcon icon={faTachometerAlt} className="text-xs" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('projects')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'projects'
                                        ? 'border-black text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FontAwesomeIcon icon={faProjectDiagram} className="text-xs" />
                                Projects
                            </button>
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'teams'
                                        ? 'border-black text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                Teams
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'reports'
                                        ? 'border-black text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                                Reports
                            </button>
                        </nav>
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
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    {/* Key Metrics */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h2 className="text-lg font-light text-black">Key Metrics</h2>
                                        </div>
                                        <div className="p-4">
                                            {(() => {
                                                if (!summaryData) return null;
                                                
                                                const totalHours = summaryData.individualSummary?.reduce((sum, item) => sum + item.totalHours, 0) || 0;
                                                const totalTasks = summaryData.projectSummary?.reduce((sum, group) => 
                                                    sum + group.projects.reduce((pSum, proj) => pSum + (proj.activeTasks || 0), 0), 0) || 0;
                                                const totalProjects = summaryData.projectSummary?.reduce((sum, group) => sum + group.projects.length, 0) || 0;
                                                const teamSize = summaryData.individualSummary?.length || 0;
                                                
                                                return (
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-2xl font-light text-black">{totalHours.toFixed(0)}</div>
                                                            <p className="text-xs text-gray-600">Total Hours</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-2xl font-light text-black">{totalTasks}</div>
                                                            <p className="text-xs text-gray-600">Active Tasks</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-2xl font-light text-black">{totalProjects}</div>
                                                            <p className="text-xs text-gray-600">Projects</p>
                                                        </div>
                                                        <div className="text-center p-3 border border-gray-200">
                                                            <div className="text-2xl font-light text-black">{teamSize}</div>
                                                            <p className="text-xs text-gray-600">Team Members</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h2 className="text-lg font-light text-black">Alerts & Notifications</h2>
                                        </div>
                                        <div className="p-4">
                                            <ITLeadAlerts summaryData={summaryData} />
                                        </div>
                                    </div>

                                    {/* Trend Analysis - Minimal */}
                                    <div className="bg-white border border-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h3 className="text-base font-medium text-black">Performance Trends</h3>
                                        </div>
                                        <div className="p-4">
                                            <TrendAnalysis 
                                                yearlyData={yearlyData} 
                                                currentMonthData={summaryData}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

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

                            {/* Reports Tab */}
                            {activeTab === 'reports' && (
                                <div className="space-y-6">
                                    <QuickActions 
                                        summaryData={summaryData} 
                                        onAction={handleQuickAction}
                                    />
                                    <TrendAnalysis 
                                        yearlyData={yearlyData} 
                                        currentMonthData={summaryData}
                                    />
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <h2 className="text-2xl font-light text-black mb-4 flex items-center">
                                            <FontAwesomeIcon icon={faFileAlt} className="mr-3 text-gray-600" />
                                            Executive Reports & Analytics
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                <h3 className="font-semibold text-black mb-2">Advanced Generator</h3>
                                                <p className="text-sm text-gray-600 mb-3">Enterprise-level reports with multiple formats</p>
                                                <button 
                                                    onClick={() => setShowReportGenerator(true)}
                                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    Open Generator
                                                </button>
                                            </div>
                                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                <h3 className="font-semibold text-black mb-2">Monthly Summary</h3>
                                                <p className="text-sm text-gray-600 mb-3">Comprehensive monthly performance report</p>
                                                <button 
                                                    onClick={() => handleQuickAction('report_generated', { type: 'monthly' })}
                                                    className="text-black hover:text-gray-700 text-sm font-medium"
                                                >
                                                    Generate Report →
                                                </button>
                                            </div>
                                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                <h3 className="font-semibold text-black mb-2">Resource Utilization</h3>
                                                <p className="text-sm text-gray-600 mb-3">Team capacity and workload analysis</p>
                                                <button 
                                                    onClick={() => handleQuickAction('report_generated', { type: 'utilization' })}
                                                    className="text-black hover:text-gray-700 text-sm font-medium"
                                                >
                                                    Generate Report →
                                                </button>
                                            </div>
                                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                <h3 className="font-semibold text-black mb-2">Project Portfolio</h3>
                                                <p className="text-sm text-gray-600 mb-3">Complete project performance overview</p>
                                                <button 
                                                    onClick={() => handleQuickAction('report_generated', { type: 'portfolio' })}
                                                    className="text-black hover:text-gray-700 text-sm font-medium"
                                                >
                                                    Generate Report →
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800">
                                                <FontAwesomeIcon icon={faRocket} className="mr-2" />
                                                Advanced reporting features now available! Use Quick Actions panel above for instant report generation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Advanced Report Generator Modal */}
            {showReportGenerator && (
                <AdvancedReportGenerator 
                    summaryData={summaryData}
                    yearlyData={yearlyData}
                    onClose={() => setShowReportGenerator(false)}
                />
            )}
        </div>
    );
}