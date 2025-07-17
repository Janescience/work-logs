// src/utils/dateUtils.js
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

export  const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};