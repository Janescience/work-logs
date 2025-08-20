// components/dashboard/LoggingTracker.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, 
  faExclamationTriangle, 
  faCheckCircle,
  faTimesCircle,
  faClock,
  faBalanceScale
} from '@fortawesome/free-solid-svg-icons';
import { useWorkingDays } from '@/hooks/useWorkingDays';

const LoggingTracker = ({ allJiras }) => {
  const { 
    getCurrentMonthWorkingDays, 
    getWorkingDaysPassed, 
    getRemainingWorkingDays,
    isWorkingDay
  } = useWorkingDays();

  const trackingData = useMemo(() => {
    if (!allJiras || allJiras.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    // Calculate working days
    const totalWorkingDays = getCurrentMonthWorkingDays(true); // Include holidays
    const workingDaysPassed = getWorkingDaysPassed(true);
    const remainingWorkingDays = getRemainingWorkingDays(true);

    // Standard hours calculation
    const standardHoursPerMonth = totalWorkingDays * 8;
    const expectedHoursToDate = workingDaysPassed * 8;

    // Collect all daily logs for current month
    const currentMonthLogs = [];
    const dailyLogHours = {}; // Date -> hours logged

    allJiras.forEach(jira => {
      if (jira.dailyLogs) {
        jira.dailyLogs.forEach(log => {
          const logDate = new Date(log.logDate);
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            const dateKey = logDate.toDateString();
            const hours = parseFloat(log.timeSpent || 0);
            
            currentMonthLogs.push({
              date: logDate,
              hours,
              jiraNumber: jira.jiraNumber,
              description: log.taskDescription
            });

            dailyLogHours[dateKey] = (dailyLogHours[dateKey] || 0) + hours;
          }
        });
      }
    });

    // Calculate total hours logged this month
    const totalHoursLogged = Object.values(dailyLogHours).reduce((sum, hours) => sum + hours, 0);

    // Analyze daily logging patterns
    const dailyAnalysis = [];
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    for (let day = 1; day <= today; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = date.toDateString();
      const hoursLogged = dailyLogHours[dateKey] || 0;
      const isWorking = isWorkingDay(date, true);

      if (isWorking) {
        let status = 'normal';
        let message = '';

        if (hoursLogged === 0) {
          status = 'missing';
          message = 'No logs';
        } else if (hoursLogged < 6) {
          status = 'low';
          message = 'Under-logged';
        } else if (hoursLogged > 10) {
          status = 'high';
          message = 'Over-logged';
        } else {
          status = 'good';
          message = 'Good';
        }

        dailyAnalysis.push({
          date,
          day,
          hoursLogged,
          status,
          message
        });
      }
    }

    // Calculate remaining hours needed
    const hoursDeficit = expectedHoursToDate - totalHoursLogged;
    const averageHoursPerRemainingDay = remainingWorkingDays > 0 
      ? (standardHoursPerMonth - totalHoursLogged) / remainingWorkingDays 
      : 0;

    // Performance indicators
    const performanceRatio = expectedHoursToDate > 0 
      ? (totalHoursLogged / expectedHoursToDate) * 100 
      : 0;

    const problemDays = dailyAnalysis.filter(day => 
      day.status === 'missing' || day.status === 'low'
    );

    const overLoggedDays = dailyAnalysis.filter(day => 
      day.status === 'high'
    );

    return {
      totalWorkingDays,
      workingDaysPassed,
      remainingWorkingDays,
      standardHoursPerMonth,
      expectedHoursToDate,
      totalHoursLogged,
      hoursDeficit,
      averageHoursPerRemainingDay,
      performanceRatio,
      dailyAnalysis,
      problemDays,
      overLoggedDays,
      currentDay: today
    };
  }, [allJiras, getCurrentMonthWorkingDays, getWorkingDaysPassed, getRemainingWorkingDays, isWorkingDay]);

  if (!trackingData) {
    return (
      <div className="bg-white p-4 border border-gray-300">
        <h2 className="text-lg font-medium text-black mb-3 flex items-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
          Logging Tracker
        </h2>
        <p className="text-gray-500 text-center py-4">No logging data available</p>
      </div>
    );
  }

  const getPerformanceStatus = (ratio) => {
    if (ratio >= 95) return { color: 'text-green-600', icon: faCheckCircle, label: 'Excellent' };
    if (ratio >= 85) return { color: 'text-blue-600', icon: faBalanceScale, label: 'Good' };
    if (ratio >= 70) return { color: 'text-yellow-600', icon: faExclamationTriangle, label: 'Behind' };
    return { color: 'text-red-600', icon: faTimesCircle, label: 'Critical' };
  };

  const performanceStatus = getPerformanceStatus(trackingData.performanceRatio);

  return (
    <div className="bg-white p-4 border border-gray-300">
      <h2 className="text-lg font-medium text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
        Logging Tracker
      </h2>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600 uppercase">Progress</span>
            <FontAwesomeIcon 
              icon={performanceStatus.icon} 
              className={`text-sm ${performanceStatus.color}`} 
            />
          </div>
          <div className="text-lg font-bold text-black">
            {trackingData.performanceRatio.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {performanceStatus.label}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-xs font-medium text-gray-600 uppercase mb-1">Hours Status</div>
          <div className="text-lg font-bold text-black">
            {trackingData.totalHoursLogged.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-500">
            of {trackingData.expectedHoursToDate}h expected
          </div>
        </div>
      </div>

      {/* Daily Requirement */}
      {trackingData.remainingWorkingDays > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">
                Required daily average
              </div>
              <div className="text-xs text-blue-600">
                For remaining {trackingData.remainingWorkingDays} working days
              </div>
            </div>
            <div className="text-lg font-bold text-blue-800">
              {trackingData.averageHoursPerRemainingDay.toFixed(1)}h/day
            </div>
          </div>
        </div>
      )}

      {/* Problem Days Alert */}
      {trackingData.problemDays.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-800 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                Problem Days
              </div>
              <div className="text-xs text-red-600">
                {trackingData.problemDays.length} days with insufficient logging
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-red-600">
                {trackingData.problemDays.map(day => day.day).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Over-logged Days */}
      {trackingData.overLoggedDays.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-800">
                Over-logged Days
              </div>
              <div className="text-xs text-yellow-600">
                {trackingData.overLoggedDays.length} days with excess logging
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-yellow-600">
                {trackingData.overLoggedDays.map(day => day.day).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="border-t border-gray-200 pt-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-600">Target</div>
            <div className="text-lg font-bold text-black">
              {trackingData.standardHoursPerMonth}h
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Logged</div>
            <div className="text-lg font-bold text-black">
              {trackingData.totalHoursLogged.toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">
              {trackingData.hoursDeficit > 0 ? 'Deficit' : 'Surplus'}
            </div>
            <div className={`text-lg font-bold ${
              trackingData.hoursDeficit > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {Math.abs(trackingData.hoursDeficit).toFixed(1)}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingTracker;