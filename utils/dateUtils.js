// src/utils/dateUtils.js

// Get working days in a month (excluding weekends only)
export const getWorkingDaysInMonth = (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    let workingDays = 0;
    while (date.getMonth() === monthIndex) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }
    return workingDays;
};

// Get working days in a month excluding both weekends and holidays
export const getWorkingDaysInMonthWithHolidays = (year, monthIndex, holidays = new Set()) => {
    const date = new Date(year, monthIndex, 1);
    let workingDays = 0;
    
    while (date.getMonth() === monthIndex) {
      const day = date.getDay();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Check if it's not weekend and not a holiday
      if (day !== 0 && day !== 6 && !holidays.has(dateStr)) {
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }
    return workingDays;
};

// Get working days between two dates (excluding weekends only)
export const getWorkingDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDays;
};

// Get working days between two dates excluding both weekends and holidays
export const getWorkingDaysBetweenWithHolidays = (startDate, endDate, holidays = new Set()) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const day = currentDate.getDay();
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        
        // Check if it's not weekend and not a holiday
        if (day !== 0 && day !== 6 && !holidays.has(dateStr)) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDays;
};

// Check if a date is a working day (not weekend, optionally exclude holidays)
export const isWorkingDay = (date, holidays = new Set()) => {
    const day = date.getDay();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return day !== 0 && day !== 6 && !holidays.has(dateStr);
};

// Calculate working hours capacity for a period
export const getWorkingHoursCapacity = (workingDays, hoursPerDay = 8) => {
    return workingDays * hoursPerDay;
};

// Format date as DD-MM-YYYY
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// Format date as YYYY-MM-DD (for holiday comparison)
export const formatDateISO = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};