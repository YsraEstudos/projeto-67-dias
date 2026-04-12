import { create } from 'zustand';
import {
  DailyPlannerDayInputs,
  DailyPlannerMessage,
  DailyPlannerPlan,
  DailyPlannerPreferences,
  DailyPlannerSession,
} from '../types';
import { writeToFirestore } from './firestoreSync';
import {
  createDailyPlannerSession,
  DAILY_PLANNER_DEFAULTS,
} from '../utils/dailyPlannerUtils';

const STORE_KEY = 'p67_daily_planner_store';

interface DailyPlannerStoreData {
  preferences: DailyPlannerPreferences;
  sessionsByDate: Record<string, DailyPlannerSession>;
}

interface DailyPlannerStoreState extends DailyPlannerStoreData {
  isLoading: boolean;
  _initialized: boolean;

  ensureSession: (date: string) => DailyPlannerSession;
  setPreferences: (updates: Partial<DailyPlannerPreferences>) => void;
  updateDayInputs: (date: string, updates: Partial<DailyPlannerDayInputs>) => void;
  setDraftMessage: (date: string, draftMessage: string) => void;
  addMessage: (date: string, message: Omit<DailyPlannerMessage, 'id' | 'createdAt'>) => DailyPlannerMessage;
  setPlan: (date: string, plan: DailyPlannerPlan | null) => void;
  toggleBlockComplete: (date: string, blockId: string) => void;
  setLoading: (date: string, isLoading: boolean) => void;
  setError: (date: string, error: string | null) => void;
  clearSession: (date: string) => void;

  _syncToFirestore: () => void;
  _hydrateFromFirestore: (data: DailyPlannerStoreData | null) => void;
  _reset: () => void;
}

const initialData: DailyPlannerStoreData = {
  preferences: DAILY_PLANNER_DEFAULTS,
  sessionsByDate: {},
};

const createMessage = (
  message: Omit<DailyPlannerMessage, 'id' | 'createdAt'>,
): DailyPlannerMessage => ({
  ...message,
  id: `planner-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: Date.now(),
});

const touchSession = (session: DailyPlannerSession): DailyPlannerSession => ({
  ...session,
  lastUpdatedAt: Date.now(),
});

const ensureSessionRecord = (
  sessionsByDate: Record<string, DailyPlannerSession>,
  date: string,
  preferences: DailyPlannerPreferences,
): DailyPlannerSession => sessionsByDate[date] || createDailyPlannerSession(date, preferences);

const mergeHydratedSession = (
  session: DailyPlannerSession,
  preferences: DailyPlannerPreferences,
): DailyPlannerSession => {
  const freshSession = createDailyPlannerSession(session.date, preferences);

  return {
    ...freshSession,
    ...session,
    dayInputs: {
      ...freshSession.dayInputs,
      ...session.dayInputs,
    },
    messages: Array.isArray(session.messages) ? session.messages : [],
    completedBlockIds: Array.isArray(session.completedBlockIds) ? session.completedBlockIds : [],
    latestPlan: session.latestPlan
      ? {
        ...session.latestPlan,
        generatedAt: session.latestPlan.generatedAt || Date.now(),
      }
      : null,
  };
};

export const useDailyPlannerStore = create<DailyPlannerStoreState>()((set, get) => ({
  ...initialData,
  isLoading: true,
  _initialized: false,

  ensureSession: (date) => {
    const existingSession = get().sessionsByDate[date];
    if (existingSession) {
      return existingSession;
    }

    const nextSession = createDailyPlannerSession(date, get().preferences);
    set((state) => ({
      sessionsByDate: {
        ...state.sessionsByDate,
        [date]: nextSession,
      },
    }));
    get()._syncToFirestore();
    return nextSession;
  },

  setPreferences: (updates) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...updates,
      },
    }));
    get()._syncToFirestore();
  },

  updateDayInputs: (date, updates) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      const nextInputs = {
        ...session.dayInputs,
        ...updates,
      };

      const nextPreferences: DailyPlannerPreferences = {
        ...state.preferences,
        defaultSleepTime: nextInputs.sleepTime,
        defaultWindDownMinutes: nextInputs.windDownMinutes,
        mealDurationMinutes: nextInputs.mealDurationMinutes,
        dogDurationMinutes: nextInputs.dogDurationMinutes,
      };

      return {
        preferences: nextPreferences,
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            dayInputs: nextInputs,
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  setDraftMessage: (date, draftMessage) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            draftMessage,
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  addMessage: (date, message) => {
    const nextMessage = createMessage(message);
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            messages: [...session.messages, nextMessage],
          }),
        },
      };
    });
    get()._syncToFirestore();
    return nextMessage;
  },

  setPlan: (date, plan) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      const validBlockIds = new Set(plan?.scheduledBlocks.map((block) => block.id) || []);
      const completedBlockIds = session.completedBlockIds.filter((id) => validBlockIds.has(id));

      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            latestPlan: plan,
            completedBlockIds,
            error: null,
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  toggleBlockComplete: (date, blockId) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      const completedSet = new Set(session.completedBlockIds);

      if (completedSet.has(blockId)) {
        completedSet.delete(blockId);
      } else {
        completedSet.add(blockId);
      }

      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            completedBlockIds: Array.from(completedSet),
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  setLoading: (date, isLoading) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            isLoading,
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  setError: (date, error) => {
    set((state) => {
      const session = ensureSessionRecord(state.sessionsByDate, date, state.preferences);
      return {
        sessionsByDate: {
          ...state.sessionsByDate,
          [date]: touchSession({
            ...session,
            error,
            isLoading: false,
          }),
        },
      };
    });
    get()._syncToFirestore();
  },

  clearSession: (date) => {
    set((state) => {
      const nextSessions = { ...state.sessionsByDate };
      delete nextSessions[date];
      return { sessionsByDate: nextSessions };
    });
    get()._syncToFirestore();
  },

  _syncToFirestore: () => {
    const { preferences, sessionsByDate, _initialized } = get();
    if (_initialized) {
      writeToFirestore(STORE_KEY, { preferences, sessionsByDate });
    }
  },

  _hydrateFromFirestore: (data) => {
    if (!data) {
      set({
        ...initialData,
        isLoading: false,
        _initialized: true,
      });
      return;
    }

    const preferences = {
      ...DAILY_PLANNER_DEFAULTS,
      ...data.preferences,
    };
    const sessionsByDate = Object.fromEntries(
      Object.entries(data.sessionsByDate || {}).map(([date, session]) => [
        date,
        mergeHydratedSession(
          {
            ...session,
            date,
          },
          preferences,
        ),
      ]),
    );

    set({
      preferences,
      sessionsByDate,
      isLoading: false,
      _initialized: true,
    });
  },

  _reset: () => {
    set({
      ...initialData,
      isLoading: true,
      _initialized: false,
    });
  },
}));
