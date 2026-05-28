/**
 * useHydrationOrchestrator
 *
 * Manages real-time Firestore subscriptions for all Zustand stores.
 * Replaces the 175-line hydration useEffect previously inside WorkspaceApp.
 *
 * Returns `isDataReady: boolean` — true once all stores have received their
 * first data snapshot (or the 12s timeout is reached).
 */
import { useEffect, useState } from 'react';
import {
    useConfigStore,
    useHabitsStore,
    useWorkStore,
    useNotesStore,
    useSundayStore,
    useJournalStore,
    useLinksStore,
    useSkillsStore,
    useReadingStore,
    useRestStore,
    usePromptsStore,
    useGamesStore,
    useReviewStore,
    useWaterStore,
    useStreakStore,
    useTimerStore,
    useSiteCategoriesStore,
    useSitesStore,
    useSiteFoldersStore,
    useSundayTimerStore,
    useGoalsStore,
    useCompetitionStore,
    useDailyPlannerStore,
    usePomodoroStore,
    useAulasStore,
    clearAllStores,
} from '../stores';
import {
    subscribeToDocument,
    subscribeToSubcollection,
    flushPendingWrites,
} from '../stores/firestoreSync';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HYDRATION_TIMEOUT_MS = 12000;

// ---------------------------------------------------------------------------
// Store subscription registry
// Each entry maps a Firestore document key to the store's hydrate method.
// ---------------------------------------------------------------------------

type StoreSubscription = {
    key: string;
    hydrate: (data: any) => void;
};

const buildStoreSubscriptions = (): StoreSubscription[] => [
    { key: 'p67_project_config', hydrate: (d) => useConfigStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_habits_store', hydrate: (d) => useHabitsStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_work_store', hydrate: (d) => useWorkStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_notes_store', hydrate: (d) => useNotesStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_sunday_store', hydrate: (d) => useSundayStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_journal_store', hydrate: (d) => useJournalStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_links_store', hydrate: (d) => useLinksStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_skills_store', hydrate: (d) => useSkillsStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_reading_store', hydrate: (d) => useReadingStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_rest_store', hydrate: (d) => useRestStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_prompts_store', hydrate: (d) => usePromptsStore.getState()._hydrateFromFirestore(d) },
    { key: 'games-storage', hydrate: (d) => useGamesStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_review_store', hydrate: (d) => useReviewStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_water_store', hydrate: (d) => useWaterStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_streak_store', hydrate: (d) => useStreakStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_tool_timer', hydrate: (d) => useTimerStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_site_categories_store', hydrate: (d) => useSiteCategoriesStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_sites_store', hydrate: (d) => useSitesStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_site_folders_store', hydrate: (d) => useSiteFoldersStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_sunday_timer', hydrate: (d) => useSundayTimerStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_goals_store', hydrate: (d) => useGoalsStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_competition_store', hydrate: (d) => useCompetitionStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_daily_planner_store', hydrate: (d) => useDailyPlannerStore.getState()._hydrateFromFirestore(d) },
    { key: 'pomodoro-storage', hydrate: (d) => usePomodoroStore.getState()._hydrateFromFirestore(d) },
    { key: 'p67_aulas_config', hydrate: (d) => useAulasStore.getState()._hydrateFromFirestore(d) },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param userId - The currently authenticated user's ID. Pass `undefined` for guests.
 * @returns `isDataReady` - whether all stores have completed their initial hydration.
 */
export const useHydrationOrchestrator = (userId: string | undefined): boolean => {
    const [isDataReady, setIsDataReady] = useState(false);

    useEffect(() => {
        // No user — nothing to sync, mark as ready immediately.
        if (!userId) {
            setIsDataReady(true);
            return;
        }

        setIsDataReady(false);
        flushPendingWrites(); // Flush pending writes before clearing stores
        clearAllStores();    // Prevent data leaks between users

        const unsubscribers: (() => void)[] = [];
        const hydratedStores = new Set<string>();
        const storeSubscriptions = buildStoreSubscriptions();
        const totalStores = storeSubscriptions.length;

        const checkAllHydrated = (storeKey: string) => {
            // Only count the first hydration per store
            if (hydratedStores.has(storeKey)) return;
            hydratedStores.add(storeKey);

            if (hydratedStores.size >= totalStores) {
                setIsDataReady(true);
                console.log('[App] All stores hydrated, UI ready');
            }
        };

        // Safety net: proceed after 12 s even if some stores didn't respond
        const hydrationTimeout = window.setTimeout(() => {
            if (hydratedStores.size < totalStores) {
                const missingStores = storeSubscriptions
                    .map(({ key }) => key)
                    .filter((key) => !hydratedStores.has(key));

                console.warn('[App] Hydration timeout reached. Continuing with partial data.', {
                    hydrated: hydratedStores.size,
                    totalStores,
                    missingStores,
                });

                setIsDataReady(true);
            }
        }, HYDRATION_TIMEOUT_MS);

        // Subscribe to all document stores
        storeSubscriptions.forEach(({ key, hydrate }) => {
            unsubscribers.push(
                subscribeToDocument(
                    key,
                    (data: any) => {
                        hydrate(data);
                        checkAllHydrated(key);
                    },
                    (error) => {
                        console.error(`[App] Failed to hydrate ${key}, falling back to empty state.`, error);
                        hydrate(null);
                        checkAllHydrated(key);
                    }
                )
            );
        });

        // Subcollection-based stores (Notes and Aulas books)
        unsubscribers.push(
            subscribeToSubcollection('p67_notes_store_items', (data: any[]) => {
                useNotesStore.getState()._hydrateNotesFromSubcollection(data);
            })
        );
        unsubscribers.push(
            subscribeToSubcollection('p67_aulas_books', (data: any[]) => {
                useAulasStore.getState()._hydrateBooksFromSubcollection(data);
            })
        );

        console.log('[App] Subscribed to', totalStores, 'stores for real-time sync');

        return () => {
            window.clearTimeout(hydrationTimeout);
            unsubscribers.forEach((unsub) => unsub());
            console.log('[App] Unsubscribed from all stores');
        };
    }, [userId]);

    return isDataReady;
};
