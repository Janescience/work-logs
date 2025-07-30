// components/ProductivityInsights.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faTrophy, 
  faExclamationTriangle,
  faChartLine,
  faFire
} from '@fortawesome/free-solid-svg-icons';

const ProductivityInsights = ({ allJiras }) => {
  const insights = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dayOfWeek = today.getDay();
    
    // Calculate various metrics
    let totalMonthlyHours = 0;
    let workingDays = 0;
    let daysWithLogs = new Set();
    let hoursByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    let taskCompletionTimes = [];
    let mostProductiveDay = { date: null, hours: 0 };
    let currentStreak = 0;
    let longestStreak = 0;
    let lastLogDate = null;

    // Analyze logs
    allJiras.forEach(jira => {
      const createdDate = new Date(jira.createdAt);
      const completedDate = jira.actualStatus === 'Done' && jira.updatedAt ? new Date(jira.updatedAt) : null;
      
      if (completedDate) {
        const completionTime = (completedDate - createdDate) / (1000 * 60 * 60 * 24); // days
        taskCompletionTimes.push(completionTime);
      }

      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        const hours = parseFloat(log.timeSpent || 0);
        
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
          totalMonthlyHours += hours;
          const dateKey = logDate.toDateString();
          daysWithLogs.add(dateKey);
          
          // Track most productive day
          if (!mostProductiveDay.date || hours > mostProductiveDay.hours) {
            mostProductiveDay = { date: logDate, hours };
          }
        }

        // Hours by day of week
        hoursByDayOfWeek[logDate.getDay()] += hours;

        // Calculate streak
        if (!lastLogDate || (logDate - lastLogDate) / (1000 * 60 * 60 * 24) <= 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
        lastLogDate = logDate;
      });
    });

    // Calculate working days in current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
    }

    // Find most productive day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let maxDayHours = 0;
    let mostProductiveDayOfWeek = '';
    hoursByDayOfWeek.forEach((hours, index) => {
      if (hours > maxDayHours) {
        maxDayHours = hours;
        mostProductiveDayOfWeek = dayNames[index];
      }
    });

    // Average completion time
    const avgCompletionTime = taskCompletionTimes.length > 0
      ? taskCompletionTimes.reduce((a, b) => a + b, 0) / taskCompletionTimes.length
      : 0;

    // Productivity score (0-100)
    const targetHoursPerDay = 8;
    const actualAvgHours = daysWithLogs.size > 0 ? totalMonthlyHours / daysWithLogs.size : 0;
    const consistencyScore = (daysWithLogs.size / workingDays) * 100; // 0-100
    const hoursScore = Math.min(100, (actualAvgHours / targetHoursPerDay) * 100); // เป้าหมาย 6 ชม./วัน
    const productivityScore = Math.round((consistencyScore * 0.6) + (hoursScore * 0.4));

    return {
      productivityScore,
      avgHoursPerDay: actualAvgHours,
      daysWorked: daysWithLogs.size,
      workingDays,
      mostProductiveDay,
      mostProductiveDayOfWeek,
      avgCompletionTime,
      currentStreak,
      longestStreak,
      totalMonthlyHours
    };
  }, [allJiras]);

  const getProductivityMessage = (score) => {
    if (score >= 90) return { text: "Excellent productivity!", icon: faTrophy, color: "text-green-600" };
    if (score >= 75) return { text: "Great job! Keep it up!", icon: faFire, color: "text-orange-600" };
    if (score >= 60) return { text: "Good progress!", icon: faChartLine, color: "text-blue-600" };
    return { text: "Room for improvement", icon: faExclamationTriangle, color: "text-yellow-600" };
  };

  const message = getProductivityMessage(insights.productivityScore);

  return (
    <div className="bg-white p-6 border border-gray-300 mb-6">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faLightbulb} className="mr-2 text-gray-600 text-base" />
        Productivity Insights
      </h2>

      {/* Productivity Score */}
      <div className="mb-6 text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#000000"
              strokeWidth="12"
              strokeDasharray={`${insights.productivityScore * 3.52} 352`}
              strokeDashoffset="88"
              transform="rotate(-90 64 64)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute">
            <div className="text-3xl font-bold text-black">{insights.productivityScore}%</div>
            <div className="text-xs text-gray-600">Productivity</div>
          </div>
        </div>
        <div className={`mt-3 ${message.color} flex items-center justify-center gap-2`}>
          <FontAwesomeIcon icon={message.icon} />
          <span className="font-medium">{message.text}</span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">Avg Hours/Day</div>
          <div className="text-xl font-bold text-black">{insights.avgHoursPerDay.toFixed(1)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">Days Loged</div>
          <div className="text-xl font-bold text-black">{insights.daysWorked}/{insights.workingDays}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">Most Productive</div>
          <div className="text-lg font-bold text-black">{insights.mostProductiveDayOfWeek}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="text-gray-600">Avg Task Time</div>
          <div className="text-xl font-bold text-black">{insights.avgCompletionTime.toFixed(1)}d</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
        <ul className="space-y-1 text-xs text-gray-600">
          {insights.avgHoursPerDay < 6 && (
            <li>• Try to log at least 6-8 hours daily for better tracking</li>
          )}
          {insights.daysWorked < insights.workingDays * 0.8 && (
            <li>• You've missed logging on some working days</li>
          )}
          {insights.avgCompletionTime > 7 && (
            <li>• Consider breaking down large tasks into smaller ones</li>
          )}
          {insights.mostProductiveDayOfWeek && (
            <li>• Schedule important tasks on {insights.mostProductiveDayOfWeek}s</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProductivityInsights;