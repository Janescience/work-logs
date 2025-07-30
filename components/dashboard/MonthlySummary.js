// components/MonthlySummary.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faTrendUp, 
  faTrendDown, 
  faEquals,
  faAward,
  faClock
} from '@fortawesome/free-solid-svg-icons';

const MonthlySummary = ({ allJiras }) => {
  const summaryData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Helper function to check if date is in specific month
    const isInMonth = (date, month, year) => {
      return date.getMonth() === month && date.getFullYear() === year;
    };
    
    // Initialize counters
    let currentMonthData = {
      totalHours: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdTasks: 0,
      activeProjects: new Set(),
      loggedDays: new Set(),
      topProject: { name: '', hours: 0 }
    };
    
    let prevMonthData = {
      totalHours: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdTasks: 0,
      activeProjects: new Set(),
      loggedDays: new Set()
    };
    
    // Project hours tracking
    const currentProjectHours = {};
    
    allJiras.forEach(jira => {
      const createdDate = new Date(jira.createdAt);
      const updatedDate = jira.updatedAt ? new Date(jira.updatedAt) : null;
      
      // Track task creation
      if (isInMonth(createdDate, currentMonth, currentYear)) {
        currentMonthData.createdTasks++;
        if (jira.projectName) currentMonthData.activeProjects.add(jira.projectName);
      }
      if (isInMonth(createdDate, prevMonth, prevYear)) {
        prevMonthData.createdTasks++;
        if (jira.projectName) prevMonthData.activeProjects.add(jira.projectName);
      }
      
      // Track task completion
      if (jira.actualStatus === 'Done' && updatedDate) {
        if (isInMonth(updatedDate, currentMonth, currentYear)) {
          currentMonthData.completedTasks++;
        }
        if (isInMonth(updatedDate, prevMonth, prevYear)) {
          prevMonthData.completedTasks++;
        }
      }
      
      // Process daily logs
      jira.dailyLogs?.forEach(log => {
        const logDate = new Date(log.logDate);
        const hours = parseFloat(log.timeSpent || 0);
        
        if (isInMonth(logDate, currentMonth, currentYear)) {
          currentMonthData.totalHours += hours;
          currentMonthData.loggedDays.add(logDate.toDateString());
          
          // Track project hours
          if (jira.projectName) {
            currentProjectHours[jira.projectName] = (currentProjectHours[jira.projectName] || 0) + hours;
          }
        }
        
        if (isInMonth(logDate, prevMonth, prevYear)) {
          prevMonthData.totalHours += hours;
          prevMonthData.loggedDays.add(logDate.toDateString());
        }
      });
    });
    
    // Find top project
    let topProjectName = '';
    let topProjectHours = 0;
    Object.entries(currentProjectHours).forEach(([name, hours]) => {
      if (hours > topProjectHours) {
        topProjectName = name;
        topProjectHours = hours;
      }
    });
    currentMonthData.topProject = { name: topProjectName, hours: topProjectHours };
    
    // Calculate changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const changes = {
      hours: calculateChange(currentMonthData.totalHours, prevMonthData.totalHours),
      tasks: calculateChange(currentMonthData.createdTasks, prevMonthData.createdTasks),
      completed: calculateChange(currentMonthData.completedTasks, prevMonthData.completedTasks),
      projects: calculateChange(currentMonthData.activeProjects.size, prevMonthData.activeProjects.size)
    };
    
    // Calculate additional metrics
    const workingDays = 22; // Approximate working days per month
    const avgHoursPerDay = currentMonthData.loggedDays.size > 0 
      ? currentMonthData.totalHours / currentMonthData.loggedDays.size 
      : 0;
    const consistency = (currentMonthData.loggedDays.size / workingDays) * 100;
    
    return {
      current: {
        ...currentMonthData,
        activeProjects: currentMonthData.activeProjects.size,
        loggedDays: currentMonthData.loggedDays.size
      },
      previous: {
        ...prevMonthData,
        activeProjects: prevMonthData.activeProjects.size,
        loggedDays: prevMonthData.loggedDays.size
      },
      changes,
      avgHoursPerDay,
      consistency,
      monthName: today.toLocaleDateString('en-US', { month: 'long' }),
      prevMonthName: new Date(prevYear, prevMonth).toLocaleDateString('en-US', { month: 'long' })
    };
  }, [allJiras]);
  
  const getTrendIcon = (change) => {
    if (change > 5) return { icon: faTrendUp, color: 'text-green-600' };
    if (change < -5) return { icon: faTrendDown, color: 'text-red-600' };
    return { icon: faEquals, color: 'text-gray-600' };
  };
  
  const formatChange = (change) => {
    const absChange = Math.abs(change);
    if (absChange < 0.1) return '0%';
    return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
  };
  
  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-600 text-base" />
        Monthly Summary
      </h2>
      
      <div className="text-sm text-gray-600 mb-4">
        {summaryData.monthName} vs {summaryData.prevMonthName}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Hours Logged</span>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon 
                icon={getTrendIcon(summaryData.changes.hours).icon} 
                className={`text-xs ${getTrendIcon(summaryData.changes.hours).color}`}
              />
              <span className={`text-xs ${getTrendIcon(summaryData.changes.hours).color}`}>
                {formatChange(summaryData.changes.hours)}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-black">
            {summaryData.current.totalHours.toFixed(1)}h
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Tasks Created</span>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon 
                icon={getTrendIcon(summaryData.changes.tasks).icon} 
                className={`text-xs ${getTrendIcon(summaryData.changes.tasks).color}`}
              />
              <span className={`text-xs ${getTrendIcon(summaryData.changes.tasks).color}`}>
                {formatChange(summaryData.changes.tasks)}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-black">
            {summaryData.current.createdTasks}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Tasks Completed</span>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon 
                icon={getTrendIcon(summaryData.changes.completed).icon} 
                className={`text-xs ${getTrendIcon(summaryData.changes.completed).color}`}
              />
              <span className={`text-xs ${getTrendIcon(summaryData.changes.completed).color}`}>
                {formatChange(summaryData.changes.completed)}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-black">
            {summaryData.current.completedTasks}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Active Projects</span>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon 
                icon={getTrendIcon(summaryData.changes.projects).icon} 
                className={`text-xs ${getTrendIcon(summaryData.changes.projects).color}`}
              />
              <span className={`text-xs ${getTrendIcon(summaryData.changes.projects).color}`}>
                {formatChange(summaryData.changes.projects)}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-black">
            {summaryData.current.activeProjects}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 mb-1">Daily Average</div>
            <div className="font-bold text-black flex items-center gap-1">
              <FontAwesomeIcon icon={faClock} className="text-gray-600 text-xs" />
              {summaryData.avgHoursPerDay.toFixed(1)}h/day
            </div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Consistency</div>
            <div className="font-bold text-black">
              {summaryData.consistency.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Project */}
      {summaryData.current.topProject.name && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={faAward} className="text-yellow-600" />
            <span className="text-gray-600">Top Project:</span>
            <span className="font-medium text-black truncate">
              {summaryData.current.topProject.name}
            </span>
            <span className="text-gray-600">
              ({summaryData.current.topProject.hours.toFixed(1)}h)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;