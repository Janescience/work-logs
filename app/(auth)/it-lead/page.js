// app/(auth)/it-lead-summary/page.js
'use client';

import React,{ useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faChartBar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import YearlySummaryChart from '@/components/YearlySummaryChart';

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
        <div className="min-h-screen bg-white p-6 text-black">
            <div className="mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-light text-black mb-4">Month Summary</h1>
                    <div className="w-16 h-px bg-black mx-auto"></div>
                </div>

                {/* Filters */}
                <div className="flex justify-end items-center gap-4 mb-8 pb-6 ">
                    <select name="month" value={date.month} onChange={handleDateChange} className="px-2 py-2 text-black bg-transparent border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select name="year" value={date.year} onChange={handleDateChange} className="py-2 text-black bg-transparent border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none">
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <YearlySummaryChart data={yearlyData} loading={loadingChart} />

                {loading ? (
                    <div className="text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x" /></div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3" /> {error}
                    </div>
                ) : (
                    <>
                        <ProjectSummaryTable data={summaryData.projectSummary || []} />
                        <IndividualSummary data={summaryData.individualSummary || []} />
                    </>
                )}
            </div>
        </div>
    );
}