/**
 * Hook to automatically record streak activity
 * Import and call trackActivity() in components that count as "activity"
 */
import { useCallback } from 'react';
import { useStreakStore } from '../stores';

export const useStreakTracking = () => {
    const recordActivity = useStreakStore((s) => s.recordActivity);
    const isActiveToday = useStreakStore((s) => s.isActiveToday());
    const currentStreak = useStreakStore((s) => s.currentStreak);

    // Wrap in useCallback for stable reference
    const trackActivity = useCallback(() => {
        if (!isActiveToday) {
            recordActivity();
        }
    }, [isActiveToday, recordActivity]);

    return {
        trackActivity,
        isActiveToday,
        currentStreak,
    };
};

export default useStreakTracking;
