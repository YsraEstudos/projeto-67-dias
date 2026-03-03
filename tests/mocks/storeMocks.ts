import { vi } from 'vitest';

export const createWorkStoreMock = (overrides = {}) => {
    return {
        isLoading: false,
        goal: 300,
        currentCount: 150,
        preBreakCount: 0,
        startTime: '08:00',
        endTime: '17:00',
        breakTime: '12:00',
        paceMode: 'remaining' as const,
        history: [],
        goals: { weekly: 100, ultra: 500, anki: 15, ncm: 20 },
        studySubjects: [],
        studySchedules: [],
        selectedIdleTasks: [],
        weeklyGoals: {},
        getWeeklyGoal: vi.fn(() => 300),
        getCurrentWeekGoal: vi.fn(() => 300),
        setWeeklyGoal: vi.fn(),
        setGoal: vi.fn(),
        setCurrentCount: vi.fn(),
        setPreBreakCount: vi.fn(),
        setStartTime: vi.fn(),
        setEndTime: vi.fn(),
        setBreakTime: vi.fn(),
        setPaceMode: vi.fn(),
        addSession: vi.fn(),
        deleteSession: vi.fn(),
        setGoals: vi.fn(),
        setStudySubjects: vi.fn(),
        setSchedules: vi.fn(),
        addIdleTask: vi.fn(),
        removeIdleTask: vi.fn(),
        updateIdleTaskPoints: vi.fn(),
        ...overrides
    };
};

export const createUIStoreMock = (overrides = {}) => {
    return {
        setActiveView: vi.fn(),
        ...overrides
    };
};
