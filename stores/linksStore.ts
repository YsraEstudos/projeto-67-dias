/**
 * Links Store - Quick links with Firestore-first persistence
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { LinkItem } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_links_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface LinksState {
    links: LinkItem[];
    isLoading: boolean;
    _initialized: boolean;

    setLinks: (links: LinkItem[]) => void;
    addLink: (link: LinkItem) => void;
    updateLink: (id: string, updates: Partial<LinkItem>) => void;
    deleteLink: (id: string) => void;
    incrementClickCount: (id: string) => void;
    reorderLinks: (links: LinkItem[]) => void;
    addPromptToLink: (linkId: string, promptId: string) => void;
    removePromptFromLink: (linkId: string, promptId: string) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { links: LinkItem[] } | null) => void;
    _reset: () => void;
}

export const useLinksStore = create<LinksState>()((set, get) => ({
    links: [],
    isLoading: true,
    _initialized: false,

    setLinks: (links) => {
        set({ links: deduplicateById(links) });
        get()._syncToFirestore();
    },

    addLink: (link) => {
        set((state) => ({ links: [...state.links, link] }));
        get()._syncToFirestore();
    },

    updateLink: (id, updates) => {
        set((state) => ({
            links: state.links.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
        get()._syncToFirestore();
    },

    deleteLink: (id) => {
        set((state) => ({ links: state.links.filter(l => l.id !== id) }));
        get()._syncToFirestore();
    },

    incrementClickCount: (id) => {
        set((state) => ({
            links: state.links.map(l =>
                l.id === id ? { ...l, clickCount: l.clickCount + 1, lastClicked: Date.now() } : l
            )
        }));
        get()._syncToFirestore();
    },

    reorderLinks: (links) => {
        set({ links });
        get()._syncToFirestore();
    },

    addPromptToLink: (linkId, promptId) => {
        set((state) => ({
            links: state.links.map(l => {
                if (l.id === linkId) {
                    const currentIds = l.promptIds || [];
                    if (!currentIds.includes(promptId)) {
                        return { ...l, promptIds: [...currentIds, promptId] };
                    }
                }
                return l;
            })
        }));
        get()._syncToFirestore();
    },

    removePromptFromLink: (linkId, promptId) => {
        set((state) => ({
            links: state.links.map(l => {
                if (l.id === linkId) {
                    return { ...l, promptIds: (l.promptIds || []).filter(id => id !== promptId) };
                }
                return l;
            })
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { links, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { links });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            // Migrate promptId -> promptIds and category -> categoryId
            const migratedLinks = (data.links || []).map((link: any) => ({
                ...link,
                promptIds: link.promptIds ?? (link.promptId ? [link.promptId] : []),
                categoryId: link.categoryId ?? (link.category === 'PERSONAL' ? 'personal' : link.category === 'GENERAL' ? 'general' : link.category || 'personal'),
                promptId: undefined // Remove deprecated field
            }));
            set({
                links: deduplicateById(migratedLinks),
                isLoading: false,
                _initialized: true
            });
            // Persist migration
            get()._syncToFirestore();
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ links: [], isLoading: true, _initialized: false });
    }
}));

// Atomic Selectors
export const useLinks = () => useLinksStore((state) => state.links);
export const useIsLinksLoading = () => useLinksStore((state) => state.isLoading);

export const useLinkActions = () => useLinksStore(
    useShallow((state) => ({
        addLink: state.addLink,
        updateLink: state.updateLink,
        deleteLink: state.deleteLink,
        incrementClickCount: state.incrementClickCount,
        reorderLinks: state.reorderLinks,
        setLinks: state.setLinks,
        addPromptToLink: state.addPromptToLink,
        removePromptFromLink: state.removePromptFromLink,
    }))
);
