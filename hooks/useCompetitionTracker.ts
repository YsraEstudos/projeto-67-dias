import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    useCompetitionStore,
    useHabitsStore,
    useReadingStore,
    useSkillsStore,
    useWorkStore,
} from '../stores';
import { createCompetitionDailyRecord } from '../utils/competitionEngine';
import { getTodayISO } from '../utils/dateUtils';

interface UseCompetitionTrackerOptions {
    enabled: boolean;
    startDate: string;
}

export const useCompetitionTracker = ({ enabled, startDate }: UseCompetitionTrackerOptions) => {
    const competitionStartedAt = useCompetitionStore((state) => state.competition.competitionStartedAt);
    const initializeCompetition = useCompetitionStore((state) => state.initializeCompetition);
    const upsertDailyRecord = useCompetitionStore((state) => state.upsertDailyRecord);

    const workState = useWorkStore(useShallow((state) => ({
        currentCount: state.currentCount,
        workHistory: state.history,
        scheduledTasks: state.tasks,
        availableGoals: state.availableGoals,
    })));
    const habitsState = useHabitsStore(useShallow((state) => ({
        habits: state.habits,
        tasks: state.tasks,
    })));
    const skills = useSkillsStore((state) => state.skills);
    const books = useReadingStore((state) => state.books);

    const todayKey = getTodayISO();

    const record = useMemo(() => {
        if (!enabled) return null;

        return createCompetitionDailyRecord({
            startDate,
            currentCount: workState.currentCount,
            workHistory: workState.workHistory,
            scheduledTasks: workState.scheduledTasks,
            availableGoals: workState.availableGoals,
            habits: habitsState.habits,
            tasks: habitsState.tasks,
            skills,
            books,
        }, todayKey);
    }, [
        enabled,
        startDate,
        workState.currentCount,
        workState.workHistory,
        workState.scheduledTasks,
        workState.availableGoals,
        habitsState.habits,
        habitsState.tasks,
        skills,
        books,
        todayKey,
    ]);

    useEffect(() => {
        if (!enabled) return;

        if (!competitionStartedAt) {
            initializeCompetition();
        }
    }, [enabled, competitionStartedAt, initializeCompetition]);

    useEffect(() => {
        if (!enabled || !record) return;
        upsertDailyRecord(record);
    }, [enabled, record, upsertDailyRecord]);
};
