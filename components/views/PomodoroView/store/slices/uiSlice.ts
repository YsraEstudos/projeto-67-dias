import { StateCreator } from 'zustand';
import { StoreState } from '../useStore';

export interface UISlice {
  currentFilter: string;
  isReportOpen: boolean;
  isSettingsOpen: boolean;
  selectedTaskId: string | null;
  activeTaskId: string | null;
  setFilter: (filter: string) => void;
  setReportOpen: (isOpen: boolean) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setSelectedTaskId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  currentFilter: 'today',
  isReportOpen: false,
  isSettingsOpen: false,
  selectedTaskId: null,
  activeTaskId: null,
  setFilter: (filter) => set({ currentFilter: filter, selectedTaskId: null }),
  setReportOpen: (isOpen) => set({ isReportOpen: isOpen }),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
});
