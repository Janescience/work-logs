// components/WeeklyProgress.js
'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

const WeeklyProgress = ({ allJiras }) => {
  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day, index) => {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + index);
      
      let hoursLogged = 0;
      let tasksCompleted = 0;
      
      allJiras.forEach(jira => {
        jira.dailyLogs.forEach(log => {
          const logDate = new Date(log.logDate);
          if (logDate.toDateString() === currentDate.toDateString()) {
            hoursLogged += parseFloat(log.timeSpent || 0);
          }
        });
        
        // Check if task was completed on this day
        if (jira.actualStatus === 'Done' && jira.updatedAt) {
          const updatedDate = new Date(jira.updatedAt);
          if (updatedDate.toDateString() === currentDate.toDateString()) {
            tasksCompleted++;
          }
        }
      });

      return {
        day,
        date: currentDate.getDate(),
        hoursLogged,
        tasksCompleted,
        isToday: index === dayOfWeek,
        isPast: index < dayOfWeek
      };
    });

    const maxHours = Math.max(...data.map(d => d.hoursLogged), 8);
    const totalWeekHours = data.reduce((sum, d) => sum + d.hoursLogged, 0);

    return { data, maxHours, totalWeekHours };
  }, [allJiras]);

  return (
    <div className="bg-white p-6 border border-gray-300">
      <h2 className="text-xl font-light text-black mb-4 flex items-center">
        <FontAwesomeIcon icon={faChartLine} className="mr-2 text-gray-600 text-base" />
        Weekly Progress
      </h2>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Hours This Week</span>
          <span className=" text-black">{weekData.totalWeekHours.toFixed(1)} hrs</span>
        </div>
      </div>

      <div className="space-y-2">
        {weekData.data.map((day, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-12 text-sm ${day.isToday ? 'font-bold text-black' : 'text-gray-600'}`}>
              {day.day}
            </div>
            <div className="flex-grow">
              <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                    day.isToday ? 'bg-black' : day.isPast ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                  style={{ width: `${weekData.maxHours > 0 ? (day.hoursLogged / weekData.maxHours) * 100 : 0}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs ">
                    {day.hoursLogged > 0 && `${day.hoursLogged.toFixed(1)}h`}
                  </span>
                </div>
              </div>
            </div>
            {day.tasksCompleted > 0 && (
              <div className="text-xs text-green-600 font-medium">
                +{day.tasksCompleted} done
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Daily Target: 8 hours</span>
          <span>Average: {(weekData.totalWeekHours / 7).toFixed(1)} hrs/day</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgress;