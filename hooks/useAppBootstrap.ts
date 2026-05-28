/**
 * useAppBootstrap
 *
 * Encapsulates application-level side-effects that run once (or on specific
 * changes) after the user is authenticated. Previously these were 5 separate
 * useEffect blocks spread across WorkspaceApp.
 *
 * Responsibilities:
 *  - Sync `userName` from auth user to project config (if not already set)
 *  - Apply CSS theme class to document.body
 *  - Run legacy data migrations (localStorage → Zustand, Zustand → Firestore)
 *  - Trigger streak check after hydration
 *  - Perform automatic Sunday weekly reset
 */
import { useEffect } from 'react';
import {
    useConfigStore,
    useStreakStore,
    useRestStore,
    usePomodoroStore,
} from '../stores';
import { setupDataMigration } from '../utils/dataMigration';
import { setupFirestoreMigration } from '../utils/legacyToFirestoreMigration';
import type { User } from '../types';

interface UseAppBootstrapOptions {
    user: User;
    isDataReady: boolean;
}

export const useAppBootstrap = ({ user, isDataReady }: UseAppBootstrapOptions): void => {
    const config = useConfigStore((state) => state.config);
    const setConfig = useConfigStore((state) => state.setConfig);

    // -----------------------------------------------------------------------
    // Sync userName: populate config once from the auth user (if missing)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (user && !config.userName && isDataReady) {
            setConfig({
                userName: user.name,
                isGuest: user.isGuest,
            });
        }
    }, [user, config.userName, setConfig, isDataReady]);

    // -----------------------------------------------------------------------
    // Theme: apply CSS theme class to document.body
    // -----------------------------------------------------------------------
    useEffect(() => {
        document.body.classList.remove('theme-default', 'theme-amoled');
        document.body.classList.add(`theme-${config.theme || 'default'}`);
    }, [config.theme]);

    // -----------------------------------------------------------------------
    // Data migration: legacy localStorage → Zustand stores
    // -----------------------------------------------------------------------
    useEffect(() => {
        const unsubscribe = setupDataMigration();
        return () => unsubscribe();
    }, []);

    // -----------------------------------------------------------------------
    // Firestore migration: existing users' localStorage → Firestore
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (user?.id) {
            const unsubscribe = setupFirestoreMigration();
            return () => unsubscribe();
        }
    }, [user?.id]);

    // -----------------------------------------------------------------------
    // Streak check: only after stores are fully hydrated
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isDataReady) {
            useStreakStore.getState().checkStreak();
        }
    }, [isDataReady]);

    // -----------------------------------------------------------------------
    // Automatic Sunday reset: resets rest and pomodoro weekly state
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!isDataReady) return;

        const today = new Date();
        if (today.getDay() !== 0) return; // 0 = Sunday

        const todayDateStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        const lastReset = useConfigStore.getState().config.lastSundayResetDate;
        if (lastReset === todayDateStr) return; // Already reset today

        console.log('[App] Performing automatic Sunday reset...');
        useRestStore.getState().resetWeekly();
        usePomodoroStore.getState().resetWeekly();
        useConfigStore.getState().setConfig({ lastSundayResetDate: todayDateStr });
    }, [isDataReady]);
};
