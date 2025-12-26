/**
 * Sites Store - Site groups for organizing multiple related links
 * Each Site belongs to a category and contains multiple links
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Site } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_sites_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface SitesState {
    sites: Site[];
    isLoading: boolean;
    _initialized: boolean;

    // CRUD
    setSites: (sites: Site[]) => void;
    addSite: (site: Site) => void;
    updateSite: (id: string, updates: Partial<Site>) => void;
    deleteSite: (id: string) => void;

    // Helpers
    getSitesByCategory: (categoryId: string) => Site[];
    moveSite: (siteId: string, newCategoryId: string) => void;
    reorderSites: (sites: Site[]) => void;

    // Internals
    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { sites: Site[] } | null) => void;
    _reset: () => void;
}

export const useSitesStore = create<SitesState>()((set, get) => ({
    sites: [],
    isLoading: true,
    _initialized: false,

    setSites: (sites) => {
        set({ sites: deduplicateById(sites) });
        get()._syncToFirestore();
    },

    addSite: (site) => {
        const state = get();
        // Auto-calculate order within category
        const sitesInCategory = state.sites.filter(s => s.categoryId === site.categoryId);
        const maxOrder = sitesInCategory.length > 0
            ? Math.max(...sitesInCategory.map(s => s.order))
            : -1;
        const siteWithOrder = { ...site, order: maxOrder + 1 };
        set({ sites: [...state.sites, siteWithOrder] });
        get()._syncToFirestore();
    },

    updateSite: (id, updates) => {
        set((state) => ({
            sites: state.sites.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s)
        }));
        get()._syncToFirestore();
    },

    deleteSite: (id) => {
        set((state) => ({ sites: state.sites.filter(s => s.id !== id) }));
        get()._syncToFirestore();
    },

    getSitesByCategory: (categoryId) => {
        return get().sites
            .filter(s => s.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    },

    moveSite: (siteId, newCategoryId) => {
        set((state) => {
            const sitesInNewCategory = state.sites.filter(s => s.categoryId === newCategoryId);
            const maxOrder = sitesInNewCategory.length > 0
                ? Math.max(...sitesInNewCategory.map(s => s.order))
                : -1;

            return {
                sites: state.sites.map(s =>
                    s.id === siteId
                        ? { ...s, categoryId: newCategoryId, order: maxOrder + 1, updatedAt: Date.now() }
                        : s
                )
            };
        });
        get()._syncToFirestore();
    },

    reorderSites: (sites) => {
        set({ sites });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { sites, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { sites });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.sites && data.sites.length > 0) {
            set({
                sites: deduplicateById(data.sites),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ sites: [], isLoading: true, _initialized: false });
    }
}));

// Atomic Selectors
export const useSites = () => useSitesStore((state) => state.sites);
export const useIsSitesLoading = () => useSitesStore((state) => state.isLoading);

export const useSiteActions = () => useSitesStore(
    useShallow((state) => ({
        addSite: state.addSite,
        updateSite: state.updateSite,
        deleteSite: state.deleteSite,
        moveSite: state.moveSite,
        reorderSites: state.reorderSites,
        setSites: state.setSites,
        getSitesByCategory: state.getSitesByCategory,
    }))
);
