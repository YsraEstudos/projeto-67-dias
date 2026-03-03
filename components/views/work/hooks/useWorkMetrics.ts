import { useState, useEffect, useMemo } from 'react';
import { WorkStatus, WorkMetricsInput } from '../types';
import { BREAK_DURATION_MINUTES } from '../constants';
import { getMinutesFromMidnight } from '../utils';

/**
 * Handles the business logic for calculating work statistics, pace, and status.
 * Optimized to minimize re-renders by using minute-based updates.
 */
export const useWorkMetrics = ({
    goal, startTime, endTime, breakTime, currentCount, preBreakCount, paceMode
}: WorkMetricsInput) => {
    // Store only current minutes (number) instead of Date object to reduce GC
    const [nowMinutes, setNowMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    // Update clock every minute using setInterval (more efficient than rAF loop)
    useEffect(() => {
        // Update immediately on mount
        const updateNow = () => {
            const now = new Date();
            setNowMinutes(now.getHours() * 60 + now.getMinutes());
        };

        // Only update every 60 seconds
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                updateNow();
            }
        }, 60000);

        // Update immediately when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateNow();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return useMemo(() => {
        const startMins = getMinutesFromMidnight(startTime);
        const endMins = getMinutesFromMidnight(endTime);
        const breakStartMins = getMinutesFromMidnight(breakTime);
        const breakEndMins = breakStartMins + BREAK_DURATION_MINUTES;
        const currentMins = nowMinutes;

        // Total Work Duration (excluding 1h break)
        const totalWorkDuration = (endMins - startMins) - BREAK_DURATION_MINUTES;

        // Status Determination
        let status: WorkStatus = 'PRE_BREAK';
        if (currentMins >= endMins) status = 'FINISHED';
        else if (currentMins >= breakEndMins) status = 'POST_BREAK';
        else if (currentMins >= breakStartMins) status = 'BREAK';

        // Time Remaining Calculation
        let minutesRemaining = 0;
        if (status !== 'FINISHED') {
            minutesRemaining = Math.max(0, endMins - currentMins);
            // If currently before break end, subtract the remaining break time from work time
            if (currentMins < breakEndMins) {
                const breakMinutesLeft = Math.max(0, breakEndMins - Math.max(currentMins, breakStartMins));
                minutesRemaining -= breakMinutesLeft;
            }
        }

        // Progress
        const progressPercent = Math.min(100, Math.round((currentCount / (goal || 1)) * 100));

        // Break Analysis (Performance before break)
        const expectedPreBreakRatio = (breakStartMins - startMins) / (totalWorkDuration || 1);
        const expectedPreBreakCount = Math.round(goal * expectedPreBreakRatio);
        const breakDiff = preBreakCount - expectedPreBreakCount;
        // Only show negative performance if we've already passed the break time
        // Before the break time, always show positive (user still has time to catch up)
        const breakPerformance = (status === 'PRE_BREAK' || breakDiff >= 0 ? 'positive' : 'negative') as 'positive' | 'negative';

        // Pace Calculation (Required Speed)
        const itemsRemaining = Math.max(0, goal - currentCount);
        const requiredPacePerHour = minutesRemaining > 0 ? (itemsRemaining / minutesRemaining) * 60 : 0;

        const intervalPace = paceMode === '10m'
            ? requiredPacePerHour / 6
            : requiredPacePerHour * (25 / 60);

        return {
            status,
            minutesRemaining,
            progressPercent,
            expectedPreBreakCount,
            breakDiff,
            breakPerformance,
            requiredPacePerHour,
            intervalPace,
            itemsRemaining
        };
    }, [goal, startTime, endTime, breakTime, currentCount, preBreakCount, nowMinutes, paceMode]);
};
