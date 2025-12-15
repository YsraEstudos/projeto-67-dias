/**
 * UI Store - Navigation and UI state (ephemeral, not persisted)
 */
import { create } from 'zustand';
import { ViewState } from '../types';

interface UIState {
    // Navigation
    activeView: ViewState;
    isMenuOpen: boolean;

    // Actions
    setActiveView: (view: ViewState) => void;
    setMenuOpen: (open: boolean) => void;
    toggleMenu: () => void;
    goToDashboard: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Initial state
    activeView: ViewState.DASHBOARD,
    isMenuOpen: false,

    // Actions
    setActiveView: (view) => set({ activeView: view }),
    setMenuOpen: (open) => set({ isMenuOpen: open }),
    toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
    goToDashboard: () => set({ activeView: ViewState.DASHBOARD, isMenuOpen: false }),
}));
