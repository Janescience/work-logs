'use client';

import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, 
  faUsers,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faExpand,
  faCompress,
  faFilter,
  faSortUp,
  faSortDown
} from '@fortawesome/free-solid-svg-icons';

const ResourceHeatmap = ({ summaryData }) => {
  const [sortBy, setSortBy] = useState('utilization'); // utilization, team, hours, tasks
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterTeam, setFilterTeam] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const heatmapData = useMemo(() => {
    if (!summaryData?.individualSummary) return null;

    const capacity = 22 * 8; // Working days * 8 hours
    const teamStats = {};

    // Process individual data to create team aggregations
    summaryData.individualSummary.forEach(member => {
      const teamName = member.user.teamName || 'Unassigned';
      const utilizationRate = (member.totalHours / capacity) * 100;
      
      if (!teamStats[teamName]) {
        teamStats[teamName] = {
          teamName,
          members: [],
          totalHours: 0,
          memberCount: 0,
          avgUtilization: 0,
          maxUtilization: 0,
          minUtilization: 100,
          coreMembers: 0,
          nonCoreMembers: 0,
          overCapacity: 0,
          underUtilized: 0
        };
      }

      const memberData = {
        ...member,
        utilizationRate,
        status: utilizationRate > 120 ? 'over' : 
                utilizationRate < 60 ? 'under' : 
                utilizationRate > 100 ? 'high' : 'normal'
      };

      teamStats[teamName].members.push(memberData);
      teamStats[teamName].totalHours += member.totalHours;
      teamStats[teamName].memberCount++;
      teamStats[teamName].maxUtilization = Math.max(teamStats[teamName].maxUtilization, utilizationRate);
      teamStats[teamName].minUtilization = Math.min(teamStats[teamName].minUtilization, utilizationRate);

      if (member.user.type === 'Core') {
        teamStats[teamName].coreMembers++;
      } else {
        teamStats[teamName].nonCoreMembers++;
      }

      if (utilizationRate > 120) {
        teamStats[teamName].overCapacity++;
      } else if (utilizationRate < 60) {
        teamStats[teamName].underUtilized++;
      }
    });

    // Calculate averages
    Object.values(teamStats).forEach(team => {
      team.avgUtilization = team.totalHours / (team.memberCount * capacity) * 100;
    });

    return teamStats;
  }, [summaryData]);

  const getUtilizationColor = (utilization) => {
    if (utilization > 120) return 'bg-red-500';
    if (utilization > 100) return 'bg-orange-500';
    if (utilization >= 80) return 'bg-green-500';
    if (utilization >= 60) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getUtilizationTextColor = (utilization) => {
    if (utilization > 120) return 'text-red-700';
    if (utilization > 100) return 'text-orange-700';
    if (utilization >= 80) return 'text-green-700';
    if (utilization >= 60) return 'text-yellow-700';
    return 'text-gray-700';
  };

  const getStatusIcon = (utilization) => {
    if (utilization > 120) return faExclamationTriangle;
    if (utilization >= 80) return faCheckCircle;
    return faInfoCircle;
  };

  const sortedTeams = useMemo(() => {
    if (!heatmapData) return [];
    
    let teams = Object.values(heatmapData);
    
    // Filter by team
    if (filterTeam !== 'all') {
      teams = teams.filter(team => team.teamName === filterTeam);
    }

    // Sort teams
    teams.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'utilization':
          aValue = a.avgUtilization;
          bValue = b.avgUtilization;
          break;
        case 'team':
          aValue = a.teamName;
          bValue = b.teamName;
          break;
        case 'hours':
          aValue = a.totalHours;
          bValue = b.totalHours;
          break;
        case 'members':
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        default:
          aValue = a.avgUtilization;
          bValue = b.avgUtilization;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return teams;
  }, [heatmapData, sortBy, sortOrder, filterTeam]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? faSortUp : faSortDown;
  };

  if (!heatmapData) return null;

  const teamNames = Object.keys(heatmapData);
  const totalMembers = Object.values(heatmapData).reduce((sum, team) => sum + team.memberCount, 0);
  const avgUtilization = Object.values(heatmapData).reduce((sum, team) => sum + team.avgUtilization, 0) / teamNames.length;
  const overCapacityCount = Object.values(heatmapData).reduce((sum, team) => sum + team.overCapacity, 0);
  const underUtilizedCount = Object.values(heatmapData).reduce((sum, team) => sum + team.underUtilized, 0);

  return (
    <div className="mb-8">
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-black flex items-center">
            <FontAwesomeIcon icon={faThermometerHalf} className="mr-3 text-blue-600" />
            Resource Utilization Heatmap
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-light text-black">{teamNames.length}</div>
            <p className="text-sm text-gray-600">Active Teams</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-light text-black">{totalMembers}</div>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className={`text-2xl font-light ${getUtilizationTextColor(avgUtilization)}`}>
              {avgUtilization.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-600">Avg Utilization</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-light text-red-600">{overCapacityCount}</div>
            <p className="text-sm text-gray-600">Over Capacity</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Teams</option>
                {teamNames.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Over 120%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>100-120%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>80-100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>60-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Under 60%</span>
            </div>
          </div>
        </div>

        {/* Team Heatmap Grid */}
        <div className="space-y-6">
          {sortedTeams.map(team => (
            <div key={team.teamName} className="border border-gray-200 rounded-lg p-4">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon 
                    icon={getStatusIcon(team.avgUtilization)} 
                    className={`text-lg ${getUtilizationTextColor(team.avgUtilization)}`}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-black">{team.teamName}</h3>
                    <p className="text-sm text-gray-600">
                      {team.memberCount} members • {team.coreMembers} core, {team.nonCoreMembers} non-core
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getUtilizationTextColor(team.avgUtilization)}`}>
                    {team.avgUtilization.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">{team.totalHours.toFixed(0)}h total</p>
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Range:</span>
                  <span className="ml-2 font-mono">
                    {team.minUtilization.toFixed(0)}% - {team.maxUtilization.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Issues:</span>
                  <span className="ml-2">
                    {team.overCapacity > 0 && (
                      <span className="text-red-600 font-medium">{team.overCapacity} over</span>
                    )}
                    {team.overCapacity > 0 && team.underUtilized > 0 && <span className="text-gray-400">, </span>}
                    {team.underUtilized > 0 && (
                      <span className="text-yellow-600 font-medium">{team.underUtilized} under</span>
                    )}
                    {team.overCapacity === 0 && team.underUtilized === 0 && (
                      <span className="text-green-600 font-medium">None</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${getUtilizationTextColor(team.avgUtilization)}`}>
                    {team.avgUtilization > 120 ? 'Over Capacity' :
                     team.avgUtilization >= 80 ? 'Optimal' :
                     team.avgUtilization >= 60 ? 'Under Utilized' : 'Low Activity'}
                  </span>
                </div>
              </div>

              {/* Members Grid */}
              {isExpanded && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {team.members.map(member => (
                    <div key={member.user._id} className="border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getUtilizationColor(member.utilizationRate)}`}></div>
                        <span className="text-sm font-medium text-black truncate">
                          {member.user.name || member.user.username}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {member.user.type} • {member.totalHours.toFixed(0)}h
                      </div>
                      <div className={`text-sm font-bold ${getUtilizationTextColor(member.utilizationRate)}`}>
                        {member.utilizationRate.toFixed(0)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${getUtilizationColor(member.utilizationRate)}`}
                          style={{ width: `${Math.min(member.utilizationRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isExpanded && (
                <div className="flex items-center gap-1">
                  {team.members.slice(0, 20).map(member => (
                    <div 
                      key={member.user._id}
                      className={`w-4 h-4 rounded-sm ${getUtilizationColor(member.utilizationRate)} tooltip`}
                      title={`${member.user.name || member.user.username}: ${member.utilizationRate.toFixed(0)}%`}
                    />
                  ))}
                  {team.members.length > 20 && (
                    <span className="text-xs text-gray-500 ml-2">+{team.members.length - 20} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Recommendations */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-3">Recommended Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overCapacityCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                  <span className="font-medium text-red-800">Immediate Attention Required</span>
                </div>
                <p className="text-sm text-red-700">
                  {overCapacityCount} member{overCapacityCount > 1 ? 's' : ''} over capacity. 
                  Consider redistributing workload or adding resources.
                </p>
              </div>
            )}
            
            {underUtilizedCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600" />
                  <span className="font-medium text-yellow-800">Optimization Opportunity</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {underUtilizedCount} member{underUtilizedCount > 1 ? 's' : ''} under-utilized. 
                  Consider additional project assignments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHeatmap;