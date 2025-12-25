/**
 * useNavigationHistory - Hook for browser History API integration
 * 
 * Enables native browser back button and mobile swipe gestures to work
 * with the multi-tab navigation system.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useUIStore } from '../stores/uiStore';
import { ViewState } from '../types';

interface NavigationState {
    tabId?: string;
    view?: ViewState;
    subView?: string; // 'editor', 'detail', etc.
    itemId?: string;  // noteId, entryId, etc.
}

export const useNavigationHistory = () => {
    // Use individual selectors for actions (they never change) to avoid re-renders
    const setActiveTab = useTabStore((state) => state.setActiveTab);
    const updateTabState = useTabStore((state) => state.updateTabState);
    const activeTabId = useTabStore((state) => state.activeTabId);

    const setActiveView = useUIStore((state) => state.setActiveView);

    // Ref to track if we're handling a popstate (to avoid pushing state during pop)
    const isHandlingPopState = useRef(false);

    // Store activeTabId in ref to avoid stale closures
    const activeTabIdRef = useRef(activeTabId);
    useEffect(() => {
        activeTabIdRef.current = activeTabId;
    }, [activeTabId]);

    /**
     * Push a new navigation state to browser history
     */
    const pushNavigation = useCallback((state: NavigationState) => {
        if (isHandlingPopState.current) return;

        // Build a clean state object
        const historyState: NavigationState = {
            tabId: state.tabId || activeTabIdRef.current || undefined,
            view: state.view,
            subView: state.subView,
            itemId: state.itemId,
        };

        history.pushState(historyState, '');
    }, []); // No dependencies - uses ref

    /**
     * Replace current history state (use when updating without adding to history)
     */
    const replaceNavigation = useCallback((state: NavigationState) => {
        const historyState: NavigationState = {
            tabId: state.tabId || activeTabIdRef.current || undefined,
            view: state.view,
            subView: state.subView,
            itemId: state.itemId,
        };

        history.replaceState(historyState, '');
    }, []); // No dependencies - uses ref

    /**
     * Handle browser back/forward navigation
     */
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            isHandlingPopState.current = true;

            const state = event.state as NavigationState | null;

            if (!state) {
                // No state = initial page load or cleared history
                // Go to dashboard and close all tabs
                setActiveView(ViewState.DASHBOARD);
                // Clear active tab (don't close tabs, just deactivate)
                setActiveTab('');
                isHandlingPopState.current = false;
                return;
            }

            if (state.subView && state.tabId) {
                // Was in a sub-view (editor/detail), now going back to list
                // Clear the sub-view state in the tab
                updateTabState(state.tabId, {
                    activeNoteId: null,
                    selectedEntryId: null,
                    isCreating: false,
                });
            } else if (state.tabId && state.view) {
                // Navigate to specific tab
                setActiveTab(state.tabId);
                setActiveView(state.view);
            } else if (state.view) {
                // Navigate to view without tab (legacy/simple mode)
                setActiveView(state.view);
            } else {
                // Fallback to dashboard
                setActiveView(ViewState.DASHBOARD);
                setActiveTab('');
            }

            isHandlingPopState.current = false;
        };

        window.addEventListener('popstate', handlePopState);

        // Set initial state if not present
        if (!history.state) {
            history.replaceState({ view: ViewState.DASHBOARD }, '');
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [setActiveView, setActiveTab, updateTabState]); // Stable actions only

    return {
        pushNavigation,
        replaceNavigation,
        isHandlingPopState: isHandlingPopState.current,
    };
};
