'use client';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useHolidays } from '@/hooks/useHolidays';

const HolidaysDisplay = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const { holidays, holidayDetails, isLoading, error } = useHolidays(currentYear);
  
  // Debug: ดูข้อมูลที่ได้จาก API
  console.log('HolidaysDisplay - holidayDetails:', Array.from(holidayDetails.entries()).slice(0, 3));

  const yearlyHolidays = useMemo(() => {
    if (!holidays || holidays.size === 0) return [];
    
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ][i],
      holidays: []
    }));
    
    holidays.forEach(holidayDateStr => {
      const holidayDate = new Date(holidayDateStr);
      if (holidayDate.getFullYear() === currentYear) {
        const monthIndex = holidayDate.getMonth();
        const holidayInfo = holidayDetails.get(holidayDateStr) || { name: 'Holiday', nameEng: '', weekDay: '' };
        monthsData[monthIndex].holidays.push({
          date: holidayDate,
          dateStr: holidayDateStr,
          name: typeof holidayInfo === 'string' ? holidayInfo : holidayInfo.name,
          nameEng: typeof holidayInfo === 'object' ? holidayInfo.nameEng : '',
          weekDay: typeof holidayInfo === 'object' ? holidayInfo.weekDay : ''
        });
      }
    });
    
    // Sort holidays within each month
    monthsData.forEach(monthData => {
      monthData.holidays.sort((a, b) => a.date - b.date);
    });
    
    return monthsData;
  }, [holidays, holidayDetails, currentYear]);

  if (isLoading) {
    return (
      <div className="bg-white p-4 border border-gray-300">
        <h2 className="text-lg font-medium text-black mb-3 flex items-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
          Holidays {currentYear}
        </h2>
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 border border-gray-300">
        <h2 className="text-lg font-medium text-black mb-3 flex items-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
          Holidays {currentYear}
        </h2>
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">Unable to load</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border border-gray-300">
      <h2 className="text-lg font-medium text-black mb-3 flex items-center">
        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-gray-600" />
        Holidays {currentYear}
      </h2>

      <div className="space-y-2 max-h-98 overflow-y-auto">
        {yearlyHolidays.map((monthData, monthIndex) => {
          const isCurrentMonth = monthIndex === currentMonth;
          const hasHolidays = monthData.holidays.length > 0;
          
          if (!hasHolidays) return null;
          
          return (
            <div
              key={monthIndex}
              className={`border-l-2 pl-3 py-2 ${
                isCurrentMonth 
                  ? 'border-l-black bg-gray-50' 
                  : 'border-l-gray-200'
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isCurrentMonth ? 'text-black' : 'text-gray-600'
              }`}>
                {monthData.name.toUpperCase()}
                {isCurrentMonth && (
                  <span className="ml-2 bg-black text-white px-1 py-0.5 text-xs rounded">
                    CURRENT
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {monthData.holidays.map((holiday, holidayIndex) => {
                  const isToday = holiday.date.toDateString() === currentDate.toDateString();
                  const isPast = holiday.date < currentDate && !isToday;
                  
                  return (
                    <div
                      key={holidayIndex}
                      className={`flex items-center gap-2 text-xs ${
                        isToday 
                          ? 'text-black font-medium' 
                          : isPast 
                          ? 'text-gray-400' 
                          : 'text-gray-700'
                      }`}
                    >
                      <span className="font-mono w-6 text-center">
                        {holiday.date.getDate()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-black truncate">
                          {holiday.nameEng}
                        </div>

                      </div>
                      {isToday && (
                        <span className="bg-black text-white px-1 py-0.5 rounded text-xs">
                          TODAY
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>
            {yearlyHolidays.reduce((sum, month) => sum + month.holidays.length, 0)} holidays
          </span>
          <span>
            {yearlyHolidays.filter(month => month.holidays.length > 0).length} months
          </span>
        </div>
      </div>
    </div>
  );
};

export default HolidaysDisplay;