/**
 * Links Store - Quick links with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { LinkItem } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface LinksState {
    links: LinkItem[];
    isLoading: boolean;

    // Link Actions
    setLinks: (links: LinkItem[]) => void;
    addLink: (link: LinkItem) => void;
    updateLink: (id: string, updates: Partial<LinkItem>) => void;
    deleteLink: (id: string) => void;
    incrementClickCount: (id: string) => void;
    reorderLinks: (links: LinkItem[]) => void;

    setLoading: (loading: boolean) => void;
}

export const useLinksStore = create<LinksState>()(
    persist(
        (set) => ({
            links: [],
            isLoading: true,

            // Link Actions
            setLinks: (links) => set({ links }),

            addLink: (link) => set((state) => ({
                links: [...state.links, link]
            })),

            updateLink: (id, updates) => set((state) => ({
                links: state.links.map(l => l.id === id ? { ...l, ...updates } : l)
            })),

            deleteLink: (id) => set((state) => ({
                links: state.links.filter(l => l.id !== id)
            })),

            incrementClickCount: (id) => set((state) => ({
                links: state.links.map(l =>
                    l.id === id ? { ...l, clickCount: l.clickCount + 1, lastClicked: Date.now() } : l
                )
            })),

            reorderLinks: (links) => set({ links }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_links_store',
            storage: createFirebaseStorage('p67_links_store'),
            partialize: (state) => ({ links: state.links }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate links (same id)
                if (state?.links?.length) {
                    const seen = new Set<string>();
                    const uniqueLinks = state.links.filter(l => {
                        if (seen.has(l.id)) return false;
                        seen.add(l.id);
                        return true;
                    });
                    if (uniqueLinks.length !== state.links.length) {
                        state.setLinks(uniqueLinks);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);

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
    }))
);
