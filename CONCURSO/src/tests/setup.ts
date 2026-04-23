import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const cloudStorageMock = {
  subscribeCloudAuthChanges: vi.fn(async (callback: (user: null) => void) => {
    callback(null);
    return () => undefined;
  }),
  subscribeCloudSnapshotChanges: vi.fn(
    async (_uid: string, callback: (result: { snapshot: null; lastChangedAt: null }) => void) => {
      callback({ snapshot: null, lastChangedAt: null });
      return () => undefined;
    },
  ),
  loginWithGoogleCloud: vi.fn(),
  loadCloudSnapshot: vi.fn(async () => ({ snapshot: null, lastChangedAt: null })),
  saveCloudSnapshot: vi.fn(async () => undefined),
};

vi.mock('../app/cloudStorage', () => ({
  ...cloudStorageMock,
}));

vi.mock('../app/routeChunks', async () => {
  const [
    dashboardPage,
    dailyPlanPage,
    contentPage,
    contentTopicPage,
    ankiPage,
    correctionsPage,
    simuladosPage,
    projectsPage,
    settingsPage,
    cutoffMarksPage,
  ] = await Promise.all([
    import('../pages/DashboardPage'),
    import('../pages/DailyPlanPage'),
    import('../pages/ContentPage'),
    import('../pages/ContentTopicPage'),
    import('../pages/AnkiPage'),
    import('../pages/CorrectionsPage'),
    import('../pages/SimuladosPage'),
    import('../pages/ProjectsPage'),
    import('../pages/SettingsPage'),
    import('../pages/CutoffMarksPage'),
  ]);

  return {
    DashboardPage: dashboardPage.DashboardPage,
    DailyPlanPage: dailyPlanPage.DailyPlanPage,
    ContentPage: contentPage.ContentPage,
    ContentTopicPage: contentTopicPage.ContentTopicPage,
    AnkiPage: ankiPage.AnkiPage,
    CorrectionsPage: correctionsPage.CorrectionsPage,
    SimuladosPage: simuladosPage.SimuladosPage,
    ProjectsPage: projectsPage.ProjectsPage,
    SettingsPage: settingsPage.SettingsPage,
    CutoffMarksPage: cutoffMarksPage.CutoffMarksPage,
    concursoRouteLoaders: {
      dashboard: vi.fn(async () => ({ default: dashboardPage.DashboardPage })),
      dailyPlan: vi.fn(async () => ({ default: dailyPlanPage.DailyPlanPage })),
      content: vi.fn(async () => ({ default: contentPage.ContentPage })),
      contentTopic: vi.fn(async () => ({ default: contentTopicPage.ContentTopicPage })),
      anki: vi.fn(async () => ({ default: ankiPage.AnkiPage })),
      corrections: vi.fn(async () => ({ default: correctionsPage.CorrectionsPage })),
      simulados: vi.fn(async () => ({ default: simuladosPage.SimuladosPage })),
      projects: vi.fn(async () => ({ default: projectsPage.ProjectsPage })),
      settings: vi.fn(async () => ({ default: settingsPage.SettingsPage })),
      cutoffMarks: vi.fn(async () => ({ default: cutoffMarksPage.CutoffMarksPage })),
    },
    clearConcursoRouteCache: vi.fn(),
    preloadConcursoRoute: vi.fn(async () => ({ default: dashboardPage.DashboardPage })),
    prefetchConcursoRoutePath: vi.fn(async () => undefined),
    resolveConcursoRouteKey: vi.fn(() => null),
  };
});

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
