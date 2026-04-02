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
        workHistory: state.history,
        scheduledTasks: state.tasks,
        availableGoals: state.availableGoals,
    })));
    const habitsState = useHabitsStore(useShallow((state) => ({
        habits: state.habits,
        tasks: state.tasks,
    })));
    const todayKey = getTodayISO();
    const skills = useSkillsStore((state) => state.skills);
    const { books, readingSignature } = useReadingStore(useShallow((state) => ({
        books: state.books,
        readingSignature: state.books
            .map((book) => [
                book.id,
                book.status,
                book.current,
                book.total,
                book.dailyGoal ?? '',
                getReadingPagesReadForDate(book, todayKey),
            ].join(':'))
            .join('|'),
    })));

    const record = useMemo(() => {
        if (!enabled) return null;

        // DEBUG: trace XP computation inputs
        const readingBooks = books.filter(b => b.status === 'READING');
        console.debug('[CompetitionTracker] computing record', {
            todayKey,
            enabled,
            booksTotal: books.length,
            readingBooks: readingBooks.map(b => ({
                id: b.id, title: b.title, status: b.status,
                current: b.current, total: b.total,
                logsCount: b.logs?.length ?? 0,
                todayLog: b.logs?.find(l => l.date === todayKey),
            })),
            habitsCount: habitsState.habits.length,
            skillsCount: skills.length,
            currentCount: workState.currentCount,
        });

        const result = createCompetitionDailyRecord({
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

        console.debug('[CompetitionTracker] record result', {
            score: result.score,
            breakdown: result.breakdown.map(b => ({ id: b.id, points: b.points, maxPoints: b.maxPoints })),
        });

        return result;
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
