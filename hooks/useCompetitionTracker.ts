import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    useCompetitionStore,
    useHabitsStore,
    useReadingStore,
    useRestStore,
    useSkillsStore,
    useWorkStore,
} from '../stores';
import { createCompetitionDailyRecord } from '../utils/competitionEngine';
import { getReadingPagesReadForDate } from '../utils/dailyOffensiveUtils';
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
    })));
    const habitsState = useHabitsStore(useShallow((state) => ({
        habits: state.habits,
        tasks: state.tasks,
    })));
    const todayKey = getTodayISO();
    const skills = useSkillsStore((state) => state.skills);
    const restActivities = useRestStore((state) => state.activities);
    const books = useReadingStore((state) => state.books);
    const readingSignature = useMemo(() => books
        .map((book) => [
            book.id,
            book.status,
            book.current,
            book.total,
            book.dailyGoal ?? '',
            getReadingPagesReadForDate(book, todayKey),
        ].join(':'))
        .join('|'), [books, todayKey]);

    const record = useMemo(() => {
        if (!enabled) return null;


        const result = createCompetitionDailyRecord({
            startDate,
            currentCount: workState.currentCount,
            workHistory: [],
            scheduledTasks: [],
            availableGoals: [],
            habits: habitsState.habits,
            tasks: habitsState.tasks,
            skills,
            books,
            restActivities,
        }, todayKey);


        return result;
    }, [
        enabled,
        startDate,
        workState.currentCount,
        habitsState.habits,
        habitsState.tasks,
        skills,
        books,
        restActivities,
        readingSignature,
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
