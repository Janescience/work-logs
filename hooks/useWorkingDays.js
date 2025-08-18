'use client';
import { useMemo } from 'react';
import { useHolidays } from './useHolidays';
import { 
    getWorkingDaysInMonth, 
    getWorkingDaysInMonthWithHolidays,
    getWorkingDaysBetween,
    getWorkingDaysBetweenWithHolidays,
    getWorkingHoursCapacity,
    isWorkingDay
} from '@/utils/dateUtils';

export function useWorkingDays(year = new Date().getFullYear()) {
    const { holidays, isLoading: holidaysLoading, error } = useHolidays(year);

    // Memoized calculations
    const workingDaysCalculations = useMemo(() => {
        return {
            // Get working days in a specific month (current year)
            getMonthWorkingDays: (monthIndex, includeHolidays = false) => {
                if (includeHolidays && !holidaysLoading) {
                    return getWorkingDaysInMonthWithHolidays(year, monthIndex, holidays);
                }
                return getWorkingDaysInMonth(year, monthIndex);
            },

            // Get working days for current month
            getCurrentMonthWorkingDays: (includeHolidays = false) => {
                const currentMonth = new Date().getMonth();
                if (includeHolidays && !holidaysLoading) {
                    return getWorkingDaysInMonthWithHolidays(year, currentMonth, holidays);
                }
                return getWorkingDaysInMonth(year, currentMonth);
            },

            // Get working days between two dates
            getWorkingDaysBetweenDates: (startDate, endDate, includeHolidays = false) => {
                if (includeHolidays && !holidaysLoading) {
                    return getWorkingDaysBetweenWithHolidays(startDate, endDate, holidays);
                }
                return getWorkingDaysBetween(startDate, endDate);
            },

            // Get working hours capacity
            getWorkingHoursCapacity: (workingDays, hoursPerDay = 8) => {
                return getWorkingHoursCapacity(workingDays, hoursPerDay);
            },

            // Check if a specific date is a working day
            isWorkingDay: (date, includeHolidays = false) => {
                if (includeHolidays && !holidaysLoading) {
                    return isWorkingDay(date, holidays);
                }
                // Just check weekends
                const day = new Date(date).getDay();
                return day !== 0 && day !== 6;
            },

            // Get working days passed in current month
            getWorkingDaysPassed: (includeHolidays = false) => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                
                if (includeHolidays && !holidaysLoading) {
                    return getWorkingDaysBetweenWithHolidays(startOfMonth, now, holidays);
                }
                return getWorkingDaysBetween(startOfMonth, now);
            },

            // Get remaining working days in current month
            getRemainingWorkingDays: (includeHolidays = false) => {
                const now = new Date();
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                
                if (includeHolidays && !holidaysLoading) {
                    return getWorkingDaysBetweenWithHolidays(now, endOfMonth, holidays);
                }
                return getWorkingDaysBetween(now, endOfMonth);
            }
        };
    }, [holidays, holidaysLoading, year]);

    return {
        ...workingDaysCalculations,
        holidays,
        isLoading: holidaysLoading,
        error
    };
}