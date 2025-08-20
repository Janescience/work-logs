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

    // Generate performance assessment message based on monthly progress
    const getAssessmentMessage = () => {
      // Calculate expected progress based on working days passed
      const expectedProgressRatio = workingDaysPassed / totalWorkingDays;
      const actualVsExpected = performanceRatio / 100 / expectedProgressRatio;
      
      if (performanceRatio >= 120) {
        return "You're working too hard! Take some time to rest and relax.";
      } else if (actualVsExpected >= 1.1) {
        return "Impressive! You're exceeding expectations. Can we get this energy next month too?";
      } else if (actualVsExpected >= 1.0) {
        return "Perfect! You've hit your target. Keep up the excellent work!";
      } else if (actualVsExpected >= 0.95) {
        return "Almost there! Just a little more push and you'll reach the goal. You got this!";
      } else if (actualVsExpected >= 0.85) {
        return "Good progress! Stay focused and you'll catch up in no time.";
      } else if (actualVsExpected >= 0.7) {
        return "Time to step up the game! The month isn't over yet - you can still make it count.";
      } else if (actualVsExpected >= 0.5) {
        return "Are you taking it easy this month? Looks like you could take on more work!";
      } else {
        return "Too chill this month? Time to wake up and show what you're capable of!";
      }
    };

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
      currentDay: today,
      assessmentMessage: getAssessmentMessage()
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

  return (
    <div className="bg-white p-4 border border-gray-300">
      <h2 className="text-lg font-medium text-black mb-3 flex items-center">
        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
        Logging Tracker
      </h2>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-bold text-black">
            {trackingData.performanceRatio.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Progress</div>
        </div>
        
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-bold text-black">
            {trackingData.totalHoursLogged.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-600">Logged</div>
        </div>
        
        <div className="text-center p-2 border border-gray-200">
          <div className="text-lg font-bold text-black">
            {trackingData.averageHoursPerRemainingDay.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-600">Need/Day</div>
        </div>
      </div>

      {/* Monthly Target Info */}
      <div className="flex items-center justify-between text-sm mb-3 bg-gray-50 p-2">
        <span className="text-gray-700">Monthly Target: {trackingData.standardHoursPerMonth}h</span>
        <span className="text-gray-700">Working Days Left: {trackingData.remainingWorkingDays}</span>
      </div>

      {/* Problem Days Details */}
      {trackingData.problemDays.length > 0 && (
        <div className="border-l-2 border-black pl-2 mb-2">
          <div className="text-sm font-medium text-black mb-1">
            Problem Days ({trackingData.problemDays.length})
          </div>
          {trackingData.problemDays.map(day => (
            <div key={day.day} className="text-xs text-gray-600 flex justify-between">
              <span>Day {day.day}</span>
              <span>{day.hoursLogged}h ({day.message})</span>
            </div>
          ))}
        </div>
      )}

      {/* Over-logged Days Details */}
      {trackingData.overLoggedDays.length > 0 && (
        <div className="border-l-2 border-gray-400 pl-2 mb-2">
          <div className="text-sm font-medium text-black mb-1">
            Over-logged Days ({trackingData.overLoggedDays.length})
          </div>
          {trackingData.overLoggedDays.map(day => (
            <div key={day.day} className="text-xs text-gray-600 flex justify-between">
              <span>Day {day.day}</span>
              <span>{day.hoursLogged}h</span>
            </div>
          ))}
        </div>
      )}

      {/* Assessment Message */}
      <div className="border border-gray-300 p-3 mb-3 bg-gray-50">
        <div className="text-sm text-black italic">
          "{trackingData.assessmentMessage}"
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Expected: {trackingData.expectedHoursToDate}h
        </span>
        <span className={`font-medium ${
          trackingData.hoursDeficit > 0 ? 'text-black' : 'text-gray-600'
        }`}>
          {trackingData.hoursDeficit > 0 ? 'Deficit: ' : 'Surplus: '}{Math.abs(trackingData.hoursDeficit).toFixed(1)}h
        </span>
      </div>
    </div>
  );
};

export default LoggingTracker;