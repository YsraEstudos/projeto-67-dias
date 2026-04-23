import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import App from '../App';
import { AppProvider } from '../app/AppContext';
import { END_DATE, clampIsoDateToRange } from '../app/dateUtils';
import { ThemeProvider } from '../app/ThemeContext';
import { STORAGE_KEY } from '../app/constants';
import { buildSnapshot } from '../app/storage';
import { createInitialState, TOPICS } from '../app/seed';
import type { AppState, TopicSubmatter } from '../app/types';
import * as dateUtils from '../app/dateUtils';

export const topicIdByTitle = (title: string): string => {
  const topic = TOPICS.find((item) => item.isLeaf && item.title === title);
  if (!topic) {
    throw new Error(`Topic not found for title: ${title}`);
  }

  return topic.id;
};

export const persistAppState = (state: AppState): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot(state)));
};

const getCurrentLocalTodayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const syncMockedToday = (state?: AppState): void => {
  const mockedToday = state
    ? clampIsoDateToRange(state.selectedDate, state.planSettings.startDate, END_DATE)
    : getCurrentLocalTodayIsoDate();

  vi.spyOn(dateUtils, 'getLocalTodayIsoDate').mockReturnValue(mockedToday);
};

afterEach(() => {
  vi.restoreAllMocks();
});

export const renderConcursoApp = (route: string, state?: AppState) => {
  syncMockedToday(state);

  if (state) {
    persistAppState(state);
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
};

export const createSubmatter = (
  id: string,
  patch: Partial<TopicSubmatter> = {},
): TopicSubmatter => ({
  id,
  title: `Submatéria ${id}`,
  grade: 'C',
  lastReviewedAt: null,
  errorNote: '',
  actionNote: '',
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  ...patch,
});

export const createStateWithTopics = (
  patch: (state: AppState) => void,
): AppState => {
  const state = createInitialState();
  patch(state);
  return state;
};
