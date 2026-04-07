import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AppProvider } from '../app/AppContext';
import { ThemeProvider } from '../app/ThemeContext';
import { STORAGE_KEY } from '../app/constants';
import { buildSnapshot } from '../app/storage';
import { createInitialState, TOPICS } from '../app/seed';
import type { AppState, TopicSubmatter } from '../app/types';

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

export const renderConcursoApp = (route: string, state?: AppState) => {
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
