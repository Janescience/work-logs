// app/(auth)/team/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faSpinner, faEdit, faTrash, 
  faChevronDown, faChevronUp, faSync,
  faCalendarAlt, faExclamationTriangle,
  faCheckCircle, faClock, faUserPlus,
  faFilter, faTimeline, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
// Organized imports by category
import { MyJiras } from '@/components/jira';
import { WorkCalendar } from '@/components/calendar';
import { TeamSummary, PerformanceAlerts } from '@/components/dashboard';
import { TeamRetrospective, TeamTimeline } from '@/components/calendar';
import { BurndownChart, VelocityTracker } from '@/components/reports';

const getAvatarUrl = (username) => {
  if (!username) return 'https://placehold.co/40x40/e5e7eb/6b7280?text=NA';
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}&size=40`;
};

export default function MyTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, members, analytics

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
  }, [status, session, router]);

  const fetchTeamAndMembers = async () => {
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
        
        fetchTeamJiras();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamJiras = async () => {
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
  };

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

  const getAllJirasForTimeline = () => {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-gray-900">
                  {team ? team.teamName : 'My Team'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your team and track deployment progress
                </p>
              </div>
              
              <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'analytics'
                        ? 'border-black text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Analytics
                  </button>
                </nav>
              </div>
            )}
          </div>
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
                  {/* <TeamRetrospective teamData={teamData} /> */}
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <TeamTimeline allJiras={getAllJirasForTimeline()} />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {/* Performance Overview */}
                <div className="bg-white border border-black">
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-light text-black">Performance Overview</h2>
                  </div>
                  <div className="p-4">
                    <PerformanceAlerts teamData={teamData} />
                  </div>
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white border border-black">
                    <div className="border-b border-gray-200 p-4">
                      <h3 className="text-base font-medium text-black">Progress Tracking</h3>
                    </div>
                    <div className="p-4">
                      <BurndownChart teamData={teamData} />
                    </div>
                  </div>
                  
                  <div className="bg-white border border-black">
                    <div className="border-b border-gray-200 p-4">
                      <h3 className="text-base font-medium text-black">Team Velocity</h3>
                    </div>
                    <div className="p-4">
                      <VelocityTracker teamData={teamData} />
                    </div>
                  </div>

                  {/* Team Health Metrics */}
                  <div className="bg-white border border-black">
                    <div className="border-b border-gray-200 p-4">
                      <h3 className="text-base font-medium text-black">Team Health</h3>
                    </div>
                    <div className="p-4">
                      {(() => {
                        const teamSize = Object.keys(teamData).length;
                        const totalJiras = Object.values(teamData).reduce((sum, { jiras }) => sum + (jiras?.length || 0), 0);
                        const blockedJiras = Object.values(teamData).reduce((sum, { jiras }) => 
                          sum + (jiras?.filter(j => j.actualStatus?.toLowerCase().includes('blocked') || 
                                              j.actualStatus?.toLowerCase().includes('impediment')).length || 0), 0);
                        const avgTasksPerPerson = teamSize > 0 ? (totalJiras / teamSize).toFixed(1) : 0;
                        const blockedPercentage = totalJiras > 0 ? ((blockedJiras / totalJiras) * 100).toFixed(0) : 0;
                        
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-center p-2 border border-gray-200">
                                <div className="text-lg font-light text-black">{teamSize}</div>
                                <p className="text-xs text-gray-600">Team Members</p>
                              </div>
                              <div className="text-center p-2 border border-gray-200">
                                <div className="text-lg font-light text-black">{avgTasksPerPerson}</div>
                                <p className="text-xs text-gray-600">Tasks/Person</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                              <div className={`flex items-center gap-1 px-2 py-1 ${
                                blockedPercentage <= 5 ? 'bg-gray-600 text-white' :
                                blockedPercentage <= 15 ? 'bg-gray-400 text-black' :
                                'bg-black text-white'
                              }`}>
                                {blockedPercentage}% Blocked
                              </div>
                              <span>{totalJiras} total tasks</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Additional Insights */}
                <div className="bg-white border border-black">
                  <div className="border-b border-gray-200 p-4">
                    <h3 className="text-base font-medium text-black">Weekly Summary</h3>
                  </div>
                  <div className="p-4">
                    {(() => {
                      const now = new Date();
                      const weekStart = new Date(now);
                      weekStart.setDate(now.getDate() - now.getDay());
                      
                      let thisWeekHours = 0;
                      let thisWeekCompleted = 0;
                      let highPriorityTasks = 0;
                      
                      Object.values(teamData).forEach(({ jiras }) => {
                        if (!jiras) return;
                        
                        jiras.forEach(jira => {
                          if (jira.priority === 'High' || jira.priority === 'Highest') {
                            highPriorityTasks++;
                          }
                          
                          if (jira.actualStatus?.toLowerCase() === 'done') {
                            thisWeekCompleted++;
                          }
                          
                          if (jira.dailyLogs) {
                            thisWeekHours += jira.dailyLogs
                              .filter(log => new Date(log.logDate) >= weekStart)
                              .reduce((sum, log) => sum + (parseFloat(log.timeSpent) || 0), 0);
                          }
                        });
                      });
                      
                      return (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 border border-gray-200">
                            <div className="text-lg font-light text-black">{thisWeekHours.toFixed(0)}</div>
                            <p className="text-xs text-gray-600">Hours This Week</p>
                          </div>
                          <div className="text-center p-2 border border-gray-200">
                            <div className="text-lg font-light text-black">{thisWeekCompleted}</div>
                            <p className="text-xs text-gray-600">Completed</p>
                          </div>
                          <div className="text-center p-2 border border-gray-200">
                            <div className="text-lg font-light text-black">{highPriorityTasks}</div>
                            <p className="text-xs text-gray-600">High Priority</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
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
                        onClick={() => toggleMemberCollapse(memberInfo.userId)}
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={getAvatarUrl(memberInfo.username)} 
                            alt={memberInfo.username}
                            className="w-12 h-12 rounded-full border-2 border-gray-200"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {memberInfo.username}
                            </h3>
                            <p className="text-sm text-gray-500">{memberInfo.email}</p>
                            
                            {/* Task Status Row */}
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                              {/* Active Tasks Count */}
                              <span className="text-blue-600 font-medium">
                                {jiras.filter(j => {
                                  const status = (j.actualStatus || '').toLowerCase();
                                  return !['done', 'closed', 'cancelled', 'deployed to production'].includes(status);
                                }).length} active
                              </span>
                              
                              {/* In Progress Count */}
                              <span className="text-gray-600 font-medium">
                                {jiras.filter(j => {
                                  const status = (j.actualStatus || '').toLowerCase();
                                  return status.includes('in progress') || status.includes('in-progress') || status.includes('progress');
                                }).length} in progress
                              </span>
                              
                              {/* Done Count */}
                              <span className="text-green-600 font-medium">
                                {jiras.filter(j => {
                                  const status = (j.actualStatus || '').toLowerCase();
                                  return status === 'done' || status === 'closed' || status === 'deployed to production';
                                }).length} done
                              </span>
                              
                              {/* Log Count */}
                              <span className="text-gray-600">
                                {jiras.reduce((total, jira) => total + (jira.dailyLogs ? jira.dailyLogs.length : 0), 0)} logs
                              </span>
                              
                              {/* High Priority Alert */}
                              {jiras.filter(j => j.priority === 'High' || j.priority === 'Highest').length > 0 && (
                                <span className="text-red-600 font-medium">
                                  {jiras.filter(j => j.priority === 'High' || j.priority === 'Highest').length} high priority
                                </span>
                              )}
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
                            <MyJiras userEmail={memberInfo.email} userName={memberInfo.username} readOnly={true} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>
                  <input 
                    type="text" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" 
                    placeholder="Enter team name" 
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
                        <img 
                          src={getAvatarUrl(member.username)} 
                          alt={member.username} 
                          className="w-8 h-8 rounded-full mr-3" 
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