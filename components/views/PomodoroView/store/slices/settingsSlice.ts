import { StateCreator } from 'zustand';
import { Settings } from '../types';
import { StoreState } from '../useStore';

export interface SettingsSlice {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsSlice> = (set) => ({
  settings: {
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    longBreakAfter: 4,
    autoStartPomodoro: false,
    autoStartBreak: false,
    disableBreak: false,
    alarmSound: 'bell',
    tickSound: 'none',
    volume: 50,
    desktopNotifications: false,
    theme: 'dark',
    accentColor: '#f43f5e',
    dailyGoal: 8,
    weekStartsOn: 1,
  },
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
});
