'use client';
import { useState, useEffect } from 'react';

export function useHolidays(year) {
    const [holidays, setHolidays] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [holidayDetails, setHolidayDetails] = useState(new Map());
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year) return;
        
        setLoading(true);
        setError(null);
        
        fetch(`/api/holidays?year=${year}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch holidays, status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.holidays) {
                    const holidaySet = new Set();
                    const detailsMap = new Map();
                    
                    console.log('useHolidays - First few holidays from API:', data.holidays.slice(0, 3));
                    
                    data.holidays.forEach(h => {
                        // Format date consistently as YYYY-MM-DD
                        const date = new Date(h.date);
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        holidaySet.add(dateStr);
                        detailsMap.set(dateStr, {
                            name: h.name,
                            nameEng: h.nameEng || '',
                            weekDay: h.weekDay || ''
                        });
                    });
                    
                    setHolidays(holidaySet);
                    setHolidayDetails(detailsMap);
                } else {
                    setHolidays(new Set());
                    setHolidayDetails(new Map());
                }
            })
            .catch(err => {
                console.error("Failed to fetch holidays:", err);
                setError(err.message);
                setHolidays(new Set());
                setHolidayDetails(new Map());
            })
            .finally(() => setLoading(false));
    }, [year]);

    return { 
        holidays, 
        holidayDetails, 
        isLoading: loading,
        error 
    };
}