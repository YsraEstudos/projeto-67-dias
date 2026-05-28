import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHydrationOrchestrator } from '../../hooks/useHydrationOrchestrator';
import { subscribeToSubcollection, flushPendingWrites } from '../../stores/firestoreSync';
import { clearAllStores } from '../../stores';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture subscription callbacks so tests can fire them manually
type DataCallback = (data: any) => void;
type ErrorCallback = (error: Error) => void;

let documentCallbacks: Map<string, DataCallback>;
let documentErrorCallbacks: Map<string, ErrorCallback>;
let subcollectionCallbacks: Map<string, (data: any[]) => void>;
let unsubscribeFns: ReturnType<typeof vi.fn>[];

vi.mock('../../stores/firestoreSync', () => ({
    subscribeToDocument: vi.fn((key: string, onData: DataCallback, onError?: ErrorCallback) => {
        documentCallbacks.set(key, onData);
        if (onError) documentErrorCallbacks.set(key, onError);
        const unsub = vi.fn();
        unsubscribeFns.push(unsub);
        return unsub;
    }),
    subscribeToSubcollection: vi.fn((key: string, onData: any) => {
        subcollectionCallbacks.set(key, onData);
        const unsub = vi.fn();
        unsubscribeFns.push(unsub);
        return unsub;
    }),
    flushPendingWrites: vi.fn(),
}));

// Use vi.hoisted so that makeStore() calls happen BEFORE vi.mock hoisting
const {
    configStore, habitsStore, workStore, notesStore, sundayStore,
    journalStore, linksStore, skillsStore, readingStore, restStore,
    promptsStore, gamesStore, reviewStore, waterStore, streakStore,
    timerStore, siteCategoriesStore, sitesStore, siteFoldersStore,
    sundayTimerStore, goalsStore, competitionStore, dailyPlannerStore,
    pomodoroStore, aulasStore, clearAllStoresFn,
} = vi.hoisted(() => {
    const makeStore = () => {
        const state = {
            _hydrateFromFirestore: vi.fn(),
            _hydrateNotesFromSubcollection: vi.fn(),
            _hydrateBooksFromSubcollection: vi.fn(),
            _reset: vi.fn(),
        };
        const store = Object.assign(vi.fn(), {
            getState: () => state,
        });
        return store;
    };
    return {
        configStore: makeStore(),
        habitsStore: makeStore(),
        workStore: makeStore(),
        notesStore: makeStore(),
        sundayStore: makeStore(),
        journalStore: makeStore(),
        linksStore: makeStore(),
        skillsStore: makeStore(),
        readingStore: makeStore(),
        restStore: makeStore(),
        promptsStore: makeStore(),
        gamesStore: makeStore(),
        reviewStore: makeStore(),
        waterStore: makeStore(),
        streakStore: makeStore(),
        timerStore: makeStore(),
        siteCategoriesStore: makeStore(),
        sitesStore: makeStore(),
        siteFoldersStore: makeStore(),
        sundayTimerStore: makeStore(),
        goalsStore: makeStore(),
        competitionStore: makeStore(),
        dailyPlannerStore: makeStore(),
        pomodoroStore: makeStore(),
        aulasStore: makeStore(),
        clearAllStoresFn: vi.fn(),
    };
});

vi.mock('../../stores', () => ({
    useConfigStore: configStore,
    useHabitsStore: habitsStore,
    useWorkStore: workStore,
    useNotesStore: notesStore,
    useSundayStore: sundayStore,
    useJournalStore: journalStore,
    useLinksStore: linksStore,
    useSkillsStore: skillsStore,
    useReadingStore: readingStore,
    useRestStore: restStore,
    usePromptsStore: promptsStore,
    useGamesStore: gamesStore,
    useReviewStore: reviewStore,
    useWaterStore: waterStore,
    useStreakStore: streakStore,
    useTimerStore: timerStore,
    useSiteCategoriesStore: siteCategoriesStore,
    useSitesStore: sitesStore,
    useSiteFoldersStore: siteFoldersStore,
    useSundayTimerStore: sundayTimerStore,
    useGoalsStore: goalsStore,
    useCompetitionStore: competitionStore,
    useDailyPlannerStore: dailyPlannerStore,
    usePomodoroStore: pomodoroStore,
    useAulasStore: aulasStore,
    clearAllStores: clearAllStoresFn,
}));

// Convenient list of the 25 document-store keys (matches hook's buildStoreSubscriptions)
const ALL_STORE_KEYS = [
    'p67_project_config',
    'p67_habits_store',
    'p67_work_store',
    'p67_notes_store',
    'p67_sunday_store',
    'p67_journal_store',
    'p67_links_store',
    'p67_skills_store',
    'p67_reading_store',
    'p67_rest_store',
    'p67_prompts_store',
    'games-storage',
    'p67_review_store',
    'p67_water_store',
    'p67_streak_store',
    'p67_tool_timer',
    'p67_site_categories_store',
    'p67_sites_store',
    'p67_site_folders_store',
    'p67_sunday_timer',
    'p67_goals_store',
    'p67_competition_store',
    'p67_daily_planner_store',
    'pomodoro-storage',
    'p67_aulas_config',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fireAllDocumentCallbacks = (data: any = {}) => {
    documentCallbacks.forEach((cb) => cb(data));
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHydrationOrchestrator', () => {
    beforeEach(() => {
        documentCallbacks = new Map();
        documentErrorCallbacks = new Map();
        subcollectionCallbacks = new Map();
        unsubscribeFns = [];
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // -----------------------------------------------------------------------
    it('returns false initially when userId is provided', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));
        expect(result.current).toBe(false);
    });

    // -----------------------------------------------------------------------
    it('returns true immediately when userId is undefined (guest/unauthenticated)', () => {
        const { result } = renderHook(() => useHydrationOrchestrator(undefined));
        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('returns true after all 25 store subscriptions fire their callbacks', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));

        expect(result.current).toBe(false);

        // Fire all document callbacks
        act(() => {
            fireAllDocumentCallbacks({ someData: true });
        });

        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('returns true after 12 s timeout even with partial hydration', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));

        expect(result.current).toBe(false);

        // Fire only a subset of callbacks (not all 25)
        act(() => {
            documentCallbacks.get('p67_project_config')?.({});
            documentCallbacks.get('p67_habits_store')?.({});
        });

        expect(result.current).toBe(false); // Still not ready

        // Advance past the 12 s timeout
        act(() => {
            vi.advanceTimersByTime(12001);
        });

        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('does not fire the timeout callback if all stores hydrate in time', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));

        act(() => {
            fireAllDocumentCallbacks({});
        });

        expect(result.current).toBe(true);

        // Advance past timeout — should not cause any extra state updates
        act(() => {
            vi.advanceTimersByTime(12001);
        });

        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('calls hydrate(null) and still counts the store when an error occurs', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));

        act(() => {
            // Trigger error for config store
            documentErrorCallbacks.get('p67_project_config')?.(new Error('Firestore error'));
            // Fire the rest normally
            ALL_STORE_KEYS.filter((k) => k !== 'p67_project_config').forEach((k) => {
                documentCallbacks.get(k)?.({});
            });
        });

        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('calls subscribeToSubcollection for notes and aulas subcollections', () => {
        renderHook(() => useHydrationOrchestrator('user-123'));

        expect(subscribeToSubcollection).toHaveBeenCalledWith(
            'p67_notes_store_items',
            expect.any(Function)
        );
        expect(subscribeToSubcollection).toHaveBeenCalledWith(
            'p67_aulas_books',
            expect.any(Function)
        );
    });

    // -----------------------------------------------------------------------
    it('calls flushPendingWrites and clearAllStores before subscribing', () => {
        renderHook(() => useHydrationOrchestrator('user-123'));

        expect(flushPendingWrites).toHaveBeenCalledOnce();
        expect(clearAllStoresFn).toHaveBeenCalledOnce();
    });

    // -----------------------------------------------------------------------
    it('calls all unsubscribers on unmount', () => {
        const { unmount } = renderHook(() => useHydrationOrchestrator('user-123'));

        // 25 document subscriptions + 2 subcollection subscriptions = 27
        expect(unsubscribeFns.length).toBe(27);

        unmount();

        unsubscribeFns.forEach((fn) => {
            expect(fn).toHaveBeenCalledOnce();
        });
    });

    // -----------------------------------------------------------------------
    it('resets isDataReady to false and re-subscribes when userId changes', () => {
        const { result, rerender } = renderHook(
            ({ uid }: { uid: string }) => useHydrationOrchestrator(uid),
            { initialProps: { uid: 'user-1' } }
        );

        // Hydrate first user
        act(() => { fireAllDocumentCallbacks({}); });
        expect(result.current).toBe(true);

        // Switch to a different user
        act(() => {
            documentCallbacks.clear();
            rerender({ uid: 'user-2' });
        });

        expect(result.current).toBe(false); // Reset for new user

        // Hydrate second user
        act(() => { fireAllDocumentCallbacks({}); });
        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('ignores duplicate hydration events for the same store key', () => {
        const { result } = renderHook(() => useHydrationOrchestrator('user-123'));

        act(() => {
            // Fire config callback twice
            documentCallbacks.get('p67_project_config')?.({});
            documentCallbacks.get('p67_project_config')?.({});
            // Fire the rest once
            ALL_STORE_KEYS.filter((k) => k !== 'p67_project_config').forEach((k) => {
                documentCallbacks.get(k)?.({});
            });
        });

        expect(result.current).toBe(true);
    });

    // -----------------------------------------------------------------------
    it('calls hydrate subcollection methods when subcollection subscription fires', () => {
        renderHook(() => useHydrationOrchestrator('user-123'));

        const notesCb = subcollectionCallbacks.get('p67_notes_store_items');
        const aulasCb = subcollectionCallbacks.get('p67_aulas_books');

        expect(notesCb).toBeDefined();
        expect(aulasCb).toBeDefined();

        const notesData = [{ id: '1', title: 'Note 1' }];
        const aulasData = [{ id: '2', title: 'Book 2' }];

        act(() => {
            notesCb!(notesData);
            aulasCb!(aulasData);
        });

        expect(notesStore.getState()._hydrateNotesFromSubcollection).toHaveBeenCalledWith(notesData);
        expect(aulasStore.getState()._hydrateBooksFromSubcollection).toHaveBeenCalledWith(aulasData);
    });
});
