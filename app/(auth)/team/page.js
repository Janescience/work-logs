// app/(auth)/team/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faSpinner, faEdit, faTrash, 
  faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import MyJiras from '@/components/MyJiras';
import WorkLogCalendar from '@/components/WorkCalendar';
import { toast } from 'react-toastify';
import TeamSummary from '@/components/TeamSummary';
import TeamRetrospective from '@/components/TeamRetrospective';

const getAvatarUrl = (username) => {
  if (!username) return 'https://placehold.co/32x32/cccccc/ffffff?text=NA';
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
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

  if (status === 'loading' || loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-light text-black mb-4">
            {team ? team.teamName : 'My Team'}
          </h1>
          <div className="w-16 h-px bg-black mx-auto"></div>
        </div>

        {team && Object.keys(teamData).length > 0 && (
          <div className="mb-8 space-y-6">
            <TeamSummary teamData={teamData} />
            <TeamRetrospective teamData={teamData} /> 
          </div>
        )}
        
        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
          {!team ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-black text-white font-light hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUsers} /> Create Team
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
                className="px-6 py-3 bg-black text-white font-light hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faEdit} /> Edit Team
              </button>
              <button
                onClick={fetchTeamJiras}
                className="px-6 py-3 bg-gray-200 text-black font-light hover:bg-gray-300 transition-colors"
                disabled={loadingData}
              >
                {loadingData ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : null}
                Refresh Data
              </button>
            </>
          )}
        </div>

        {loadingData && (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-black mb-4" />
            <p className="text-gray-600">Loading team data...</p>
          </div>
        )}

        {!loadingData && Object.keys(teamData).length > 0 && (
          <div className="border-2 border-black rounded-lg">
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
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-black">
                          {memberInfo.username.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">{memberInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(memberInfo.userId);
                        }}
                        title="Remove from team"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <FontAwesomeIcon 
                        icon={isCollapsed ? faChevronDown : faChevronUp} 
                        className="text-gray-500"
                      />
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="p-4 lg:p-6 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MyJiras userEmail={memberInfo.email} userName={memberInfo.username} />
                        <WorkLogCalendar allJiras={jiras} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-black">
                {isEditMode ? 'Edit Team' : 'Create Team'}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" placeholder="Enter team name" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team Members</label>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableMembers.map(member => (
                    <label key={member._id} className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedMembers.includes(member._id)} onChange={() => handleMemberSelect(member._id)} className="mr-3" />
                      <img src={getAvatarUrl(member.username)} alt={member.username} className="w-8 h-8 rounded-full mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{member.username.toUpperCase()}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); if (team) { setTeamName(team.teamName); const memberIds = team.memberIds || team.members.map(m => m._id || m.userId); setSelectedMembers(memberIds); } else { setTeamName(''); setSelectedMembers([]); } }} className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded">Cancel</button>
                <button onClick={handleSaveTeam} className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded flex items-center gap-2" disabled={!teamName.trim() || selectedMembers.length === 0}>{isEditMode ? 'Update Team' : 'Create Team'} ({selectedMembers.length})</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}