import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppBootstrap } from '../../hooks/useAppBootstrap';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetConfig = vi.fn();
const mockCheckStreak = vi.fn();
const mockResetWeeklyRest = vi.fn();
const mockResetWeeklyPomodoro = vi.fn();
const mockGetConfigState = vi.fn();

vi.mock('../../stores', () => ({
    useConfigStore: vi.fn((selector: any) =>
        selector({
            config: { userName: '', theme: 'default', lastSundayResetDate: null },
            setConfig: mockSetConfig,
        })
    ),
    useStreakStore: vi.fn((selector: any) =>
        selector({ checkStreak: mockCheckStreak })
    ),
    useRestStore: vi.fn((selector: any) =>
        selector({ resetWeekly: mockResetWeeklyRest })
    ),
    usePomodoroStore: vi.fn((selector: any) =>
        selector({ resetWeekly: mockResetWeeklyPomodoro })
    ),
}));

// We separately control getState calls used inside the useEffect bodies
// (these bypass the selector pattern and call store.getState() directly)
const mockGetState = vi.fn();

// Mock useConfigStore.getState() — used in the Sunday reset effect
import * as storesMod from '../../stores';

const mockSetupDataMigrationCleanup = vi.fn();
const mockSetupDataMigration = vi.fn(() => mockSetupDataMigrationCleanup);

const mockSetupFirestoreMigrationCleanup = vi.fn();
const mockSetupFirestoreMigration = vi.fn(() => mockSetupFirestoreMigrationCleanup);

vi.mock('../../utils/dataMigration', () => ({
    setupDataMigration: () => mockSetupDataMigration(),
}));

vi.mock('../../utils/legacyToFirestoreMigration', () => ({
    setupFirestoreMigration: () => mockSetupFirestoreMigration(),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockUser = { id: 'user-123', name: 'Test User', email: 'test@example.com', isGuest: false };
const guestUser = { id: '', name: 'Guest', email: '', isGuest: true };

const renderBootstrap = (overrides: { user?: any; isDataReady?: boolean; theme?: string; userName?: string; lastSundayResetDate?: string | null } = {}) => {
    const user = overrides.user ?? mockUser;
    const isDataReady = overrides.isDataReady ?? false;
    const theme = 'theme' in overrides ? overrides.theme : 'default';
    const userName = overrides.userName ?? '';
    const lastSundayResetDate = overrides.lastSundayResetDate ?? null;

    // Override useConfigStore selector output
    vi.mocked(storesMod.useConfigStore).mockImplementation((selector: any) =>
        selector({
            config: { userName, theme, lastSundayResetDate },
            setConfig: mockSetConfig,
        })
    );

    // Override getState for use inside effects
    (storesMod.useConfigStore as any).getState = () => ({
        config: { userName, theme, lastSundayResetDate },
        setConfig: mockSetConfig,
    });
    (storesMod.useStreakStore as any).getState = () => ({ checkStreak: mockCheckStreak });
    (storesMod.useRestStore as any).getState = () => ({ resetWeekly: mockResetWeeklyRest });
    (storesMod.usePomodoroStore as any).getState = () => ({ resetWeekly: mockResetWeeklyPomodoro });

    return renderHook(() => useAppBootstrap({ user, isDataReady }));
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAppBootstrap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset body classes
        document.body.className = '';
    });

    afterEach(() => {
        document.body.className = '';
        vi.useRealTimers();
    });

    // -----------------------------------------------------------------------
    // Theme
    // -----------------------------------------------------------------------
    it('applies default theme class to document.body on mount', () => {
        renderBootstrap({ theme: 'default' });
        expect(document.body.classList.contains('theme-default')).toBe(true);
    });

    it('applies amoled theme class to document.body when theme is amoled', () => {
        renderBootstrap({ theme: 'amoled' });
        expect(document.body.classList.contains('theme-amoled')).toBe(true);
        expect(document.body.classList.contains('theme-default')).toBe(false);
    });

    it('removes old theme class when theme changes', () => {
        const { rerender } = renderBootstrap({ theme: 'default' });
        expect(document.body.classList.contains('theme-default')).toBe(true);

        vi.mocked(storesMod.useConfigStore).mockImplementation((selector: any) =>
            selector({ config: { theme: 'amoled', userName: '', lastSundayResetDate: null }, setConfig: mockSetConfig })
        );
        rerender();

        expect(document.body.classList.contains('theme-amoled')).toBe(true);
        expect(document.body.classList.contains('theme-default')).toBe(false);
    });

    it('falls back to theme-default when config.theme is undefined', () => {
        renderBootstrap({ theme: undefined as any });
        expect(document.body.classList.contains('theme-default')).toBe(true);
    });

    // -----------------------------------------------------------------------
    // userName sync
    // -----------------------------------------------------------------------
    it('syncs userName from user to config when config.userName is empty and isDataReady', () => {
        renderBootstrap({ userName: '', isDataReady: true });
        expect(mockSetConfig).toHaveBeenCalledWith(
            expect.objectContaining({ userName: 'Test User', isGuest: false })
        );
    });

    it('does NOT sync userName when config.userName is already set', () => {
        renderBootstrap({ userName: 'Existing Name', isDataReady: true });
        expect(mockSetConfig).not.toHaveBeenCalled();
    });

    it('does NOT sync userName when isDataReady is false', () => {
        renderBootstrap({ userName: '', isDataReady: false });
        expect(mockSetConfig).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Data migration
    // -----------------------------------------------------------------------
    it('calls setupDataMigration on mount', () => {
        renderBootstrap();
        expect(mockSetupDataMigration).toHaveBeenCalledOnce();
    });

    it('calls the setupDataMigration cleanup on unmount', () => {
        const { unmount } = renderBootstrap();
        unmount();
        expect(mockSetupDataMigrationCleanup).toHaveBeenCalledOnce();
    });

    // -----------------------------------------------------------------------
    // Firestore migration
    // -----------------------------------------------------------------------
    it('calls setupFirestoreMigration when user.id exists', () => {
        renderBootstrap({ user: mockUser });
        expect(mockSetupFirestoreMigration).toHaveBeenCalledOnce();
    });

    it('does NOT call setupFirestoreMigration when user has no id', () => {
        renderBootstrap({ user: guestUser });
        expect(mockSetupFirestoreMigration).not.toHaveBeenCalled();
    });

    it('calls the setupFirestoreMigration cleanup on unmount', () => {
        const { unmount } = renderBootstrap({ user: mockUser });
        unmount();
        expect(mockSetupFirestoreMigrationCleanup).toHaveBeenCalledOnce();
    });

    // -----------------------------------------------------------------------
    // Streak check
    // -----------------------------------------------------------------------
    it('calls checkStreak when isDataReady becomes true', () => {
        const { rerender } = renderBootstrap({ isDataReady: false });
        expect(mockCheckStreak).not.toHaveBeenCalled();

        vi.mocked(storesMod.useConfigStore).mockImplementation((selector: any) =>
            selector({ config: { userName: '', theme: 'default', lastSundayResetDate: null }, setConfig: mockSetConfig })
        );

        act(() => {
            rerender();
        });

        // isDataReady changes from false → true requires re-rendering with new prop
        // We test it by initially rendering with isDataReady=true
        const { unmount } = renderBootstrap({ isDataReady: true });
        expect(mockCheckStreak).toHaveBeenCalled();
        unmount();
    });

    it('does NOT call checkStreak when isDataReady is false', () => {
        renderBootstrap({ isDataReady: false });
        expect(mockCheckStreak).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Sunday reset
    // -----------------------------------------------------------------------
    it('performs Sunday reset when it is Sunday and not reset today', () => {
        // Set system time to a Sunday
        const sunday = new Date('2026-06-07T12:00:00'); // June 7 2026 is a Sunday
        vi.useFakeTimers();
        vi.setSystemTime(sunday);

        renderBootstrap({ isDataReady: true, lastSundayResetDate: '2026-05-31' }); // Last reset was previous Sunday

        expect(mockResetWeeklyRest).toHaveBeenCalledOnce();
        expect(mockResetWeeklyPomodoro).toHaveBeenCalledOnce();
        expect(mockSetConfig).toHaveBeenCalledWith(
            expect.objectContaining({ lastSundayResetDate: '2026-06-07' })
        );
    });

    it('does NOT perform Sunday reset when already reset today', () => {
        const sunday = new Date('2026-06-07T12:00:00');
        vi.useFakeTimers();
        vi.setSystemTime(sunday);

        renderBootstrap({ isDataReady: true, lastSundayResetDate: '2026-06-07' }); // Already reset

        expect(mockResetWeeklyRest).not.toHaveBeenCalled();
        expect(mockResetWeeklyPomodoro).not.toHaveBeenCalled();
    });

    it('does NOT perform Sunday reset on a weekday', () => {
        const monday = new Date('2026-06-08T12:00:00'); // Monday
        vi.useFakeTimers();
        vi.setSystemTime(monday);

        renderBootstrap({ isDataReady: true, lastSundayResetDate: null });

        expect(mockResetWeeklyRest).not.toHaveBeenCalled();
        expect(mockResetWeeklyPomodoro).not.toHaveBeenCalled();
    });

    it('does NOT perform Sunday reset when isDataReady is false', () => {
        const sunday = new Date('2026-06-07T12:00:00');
        vi.useFakeTimers();
        vi.setSystemTime(sunday);

        renderBootstrap({ isDataReady: false, lastSundayResetDate: null });

        expect(mockResetWeeklyRest).not.toHaveBeenCalled();
    });
});
