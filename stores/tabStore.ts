import { create } from 'zustand';
import { ViewState } from '../types';
import { generateUUID } from '../utils/uuid';

export interface Tab {
    id: string;
    label: string;
    view: ViewState;
    // Store internal state for each view (e.g. activeNoteId, activeJournalId)
    state: Record<string, any>;
    createdAt: number;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;

    // Actions
    addTab: (view: ViewState, label: string, initialState?: Record<string, any>, activate?: boolean) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTabState: (tabId: string, newState: Record<string, any>) => void;

    // Helpers
    getTab: (id: string) => Tab | undefined;
}

// Maximum number of tabs allowed for performance
const MAX_TABS = 20;

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [],
    activeTabId: null,

    addTab: (view, label, initialState = {}, activate = true) => {
        const newTab: Tab = {
            id: generateUUID(),
            label,
            view,
            state: initialState,
            createdAt: Date.now(),
        };

        set((state) => {
            let currentTabs = state.tabs;

            // If we hit the limit, remove the oldest tab
            if (currentTabs.length >= MAX_TABS) {
                currentTabs = currentTabs.slice(1); // Remove first (oldest)
            }

            return {
                tabs: [...currentTabs, newTab],
                // Only activate if activate=true (default behavior)
                activeTabId: activate ? newTab.id : state.activeTabId
            };
        });
    },

    closeTab: (id) => {
        set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== id);

            // If closing active tab, switch to the one to the right, or left, or null
            let newActiveId = state.activeTabId;
            if (id === state.activeTabId) {
                if (newTabs.length > 0) {
                    // Try to pick the last one or the one before it
                    newActiveId = newTabs[newTabs.length - 1].id;
                } else {
                    newActiveId = null;
                }
            }

            return {
                tabs: newTabs,
                activeTabId: newActiveId,
            };
        });
    },

    setActiveTab: (id) => set({ activeTabId: id }),

    updateTabState: (tabId, newState) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === tabId
                    ? { ...tab, state: { ...tab.state, ...newState } }
                    : tab
            ),
        }));
    },

    getTab: (id) => get().tabs.find(t => t.id === id)
}));
