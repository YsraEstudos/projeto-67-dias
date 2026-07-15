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
        weeklyGoals: {},
        getWeeklyGoal: vi.fn(() => 300),
        getCurrentWeekGoal: vi.fn(() => 300),
        getWeeklyWorkDays: vi.fn(() => 7),
        getCurrentWeekWorkDays: vi.fn(() => 7),
        setWeeklyGoal: vi.fn(),
        setWeeklyWorkDays: vi.fn(),
        setGoal: vi.fn(),
        setCurrentCount: vi.fn(),
        setPreBreakCount: vi.fn(),
        setStartTime: vi.fn(),
        setEndTime: vi.fn(),
        setBreakTime: vi.fn(),
        setPaceMode: vi.fn(),
        ensureCurrentDay: vi.fn(() => false),
        _checkAndResetForNewDay: vi.fn(() => false),
        ...overrides
    };
};

export const createUIStoreMock = (overrides = {}) => {
    return {
        setActiveView: vi.fn(),
        ...overrides
    };
};
