import { useState, useEffect, useMemo } from 'react';
import { WorkStatus, WorkMetricsInput } from '../types';
import { BREAK_DURATION_MINUTES } from '../constants';
import { getMinutesFromMidnight } from '../utils';
import { useWorkStore } from '../../../../stores';

/**
 * Handles the business logic for calculating work statistics, pace, and status.
 * Optimized to minimize re-renders by using minute-based updates.
 */
export const useWorkMetrics = ({
    goal, startTime, endTime, breakTime, currentCount, preBreakCount, paceMode
}: WorkMetricsInput) => {
    const ensureCurrentDay = useWorkStore((s) => s.ensureCurrentDay);

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
            ensureCurrentDay();
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
    }, [ensureCurrentDay]);

    return useMemo(() => {
        const hasBreak = !!breakTime && breakTime !== '';
        let startMins = getMinutesFromMidnight(startTime);
        let endMins = getMinutesFromMidnight(endTime);
        let breakStartMins = hasBreak ? getMinutesFromMidnight(breakTime) : 0;
        let currentMins = nowMinutes;

        // Ajuste para turnos que atravessam a meia-noite
        if (endMins <= startMins) {
            endMins += 24 * 60; // Soma 24h
        }
        
        // Ajusta o break se ele parecer estar na madrugada do turno
        if (hasBreak && breakStartMins < startMins && (breakStartMins + 24 * 60) <= endMins) {
            breakStartMins += 24 * 60;
        }

        // Ajusta o horário atual se estiver na madrugada do turno
        if (currentMins < startMins && (currentMins + 24 * 60) <= endMins + 60) {
            currentMins += 24 * 60;
        }

        const breakDuration = hasBreak ? BREAK_DURATION_MINUTES : 0;
        const breakEndMins = breakStartMins + breakDuration;

        // Total Work Duration (excluding break if present)
        // Ensure it doesn't go below 1 to avoid division by zero or negative ratios
        const totalWorkDuration = Math.max(1, (endMins - startMins) - breakDuration);

        // Status Determination
        let status: WorkStatus = 'PRE_BREAK';
        if (currentMins >= endMins) {
            status = 'FINISHED';
        } else if (hasBreak) {
            if (currentMins >= breakEndMins) status = 'POST_BREAK';
            else if (currentMins >= breakStartMins) status = 'BREAK';
        }

        // Time Remaining Calculation
        let minutesRemaining = 0;
        if (status !== 'FINISHED') {
            const effectiveCurrentMins = Math.max(currentMins, startMins);
            minutesRemaining = Math.max(0, endMins - effectiveCurrentMins);
            // If currently before break end, subtract the remaining break time from work time
            if (hasBreak && effectiveCurrentMins < breakEndMins) {
                const breakMinutesLeft = Math.max(0, breakEndMins - Math.max(effectiveCurrentMins, breakStartMins));
                minutesRemaining -= breakMinutesLeft;
            }
        }

        // Progress
        const progressPercent = Math.min(100, Math.round((currentCount / (goal || 1)) * 100));

        // Break Analysis (Performance before break)
        const expectedPreBreakRatio = hasBreak ? Math.max(0, Math.min(1, (breakStartMins - startMins) / totalWorkDuration)) : 0;
        const expectedPreBreakCount = Math.round(goal * expectedPreBreakRatio);
        const breakDiff = preBreakCount - expectedPreBreakCount;
        
        // Only show negative performance if we've already passed the break time
        // Before the break time, always show positive (user still has time to catch up)
        const breakPerformance = (!hasBreak || status === 'PRE_BREAK' || breakDiff >= 0 ? 'positive' : 'negative') as 'positive' | 'negative';

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
            itemsRemaining,
            hasBreak
        };
    }, [goal, startTime, endTime, breakTime, currentCount, preBreakCount, nowMinutes, paceMode]);
};
