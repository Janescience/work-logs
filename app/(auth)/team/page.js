// app/(auth)/team/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faSpinner, faEdit, faTrash, 
  faChevronDown, faChevronUp, faSync,
  faCalendarAlt, faExclamationTriangle,
  faCheckCircle, faClock, faUserPlus,
  faFilter, faTimeline, faChartLine,
  faTable, faSearch, faCopy
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
// Organized imports by category
import { MyJiras } from '@/components/jira';
import { WorkCalendar } from '@/components/calendar';
import { TeamSummary } from '@/components/dashboard';
import { TeamTimeline, ProjectTimeline } from '@/components/calendar';
import { PageHeader, Button, Input, Select, Avatar } from '@/components/ui';
import { useWorkingDays } from '@/hooks/useWorkingDays';

export default function MyTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { getCurrentMonthWorkingDays, getWorkingDaysPassed } = useWorkingDays();
  
  const [team, setTeam] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collapsedMembers, setCollapsedMembers] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, members
  
  // Member table view states - object with userId as key
  const [memberTableStates, setMemberTableStates] = useState({});
  const [memberExternalStatuses, setMemberExternalStatuses] = useState({});
  const [expandedDailyLogs, setExpandedDailyLogs] = useState({}); // Track expanded daily logs per jira

  const toggleMemberCollapse = (userId) => {
    setCollapsedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.roles?.includes('TEAM LEAD')) {
        router.push('/dashboard');
        toast.error('Access denied - Team Lead role required');
        return;
      } else {
        fetchTeamAndMembers();
      }
    }
  }, [status]);

  const fetchTeamAndMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error('Failed to fetch team data');
      
      const data = await res.json();
      setTeam(data.team);
      setAvailableMembers(data.availableMembers);
      
      if (data.team) {
        setTeamName(data.team.teamName);
        const memberIds = data.team.memberIds || data.team.members.map(m => m._id || m.userId);
        setSelectedMembers(memberIds);
        
        const initialCollapsed = {};
        memberIds.forEach(id => {
          initialCollapsed[id] = true;
        });
        setCollapsedMembers(initialCollapsed);
        
        // Only fetch jiras if we don't have team data yet
        if (Object.keys(teamData).length === 0) {
          fetchTeamJiras();
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [teamData]);

  const fetchTeamJiras = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/team/jiras');
      if (!res.ok) throw new Error('Failed to fetch team jiras');
      
      const data = await res.json();
      setTeamData(data.jirasByUser);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.warning('Please enter a team name');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.warning('Please select at least one team member');
      return;
    }
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName,
          memberIds: selectedMembers 
        })
      });
      if (!res.ok) throw new Error('Failed to save team');
      const data = await res.json();
      setTeam(data.team);
      setIsModalOpen(false);
      setIsEditMode(false);
      toast.success('Team saved successfully');
      fetchTeamJiras();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [memberId] })
      });
      if (!res.ok) throw new Error('Failed to remove member');
      toast.success('Member removed successfully');
      fetchTeamAndMembers();
      fetchTeamJiras();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAllJirasForTimeline = useMemo(() => {
    const allJiras = [];
    Object.values(teamData).forEach(userData => {
      if (userData.jiras) {
        userData.jiras.forEach(jira => {
          allJiras.push({
            ...jira,
            assignee: userData.memberInfo.username,
            assigneeEmail: userData.memberInfo.email
          });
        });
      }
    });
    return allJiras;
  }, [teamData]);

  const getAllJirasFlat = useMemo(() => {
    const allJiras = [];
    Object.values(teamData).forEach(userData => {
      if (userData.jiras) {
        userData.jiras.forEach(jira => {
          allJiras.push({
            ...jira,
            assignee: userData.memberInfo.username,
            assigneeEmail: userData.memberInfo.email
          });
        });
      }
    });
    return allJiras;
  }, [teamData]);

  // Initialize member table state
  const initializeMemberTableState = (userId) => {
    if (!memberTableStates[userId]) {
      setMemberTableStates(prev => ({
        ...prev,
        [userId]: {
          showTableView: false,
          searchQuery: '',
          statusFilter: 'all',
          dateFilter: 'thisMonth',
          viewFilter: 'list'
        }
      }));
    }
  };

  const updateMemberTableState = (userId, updates) => {
    setMemberTableStates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...updates
      }
    }));
  };

  const toggleDailyLogExpansion = (jiraId) => {
    setExpandedDailyLogs(prev => ({
      ...prev,
      [jiraId]: !prev[jiraId]
    }));
  };

  // Fetch external Jira statuses for member
  const fetchMemberExternalStatuses = async (userId, jiras) => {
    const jiraNumbers = [...new Set(jiras.map(j => j.jiraNumber).filter(Boolean))].join(',');
    if (!jiraNumbers) return;
    
    try {
      const res = await fetch(`/api/jira-status?jiraNumbers=${jiraNumbers}`);
      if (res.ok) {
        const data = await res.json();
        setMemberExternalStatuses(prev => ({
          ...prev,
          [userId]: data.statuses || {}
        }));
      }
    } catch (error) {
      console.error('Failed to fetch external statuses:', error);
    }
  };

  const isDateInRange = (logDate, range) => {
    if (range === 'all') return true;
    
    const targetDate = new Date(logDate);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return targetDate.toDateString() === now.toDateString();
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return targetDate >= weekStart && targetDate <= weekEnd;
      case 'thisMonth':
        return targetDate.getMonth() === now.getMonth() && 
               targetDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // Filter member jiras based on member table state
  const filterMemberJiras = (jiras, userId) => {
    const state = memberTableStates[userId];
    if (!state) return jiras;

    let filtered = [...jiras];

    // Search filter
    if (state.searchQuery?.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(jira => 
        jira.jiraNumber?.toLowerCase().includes(query) ||
        jira.description?.toLowerCase().includes(query) ||
        jira.projectName?.toLowerCase().includes(query) ||
        jira.serviceName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (state.statusFilter && state.statusFilter !== 'all') {
      filtered = filtered.filter(jira => {
        const status = (jira.actualStatus || '').toLowerCase();
        switch (state.statusFilter) {
          case 'active':
            return status === 'in progress';
          case 'done':
            return status === 'done';
          default:
            return true;
        }
      });
    }

    // Date filter - check if jira has logs within the date range
    if (state.dateFilter && state.dateFilter !== 'all') {
      filtered = filtered.filter(jira => {
        const hasLogsInRange = jira.dailyLogs && jira.dailyLogs.some(log => 
          isDateInRange(log.logDate, state.dateFilter)
        );
        const dueDateInRange = jira.dueDate && isDateInRange(jira.dueDate, state.dateFilter);
        return hasLogsInRange || dueDateInRange;
      });
    }

    return filtered;
  };

  const formatMemberJiraAsTable = (jira, userId) => {
    const state = memberTableStates[userId] || { dateFilter: 'thisMonth' };
    const filteredLogs = jira.dailyLogs ? jira.dailyLogs.filter(log => 
      isDateInRange(log.logDate, state.dateFilter)
    ) : [];

    const project = jira.projectName || '';
    const service = jira.serviceName || '';
    const jiraStatus = memberExternalStatuses[userId]?.[jira.jiraNumber] || 'Unknown';
    const actualStatus = jira.actualStatus || 'No Status';
    
    // Calculate total hours
    const totalHours = filteredLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
    const totalHoursText = `${totalHours}h (${filteredLogs.length} logs)`;
    
    // Format daily logs with better structure for copying
    const dailyLogText = filteredLogs.length > 0 ? 
      filteredLogs
        .sort((a, b) => new Date(a.logDate) - new Date(b.logDate))
        .map(log => {
          const logDate = new Date(log.logDate).toLocaleDateString('en-GB');
          return `[${logDate}] ${log.taskDescription} (${log.timeSpent}h)`;
        })
        .join(' | ') : 'No daily logs';
    
    // Format deploy dates with better structure for copying
    const deployDates = [
      jira.deploySitDate ? `SIT: ${new Date(jira.deploySitDate).toLocaleDateString('en-GB')}` : '',
      jira.deployUatDate ? `UAT: ${new Date(jira.deployUatDate).toLocaleDateString('en-GB')}` : '',
      jira.deployPreprodDate ? `PREPROD: ${new Date(jira.deployPreprodDate).toLocaleDateString('en-GB')}` : '',
      jira.deployProdDate ? `PROD: ${new Date(jira.deployProdDate).toLocaleDateString('en-GB')}` : ''
    ].filter(Boolean).join(' | ') || 'No deployment dates';
    
    return `${project}\t${service}\t${jira.jiraNumber}\t${jira.description}\t${jiraStatus}\t${actualStatus}\t${totalHoursText}\t${dailyLogText}\t${deployDates}`;
  };

  const calculateMemberStats = (jiras) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // 1. เดือนปัจจุบันบันทึก log ไปแล้วกี่ log
    const currentMonthLogs = jiras.reduce((total, jira) => {
      if (jira.dailyLogs) {
        const currentMonthLogCount = jira.dailyLogs.filter(log => {
          const logDate = new Date(log.logDate);
          return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        }).length;
        return total + currentMonthLogCount;
      }
      return total;
    }, 0);
    
    // 2. ถือ jira อยู่ทั้งหมดกี่ jira ไม่นับอันที่ done
    const activeJiras = jiras.filter(j => {
      const status = (j.actualStatus || '').toLowerCase();
      return !['done', 'closed', 'cancelled', 'deployed to production'].includes(status);
    }).length;
    
    // 3. เดือนปัจจุบันทำไปแล้วกี่ชมจากกี่ชมที่ควรจะได้
    const currentMonthHours = jiras.reduce((total, jira) => {
      if (jira.dailyLogs) {
        const currentMonthHours = jira.dailyLogs
          .filter(log => {
            const logDate = new Date(log.logDate);
            return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
          })
          .reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
        return total + currentMonthHours;
      }
      return total;
    }, 0);
    
    const workingDaysPassed = getWorkingDaysPassed(true);
    const expectedHours = workingDaysPassed * 8; // 8 ชั่วโมงต่อวัน
    
    return {
      currentMonthLogs,
      activeJiras,
      currentMonthHours: Math.round(currentMonthHours * 10) / 10, // ปัดทศนิยม 1 ตำแหน่ง
      expectedHours
    };
  };

  const handleCopyMemberSummary = async (userId, memberName, jiras) => {
    try {
      const filteredJiras = filterMemberJiras(jiras, userId);
      let summaryContent = [];

      summaryContent.push(`${memberName} - Work Summary`);
      summaryContent.push('');
      summaryContent.push('Project\tService\tJira Number\tDescription\tJira Status\tActual Status\tTotal Hours\tDaily Log\tDeploy Date');
      summaryContent.push('');

      filteredJiras.forEach(jira => {
        summaryContent.push(formatMemberJiraAsTable(jira, userId));
      });

      const summaryText = summaryContent.join('\n');
      await navigator.clipboard.writeText(summaryText);
      toast.success(`${memberName}'s work summary copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy work summary');
      console.error('Copy failed:', error);
    }
  };

  // Early return for auth states to prevent hooks ordering issues
  if (status === 'loading' || loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-gray-700 mb-4" />
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if user doesn't have permission
  if (status === 'authenticated' && !session?.user?.roles?.includes('TEAM LEAD')) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-gray-700 mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-6 py-8">
          <PageHeader title={team ? team.teamName.toUpperCase() : 'MY TEAM'} />
          
          {/* Action buttons - Centered */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {!team ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUserPlus} /> Create Team
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setIsModalOpen(true);
                    const memberIds = team.memberIds || team.members.map(m => m._id || m.userId);
                    setSelectedMembers(memberIds);
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit Team
                </button>
                <button
                  onClick={fetchTeamJiras}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  disabled={loadingData}
                >
                  <FontAwesomeIcon icon={faSync} className={loadingData ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Tabs */}
          {team && Object.keys(teamData).length > 0 && (
            <div className="mt-6 border-b border-gray-200 -mb-px">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'timeline'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'members'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Members ({Object.keys(teamData).length})
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-gray-600 mb-4" />
            <p className="text-gray-600">Loading team data...</p>
          </div>
        )}

        {!loadingData && team && Object.keys(teamData).length > 0 && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <TeamSummary teamData={teamData} />
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <ProjectTimeline allJiras={getAllJirasForTimeline} />
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {Object.values(teamData).map((userData, index) => {
                  const { memberInfo, jiras } = userData;
                  if (!memberInfo) return null;
                  const isCollapsed = collapsedMembers[memberInfo.userId] !== false;
                  
                  return (
                    <div key={memberInfo.userId} className={`${index > 0 ? 'border-t border-gray-200' : ''}`}>
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          toggleMemberCollapse(memberInfo.userId);
                          initializeMemberTableState(memberInfo.userId);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            username={memberInfo.username}
                            size={48}
                            className="w-12 h-12 border-2 border-gray-200"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {memberInfo.username}
                            </h3>
                            <p className="text-sm text-gray-500">{memberInfo.email}</p>
                            
                            {/* Task Status Row */}
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                              {(() => {
                                const stats = calculateMemberStats(jiras);
                                return (
                                  <>
                                    {/* Current Month Logs */}
                                    <span className="text-purple-600 font-medium">
                                      {stats.currentMonthLogs} logs this month
                                    </span>
                                    
                                    {/* Active JIRAs */}
                                    <span className="text-blue-600 font-medium">
                                      {stats.activeJiras} active JIRAs
                                    </span>
                                    
                                    {/* Current Month Hours */}
                                    <span className={`font-medium ${stats.currentMonthHours >= stats.expectedHours ? 'text-green-600' : 'text-orange-600'}`}>
                                      {stats.currentMonthHours}h / {stats.expectedHours}h this month
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(memberInfo.userId);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Remove from team"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                          <FontAwesomeIcon 
                            icon={isCollapsed ? faChevronDown : faChevronUp} 
                            className="text-gray-400"
                          />
                        </div>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          <div className="p-6 space-y-6">
                            <WorkCalendar allJiras={jiras} />
                            
                            {/* Table View Toggle */}
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-medium text-gray-900">Tasks Overview</h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentState = memberTableStates[memberInfo.userId]?.showTableView || false;
                                    updateMemberTableState(memberInfo.userId, { showTableView: !currentState });
                                    if (!currentState && !memberExternalStatuses[memberInfo.userId]) {
                                      fetchMemberExternalStatuses(memberInfo.userId, jiras);
                                    }
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTable} className="text-xs mr-2" />
                                  {memberTableStates[memberInfo.userId]?.showTableView ? 'Hide Table' : 'Show Table'}
                                </Button>
                              </div>
                            </div>

                            {/* Table View */}
                            {memberTableStates[memberInfo.userId]?.showTableView && (
                              <div className="space-y-4">
                                {/* Filters */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="flex gap-3">
                                      {/* Search */}
                                      <div className="flex-1 relative">
                                        <Input
                                          size="sm"
                                          placeholder="Search tasks..."
                                          value={memberTableStates[memberInfo.userId]?.searchQuery || ''}
                                          onChange={(e) => updateMemberTableState(memberInfo.userId, { searchQuery: e.target.value })}
                                          className="pl-8"
                                        />
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
                                      </div>

                                      {/* Status Filter */}
                                      <Select
                                        size="sm"
                                        value={memberTableStates[memberInfo.userId]?.statusFilter || 'all'}
                                        onChange={(e) => updateMemberTableState(memberInfo.userId, { statusFilter: e.target.value })}
                                        options={[
                                          { value: 'all', label: 'All Status' },
                                          { value: 'active', label: 'In Progress' },
                                          { value: 'done', label: 'Done' }
                                        ]}
                                      />

                                      {/* Date Filter */}
                                      <Select
                                        size="sm"
                                        value={memberTableStates[memberInfo.userId]?.dateFilter || 'thisMonth'}
                                        onChange={(e) => updateMemberTableState(memberInfo.userId, { dateFilter: e.target.value })}
                                        options={[
                                          { value: 'all', label: 'All Time' },
                                          { value: 'today', label: 'Today' },
                                          { value: 'thisWeek', label: 'This Week' },
                                          { value: 'thisMonth', label: 'This Month' }
                                        ]}
                                      />
                                    </div>

                                    {/* Copy Button */}
                                    <div className="flex items-center justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyMemberSummary(memberInfo.userId, memberInfo.username, jiras)}
                                        title={`Copy ${memberInfo.username}'s work summary`}
                                      >
                                        <FontAwesomeIcon icon={faCopy} className="text-xs mr-2" />
                                        Copy Summary
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Table */}
                                {(() => {
                                  const filteredJiras = filterMemberJiras(jiras, memberInfo.userId);
                                  const state = memberTableStates[memberInfo.userId] || {};
                                  
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jira Number</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jira Status</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Status</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Log</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deploy Date</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredJiras.length > 0 ? filteredJiras.map((jira, jiraIndex) => {
                                              const filteredLogs = jira.dailyLogs ? jira.dailyLogs.filter(log => 
                                                isDateInRange(log.logDate, state.dateFilter || 'thisMonth')
                                              ) : [];
                                              
                                              const sortedLogs = filteredLogs.sort((a, b) => new Date(a.logDate) - new Date(b.logDate));
                                              const totalHours = sortedLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
                                              
                                              const deploymentDates = [
                                                { env: 'SIT', date: jira.deploySitDate, color: 'bg-blue-50 text-blue-700' },
                                                { env: 'UAT', date: jira.deployUatDate, color: 'bg-yellow-50 text-yellow-700' },
                                                { env: 'PREPROD', date: jira.deployPreprodDate, color: 'bg-orange-50 text-orange-700' },
                                                { env: 'PROD', date: jira.deployProdDate, color: 'bg-green-50 text-green-700' }
                                              ].filter(deploy => deploy.date);

                                              const getStatusColor = (status) => {
                                                const s = status?.toLowerCase() || '';
                                                if (s === 'done') return 'bg-green-100 text-green-800';
                                                if (s === 'in progress') return 'bg-blue-100 text-blue-800';
                                                if (s === 'cancel' || s === 'cancelled') return 'bg-gray-100 text-gray-800';
                                                return 'bg-gray-100 text-gray-800';
                                              };

                                              return (
                                                <tr key={jira._id || jiraIndex} className="hover:bg-gray-50">
                                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {jira.projectName || '-'}
                                                  </td>
                                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {jira.serviceName || '-'}
                                                  </td>
                                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                    {jira.jiraNumber}
                                                  </td>
                                                  <td className="px-4 py-4 text-sm text-gray-900 max-w-sm">
                                                    <div className="break-words">
                                                      {jira.description}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2 py-1 bg-gray-900 text-white rounded text-xs">
                                                      {memberExternalStatuses[memberInfo.userId]?.[jira.jiraNumber] || 'Unknown'}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(jira.actualStatus)}`}>
                                                      {jira.actualStatus || 'No Status'}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center">
                                                      <span className="text-lg font-bold text-blue-900">
                                                        {totalHours}h
                                                      </span>
                                                      <span className="text-xs text-gray-500">
                                                        {sortedLogs.length} log{sortedLogs.length !== 1 ? 's' : ''}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-4 text-sm text-gray-500 max-w-lg">
                                                    {sortedLogs.length > 0 ? (
                                                      <div className="space-y-1">

                                                        {(() => {
                                                          const isExpanded = expandedDailyLogs[jira._id];
                                                          const logsToShow = isExpanded ? sortedLogs : sortedLogs.slice(-5); // Show last 5 (most recent)
                                                          const hasMoreLogs = sortedLogs.length > 5;
                                                          
                                                          return (
                                                            <>
                                                              {logsToShow.map((log, logIndex) => (
                                                                <div key={logIndex} className="flex flex-col py-1 border-b border-gray-100 last:border-b-0">
                                                                  <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-medium text-gray-600">
                                                                      {new Date(log.logDate).toLocaleDateString('en-GB')}
                                                                    </span>
                                                                    <span className="text-xs font-semibold text-blue-600">
                                                                      {log.timeSpent}h
                                                                    </span>
                                                                  </div>
                                                                  <div className="text-xs text-gray-700 mt-1 break-words">
                                                                    {log.taskDescription}
                                                                  </div>
                                                                </div>
                                                              ))}
                                                              
                                                              {hasMoreLogs && (
                                                                <button
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleDailyLogExpansion(jira._id);
                                                                  }}
                                                                  className="w-full mt-2 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 font-medium transition-colors"
                                                                >
                                                                  {isExpanded 
                                                                    ? 'Show Less' 
                                                                    : `Show ${sortedLogs.length - 5} More Logs`
                                                                  }
                                                                </button>
                                                              )}
                                                            </>
                                                          );
                                                        })()}
                                                      </div>
                                                    ) : (
                                                      <span className="text-gray-400 text-xs">No daily logs</span>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-4 text-sm max-w-xs">
                                                    {deploymentDates.length > 0 ? (
                                                      <div className="space-y-1">
                                                        {deploymentDates.map((deploy, deployIndex) => (
                                                          <div key={deployIndex} className={`px-2 py-1 rounded text-xs ${deploy.color} flex items-center justify-between`}>
                                                            <span className="font-medium">{deploy.env}</span>
                                                            <span>{new Date(deploy.date).toLocaleDateString('en-GB')}</span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : (
                                                      <span className="text-gray-400 text-xs">No deployment dates</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            }) : (
                                              <tr>
                                                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                                  No tasks found matching the current filters.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                      {filteredJiras.length > 0 && (
                                        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                                          Showing {filteredJiras.length} of {jiras.length} tasks
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            
                            <MyJiras userEmail={memberInfo.email} userName={memberInfo.username} userId={memberInfo.userId} readOnly={true} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Team Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Team' : 'Create New Team'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <Input
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members ({selectedMembers.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                    {availableMembers.map(member => (
                      <label 
                        key={member._id} 
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedMembers.includes(member._id)} 
                          onChange={() => handleMemberSelect(member._id)} 
                          className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded" 
                        />
                        <Avatar
                          username={member.username}
                          size={32}
                          className="w-8 h-8 mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{member.username}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  onClick={() => { 
                    setIsModalOpen(false); 
                    setIsEditMode(false); 
                    if (team) { 
                      setTeamName(team.teamName); 
                      const memberIds = team.memberIds || team.members.map(m => m._id || m.userId); 
                      setSelectedMembers(memberIds); 
                    } else { 
                      setTeamName(''); 
                      setSelectedMembers([]); 
                    } 
                  }} 
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTeam} 
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!teamName.trim() || selectedMembers.length === 0}
                >
                  {isEditMode ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}