// components/TeamSummary.js
'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faCalendarCheck, 
  faFire, 
  faExclamationTriangle, 
  faChartLine,
  faClock,
  faTasks,
  faUserClock,
  faRocket,
  faCheckCircle,
  faHourglassHalf,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { useWorkingDays } from '@/hooks/useWorkingDays';

const getAvatarUrl = (username) => {
  if (!username) return 'https://placehold.co/40x40/e5e7eb/6b7280?text=NA';
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}&size=40`;
};

const WeeklyActivityGrid = ({ teamData }) => {
  const [hoveredActivity, setHoveredActivity] = React.useState(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseEnter = (userActivity, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredActivity(userActivity);
  };

  const handleMouseLeave = () => {
    setHoveredActivity(null);
  };
  // Generate 14 days ago to today
  const getDatesArray = () => {
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  // Get initials from username
  const getInitials = (username) => {
    if (!username) return 'NA';
    return username.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  // Get activities for a specific date, grouped by user
  const getActivitiesForDate = (date, teamData) => {
    const userActivities = {};
    const dateStr = date.toDateString();
    
    Object.values(teamData).forEach(({ memberInfo, jiras }) => {
      if (!memberInfo || !jiras) return;
      
      jiras.forEach(jira => {
        if (jira.dailyLogs && Array.isArray(jira.dailyLogs)) {
          jira.dailyLogs.forEach(log => {
            const logDate = new Date(log.logDate);
            if (logDate.toDateString() === dateStr) {
              const username = memberInfo.username;
              
              if (!userActivities[username]) {
                userActivities[username] = {
                  username: memberInfo.username,
                  initials: getInitials(memberInfo.username),
                  avatar: getAvatarUrl(memberInfo.username),
                  totalHours: 0,
                  activities: []
                };
              }
              
              userActivities[username].totalHours += parseFloat(log.timeSpent || 0);
              userActivities[username].activities.push({
                jiraNumber: jira.jiraNumber,
                jiraDesc: jira.description || 'No description',
                logDesc: log.taskDescription || 'No description',
                hours: parseFloat(log.timeSpent || 0)
              });
            }
          });
        }
      });
    });
    
    return Object.values(userActivities);
  };

  const dates = getDatesArray();
  const weeks = [dates.slice(0, 7), dates.slice(7, 14)];

  // Calculate total hours for a week
  const getWeekTotalHours = (weekDates) => {
    let totalHours = 0;
    weekDates.forEach(date => {
      const activities = getActivitiesForDate(date, teamData);
      activities.forEach(userActivity => {
        totalHours += userActivity.totalHours;
      });
    });
    return totalHours;
  };

  return (
    <div className="space-y-4 relative">
      {weeks.map((week, weekIndex) => {
        const weekTotalHours = getWeekTotalHours(week);
        const weekStartDate = week[0];
        const weekEndDate = week[6];
        
        return (
          <div key={weekIndex} className="overflow-x-auto">
            {/* Week Header */}
            <div className="mb-2 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-t border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                Week {weekIndex + 1}: {weekStartDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - {weekEndDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-sm font-semibold text-orange-600">
                {weekTotalHours.toFixed(1)}h total
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 min-w-full border border-gray-200 border-t-0">
            {week.map((date, dayIndex) => {
              const activities = getActivitiesForDate(date, teamData);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={dayIndex}
                  className={`border border-gray-200 min-h-[120px] p-2 text-xs ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                  }`}
                >
                  {/* Date Header */}
                  <div className="text-center font-medium text-gray-700 mb-2">
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="text-sm">
                      {date.getDate()}
                    </div>
                  </div>
                  
                  {/* User Activities */}
                  <div className="space-y-1">
                    {activities.length > 0 ? (
                      activities.map((userActivity, index) => (
                        <div 
                          key={index} 
                          className="text-xs p-1 hover:bg-gray-100 rounded cursor-pointer border border-gray-100 relative"
                          onMouseEnter={(e) => handleMouseEnter(userActivity, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <img 
                              src={userActivity.avatar} 
                              alt={userActivity.username}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="font-medium text-gray-800 text-xs">
                              {userActivity.initials}
                            </span>
                          </div>
                          <div className="text-orange-600 font-medium text-xs">
                            {userActivity.totalHours.toFixed(1)}h
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-center mt-4">-</div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        );
      })}
      
      {/* Global Tooltip */}
      {hoveredActivity && (
        <div 
          className="fixed bg-gray-900 text-white text-sm rounded-lg px-4 py-3 z-50 shadow-2xl border border-gray-700 w-96 max-h-80 overflow-y-auto pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px'
          }}
        >
          <div className="font-semibold mb-3 text-blue-300 text-base">{hoveredActivity.username}</div>
          <div className="text-orange-300 font-semibold mb-3 text-sm">Total: {hoveredActivity.totalHours.toFixed(1)} hours</div>
          <div className="space-y-3">
            {hoveredActivity.activities.map((activity, actIndex) => (
              <div key={actIndex} className="border-b border-gray-600 pb-2 mb-2 last:border-b-0 last:mb-0 last:pb-0">
                <div className="text-blue-300 font-mono text-sm font-semibold">{activity.jiraNumber}</div>
                <div className="text-white text-sm mt-1 leading-relaxed">{activity.jiraDesc}</div>
                <div className="text-gray-300 text-sm mt-1 leading-relaxed">📝 {activity.logDesc}</div>
                <div className="text-orange-300 text-sm font-semibold mt-1">⏰ {activity.hours}h</div>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const TeamSummary = ({ teamData }) => {
  const workingDaysHook = useWorkingDays();
  
  // Memoize working days calculation to prevent unnecessary re-renders
  const workingDaysData = useMemo(() => {
    return {
      workingDays: workingDaysHook.getCurrentMonthWorkingDays(true),
      workingDaysPassed: workingDaysHook.getWorkingDaysPassed(true)
    };
  }, [workingDaysHook.isLoading]);
  
  const summary = useMemo(() => {
    if (!teamData || Object.keys(teamData).length === 0) {
      return null;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use memoized working days
    const { workingDays, workingDaysPassed } = workingDaysData;

    // Initialize counters
    let totalLoggedHours = 0;
    let totalLoggedHoursThisWeek = 0;
    const memberStats = {};
    const projectStats = {};
    const deploymentStats = {
      thisMonth: { sit: 0, uat: 0, preprod: 0, prod: 0 },
      nextMonth: { sit: 0, uat: 0, preprod: 0, prod: 0 }
    };
    let totalActiveTasks = 0;
    let totalCompletedThisMonth = 0;
    let blockedTasks = [];
    let inProgressTasks = [];
    let readyForDeployTasks = [];
    const taskStatusDistribution = {};

    // Process all team data
    Object.values(teamData).forEach(({ memberInfo, jiras }) => {
      if (!memberInfo || !jiras) return;

      memberStats[memberInfo.username] = {
        username: memberInfo.username,
        email: memberInfo.email,
        activeTasks: 0,
        completedThisMonth: 0,
        hoursThisMonth: 0,
        hoursThisWeek: 0
      };

      jiras.forEach(jira => {
        const isActive = !['done', 'closed', 'cancelled', 'deployed'].some(s => 
          (jira.actualStatus || '').toLowerCase().includes(s)
        );

        // Count active tasks and status distribution
        if (isActive) {
          totalActiveTasks++;
          memberStats[memberInfo.username].activeTasks++;
          
          // Status distribution
          const status = jira.actualStatus || 'No Status';
          taskStatusDistribution[status] = (taskStatusDistribution[status] || 0) + 1;
          
          // Categorize tasks by status
          const statusLower = status.toLowerCase();
          if (statusLower.includes('block') || statusLower.includes('wait') || statusLower.includes('hold')) {
            blockedTasks.push({
              ...jira,
              assignee: memberInfo.username,
              daysSinceUpdate: Math.floor((today - new Date(jira.updatedAt || jira.createdAt)) / (1000 * 60 * 60 * 24))
            });
          } else if (statusLower.includes('in progress') || statusLower.includes('develop')) {
            inProgressTasks.push({
              ...jira,
              assignee: memberInfo.username
            });
          } else if (statusLower.includes('ready') && statusLower.includes('prod')) {
            readyForDeployTasks.push({
              ...jira,
              assignee: memberInfo.username
            });
          }
        } else {
          // Check if completed this month based on status
          const actualStatus = (jira.actualStatus || '').toLowerCase();
          const jiraStatus = (jira.jiraStatus || '').toLowerCase();
          
          const isCompletedStatus = actualStatus === 'done' || 
                                  jiraStatus === 'done' || 
                                  jiraStatus === 'closed' || 
                                  jiraStatus === 'deployed to production';
          
          if (isCompletedStatus) {
            // Check if it was updated/completed this month
            const updatedDate = jira.updatedAt ? new Date(jira.updatedAt) : new Date(jira.createdAt);
            if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
              totalCompletedThisMonth++;
              memberStats[memberInfo.username].completedThisMonth++;
            }
          }
        }

        // Project stats
        if (jira.projectName) {
          projectStats[jira.projectName] = projectStats[jira.projectName] || {
            name: jira.projectName,
            activeTasks: 0,
            totalHours: 0
          };
          if (isActive) projectStats[jira.projectName].activeTasks++;
        }

        // Process daily logs
        if (jira.dailyLogs && Array.isArray(jira.dailyLogs)) {
          jira.dailyLogs.forEach(log => {
            const logDate = new Date(log.logDate);
            const hours = parseFloat(log.timeSpent || 0);
            
            // This month's hours
            if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
              totalLoggedHours += hours;
              memberStats[memberInfo.username].hoursThisMonth += hours;
              if (jira.projectName) projectStats[jira.projectName].totalHours += hours;
            }
            
            // This week's hours
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            if (logDate >= weekStart && logDate <= today) {
              totalLoggedHoursThisWeek += hours;
              memberStats[memberInfo.username].hoursThisWeek += hours;
            }
          });
        }

        // Deployment stats
        const checkDeploymentDate = (date, stage) => {
          if (!date) return;
          const deployDate = new Date(date);
          
          // Check if deployment is in current month
          if (deployDate.getMonth() === currentMonth && deployDate.getFullYear() === currentYear) {
            deploymentStats.thisMonth[stage]++;
          } 
          // Check if deployment is in next month
          else if ((deployDate.getMonth() === currentMonth + 1 && deployDate.getFullYear() === currentYear) ||
                   (currentMonth === 11 && deployDate.getMonth() === 0 && deployDate.getFullYear() === currentYear + 1)) {
            deploymentStats.nextMonth[stage]++;
          }
        };

        checkDeploymentDate(jira.deploySitDate, 'sit');
        checkDeploymentDate(jira.deployUatDate, 'uat');
        checkDeploymentDate(jira.deployPreprodDate, 'preprod');
        checkDeploymentDate(jira.deployProdDate, 'prod');
      });
    });

    // Calculate derived metrics
    const teamSize = Object.keys(memberStats).length;
    const expectedHours = workingDaysPassed * 8 * teamSize;
    const monthProgress = (workingDaysPassed / workingDays) * 100;
    const utilizationRate = expectedHours > 0 ? (totalLoggedHours / expectedHours) * 100 : 0;
    const avgHoursPerPerson = teamSize > 0 ? totalLoggedHours / teamSize : 0;
    const avgTasksPerPerson = teamSize > 0 ? totalActiveTasks / teamSize : 0;
    const completionRate = totalActiveTasks > 0 ? ((totalCompletedThisMonth / (totalActiveTasks + totalCompletedThisMonth)) * 100) : 0;

    // Sort data
    const topContributors = Object.values(memberStats)
      .sort((a, b) => b.hoursThisMonth - a.hoursThisMonth)
      .slice(0, 5);
    
    const topProjects = Object.values(projectStats)
      .sort((a, b) => b.activeTasks - a.activeTasks)
      .slice(0, 5);

    blockedTasks.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

    // Get top status categories
    const statusCategories = Object.entries(taskStatusDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      teamSize,
      monthProgress,
      workingDays,
      workingDaysPassed,
      totalLoggedHours,
      totalLoggedHoursThisWeek,
      expectedHours,
      utilizationRate,
      avgHoursPerPerson,
      avgTasksPerPerson,
      totalActiveTasks,
      totalCompletedThisMonth,
      completionRate,
      blockedTasks: blockedTasks.slice(0, 5),
      inProgressCount: inProgressTasks.length,
      readyForDeployCount: readyForDeployTasks.length,
      statusCategories,
      topContributors,
      topProjects,
      deploymentStats,
      memberStats: Object.values(memberStats)
    };
  }, [teamData, workingDaysData]);

  if (!summary) return null;

  const StatCard = ({ title, value, subtitle }) => (
    <div className="bg-white p-4 border border-gray-200">
      <div className="text-2xl font-light text-black mb-1">{value}</div>
      <div className="text-sm text-gray-700">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  return (
    <div className="space-y-4 text-black">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Team Size"
          value={summary.teamSize}
          subtitle="members"
        />
        <StatCard
          title="Active Tasks"
          value={summary.totalActiveTasks}
          subtitle={`${summary.avgTasksPerPerson.toFixed(1)} per person`}
        />
        <StatCard
          title="Hours This Month"
          value={`${summary.totalLoggedHours.toFixed(0)}h / ${summary.expectedHours}h`}
          subtitle={`${summary.utilizationRate.toFixed(0)}% utilization`}
        />
        <StatCard
          title="Completed"
          value={summary.totalCompletedThisMonth}
          subtitle="this month"
        />
      </div>

      {/* Progress & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Month Progress */}
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-black">Month Progress</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Day {summary.workingDaysPassed} of {summary.workingDays}</span>
              <span className="text-sm font-medium text-black">{summary.monthProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 mb-4">
              <div 
                className="bg-black h-2 transition-all duration-500" 
                style={{ width: `${summary.monthProgress}%` }}
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium">{summary.completionRate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team Velocity</span>
                <span className="font-medium">{(summary.totalCompletedThisMonth / summary.workingDaysPassed || 0).toFixed(1)} tasks/day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Pipeline */}
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-black">Deployments This Month</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-light text-black mb-1">{summary.deploymentStats.thisMonth.sit}</div>
                <div className="text-xs text-gray-600">SIT</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-black mb-1">{summary.deploymentStats.thisMonth.uat}</div>
                <div className="text-xs text-gray-600">UAT</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-black mb-1">{summary.deploymentStats.thisMonth.preprod}</div>
                <div className="text-xs text-gray-600">PREPROD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-black mb-1">{summary.deploymentStats.thisMonth.prod}</div>
                <div className="text-xs text-gray-600">PROD</div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="text-xs text-gray-600 mb-2">Next Month</div>
              <div className="flex justify-between text-sm">
                <span>{summary.deploymentStats.nextMonth.sit} SIT</span>
                <span>{summary.deploymentStats.nextMonth.uat} UAT</span>
                <span>{summary.deploymentStats.nextMonth.preprod} PRE</span>
                <span>{summary.deploymentStats.nextMonth.prod} PROD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-medium text-black">Top Contributors This Month</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {summary.topContributors.slice(0, 5).map((member, index) => (
              <div key={member.username} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-light text-gray-500 w-6">{index + 1}</span>
                  <img 
                    src={getAvatarUrl(member.username)} 
                    alt={member.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium text-black">{member.username}</div>
                    <div className="text-xs text-gray-500">{member.activeTasks} active tasks</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-black">{member.hoursThisMonth.toFixed(0)}h</div>
                  <div className="text-xs text-gray-500">{member.hoursThisWeek.toFixed(0)}h this week</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-medium text-black">Active Projects</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {summary.topProjects.map(project => (
              <div key={project.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-black truncate">{project.name}</span>
                  <span className="text-sm font-medium">{project.activeTasks} tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 h-2">
                    <div 
                      className="bg-black h-2" 
                      style={{ 
                        width: `${(project.activeTasks / summary.totalActiveTasks) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {project.totalHours > 0 ? `${project.totalHours.toFixed(0)}h` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-medium text-black">Team Weekly Activity (Last 14 Days)</h3>
        </div>
        <div className="p-4">
          <WeeklyActivityGrid teamData={teamData} />
        </div>
      </div>

      {/* Blocked Tasks */}
      {summary.blockedTasks.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-black">Blocked Tasks</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {summary.blockedTasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 border border-gray-200">
                  <div className="flex items-center gap-3 flex-1">
                    <img 
                      src={getAvatarUrl(task.assignee)} 
                      alt={task.assignee}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-black">{task.jiraNumber}</span>
                        <span className="text-sm text-gray-600 truncate">{task.description?.slice(0, 40)}...</span>
                      </div>
                      <div className="text-xs text-gray-500">{task.assignee} • {task.actualStatus}</div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {task.daysSinceUpdate === 0 ? 'Today' : `${task.daysSinceUpdate}d ago`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSummary;