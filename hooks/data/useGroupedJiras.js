// src/hooks/useGroupedJiras.js
import { useMemo } from 'react';
import { getWorkingDaysInMonth } from '@/utils/dateUtils';

function useGroupedJiras(allJiras, currentView) {
  return useMemo(() => {
    const groupedData = {};
    const calculatedMonthUsedHours = {}; // เก็บชั่วโมงที่ใช้ตาม logDate
    const calculatedMonthCapacities = {}; // เก็บ capacity ตาม logDate

    allJiras.forEach(jira => {
      if (jira.dailyLogs && jira.dailyLogs.length > 0) {
        jira.dailyLogs.forEach(log => {
          const logDate = new Date(log.logDate);
          const year = logDate.getFullYear();
          const month = (logDate.getMonth() + 1).toString().padStart(2, '0'); 
          const logYearMonthKey = `${year}-${month}`; // Key based on log date

          const logHours = parseFloat(log.timeSpent || 0);
          const monthIndex = logDate.getMonth();

          if (!calculatedMonthCapacities[logYearMonthKey]) {
            const workingDays = getWorkingDaysInMonth(logDate.getFullYear(), monthIndex);
            calculatedMonthCapacities[logYearMonthKey] = workingDays * 8;
          }
          calculatedMonthUsedHours[logYearMonthKey] = (calculatedMonthUsedHours[logYearMonthKey] || 0) + logHours;

          if (currentView === 'project') {
            groupDataBy('project',log, jira, groupedData, year, month, 'projectName');
          } else if (currentView === 'service') {
            groupDataBy('service',log, jira, groupedData, year, month, 'serviceName');
          } else if (currentView === 'environment') {
            groupDataBy('environment',log, jira, groupedData, year, month, 'environment');
          }
        });
      }else{
        const dueDateObj = new Date(jira.dueDate);
        const year = dueDateObj.getFullYear();
        const month = (dueDateObj.getMonth() + 1).toString().padStart(2, '0'); 

        if (currentView === 'project') {
          groupDataBy('project', null, jira, groupedData, year, month, 'projectName', true);
        } else if (currentView === 'service') {
          groupDataBy('service', null, jira, groupedData, year, month, 'serviceName', true);
        } else if (currentView === 'environment') {
          groupDataBy('environment', null, jira, groupedData, year, month, 'environment', true);
        }
      }

      // Group Jiras directly when currentView is 'jira'
      if (currentView === 'jira') {
        const jiraCreatedDate = new Date(jira.createdAt);
        const jiraMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(jiraCreatedDate);
        const jiraGroupKey = `${jiraCreatedDate.getFullYear()}-${jiraMonthName}`; // Key for grouping Jiras

        if (!groupedData[jiraGroupKey]) {
          groupedData[jiraGroupKey] = { jiras: [], totalHours: 0, capacity: 0, gap: 0 }; // Initialize with capacity and gap
        }
        groupedData[jiraGroupKey].jiras.push(jira);
        // totalHours for Jira view will be calculated in the final loop
      }
    });

    // Final calculations for totalHours, capacity, and gap based on the grouped data structure
    if (currentView === 'project' || currentView === 'service' || currentView === 'environment') {
      Object.values(groupedData).forEach(yearData => {
        Object.values(yearData).forEach(monthData => {
          monthData.forEach(item => {
            if(item.logs && item.logs.length > 0) {
              item.logs.sort((a,b) => new Date(a.logDate) - new Date(b.logDate));
            }
            const totalHoursForMonth = item.logs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
            item.totalHoursForMonth = totalHoursForMonth;
          });
        });
      });
    } else if (currentView === 'jira') {
      Object.keys(groupedData).forEach(groupKey => { // Renamed yearMonthKey to groupKey for clarity
        let totalHoursForGroup = 0;
        let capacityForGroup = 0;

        groupedData[groupKey].jiras.forEach(jira => {
          totalHoursForGroup += jira.dailyLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);

          // Calculate capacity for each Jira's creation month
          const jiraCreatedDate = new Date(jira.createdAt);
          const monthIndex = jiraCreatedDate.getMonth();
          const year = jiraCreatedDate.getFullYear();
          const workingDays = getWorkingDaysInMonth(year, monthIndex);
          capacityForGroup += workingDays * 8;
        });

        groupedData[groupKey].totalHours = totalHoursForGroup;
        groupedData[groupKey].capacity = capacityForGroup;
        groupedData[groupKey].gap = capacityForGroup - totalHoursForGroup;
      });
    }

    return { grouped: groupedData, monthUsedHours: calculatedMonthUsedHours, monthCapacities: calculatedMonthCapacities };
  }, [allJiras, currentView]);
}


function groupDataBy(currentView, log, jira, groupedData, year, monthName, itemNameKey) {
  const logHours = parseFloat(log?.timeSpent || 0);
  const logDate = new Date(log?.logDate || jira.dueDate);
  const logMonth = (logDate.getMonth() + 1).toString().padStart(2, '0');

  // Group Logs ภายใต้เดือนของ Log นั้นๆ
    const itemName = jira[itemNameKey] || `Unknown ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`;
    if (!groupedData[year]) groupedData[year] = {};
    if (!groupedData[year][monthName]) groupedData[year][monthName] = [];
    let itemInMonth = groupedData[year][monthName].find(item => item.name === itemName);
    if (!itemInMonth) {
      itemInMonth = { id: itemName, name: itemName, logs: [], totalHours: 0, jiras: [] };
      groupedData[year][monthName].push(itemInMonth);
    }
    if(log){
      itemInMonth.logs.push({ ...log, jiraId: jira._id?.$oid || jira._id });
    }
    itemInMonth.totalHours += logHours;
    if (!itemInMonth.jiras.find(j => (j._id?.$oid || j._id) === (jira._id?.$oid || jira._id))) {
      itemInMonth.jiras.push({
        ...jira,
        dailyLogs: jira.dailyLogs.filter(itemLog => {
          const itemLogDate = new Date(itemLog.logDate);
          const itemLogMonth = (itemLogDate.getMonth() + 1).toString().padStart(2, '0');
          return itemLogMonth === monthName;
        }),
      });
    }
  
}

export default useGroupedJiras;