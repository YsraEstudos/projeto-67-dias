import { lazy, type ComponentType } from 'react';

type RouteModule = {
  default: ComponentType<Record<string, never>>;
};

export type ConcursoRouteKey =
  | 'dashboard'
  | 'dailyPlan'
  | 'content'
  | 'contentTopic'
  | 'anki'
  | 'corrections'
  | 'simulados'
  | 'projects'
  | 'settings'
  | 'cutoffMarks';

const normalizeRoutePath = (path: string): string => path.split(/[?#]/, 1)[0];

export const resolveConcursoRouteKey = (path: string): ConcursoRouteKey | null => {
  const normalizedPath = normalizeRoutePath(path);

  if (normalizedPath.startsWith('/conteudo/topico/')) {
    return 'contentTopic';
  }

  switch (normalizedPath) {
    case '/':
      return 'dashboard';
    case '/plano-diario':
      return 'dailyPlan';
    case '/conteudo':
      return 'content';
    case '/anki':
      return 'anki';
    case '/correcoes':
      return 'corrections';
    case '/simulados-redacoes':
      return 'simulados';
    case '/projetos':
      return 'projects';
    case '/configuracoes':
      return 'settings';
    case '/notas-de-corte':
      return 'cutoffMarks';
    default:
      return null;
  }
};

const routeChunkCache = new Map<ConcursoRouteKey, Promise<RouteModule>>();

const loadDashboardPage = () =>
  import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage }));
const loadDailyPlanPage = () =>
  import('../pages/DailyPlanPage').then((module) => ({ default: module.DailyPlanPage }));
const loadContentPage = () =>
  import('../pages/ContentPage').then((module) => ({ default: module.ContentPage }));
const loadContentTopicPage = () =>
  import('../pages/ContentTopicPage').then((module) => ({ default: module.ContentTopicPage }));
const loadAnkiPage = () => import('../pages/AnkiPage').then((module) => ({ default: module.AnkiPage }));
const loadCorrectionsPage = () =>
  import('../pages/CorrectionsPage').then((module) => ({ default: module.CorrectionsPage }));
const loadSimuladosPage = () =>
  import('../pages/SimuladosPage').then((module) => ({ default: module.SimuladosPage }));
const loadProjectsPage = () =>
  import('../pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage }));
const loadSettingsPage = () =>
  import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage }));
const loadCutoffMarksPage = () =>
  import('../pages/CutoffMarksPage').then((module) => ({ default: module.CutoffMarksPage }));

export const concursoRouteLoaders = {
  dashboard: loadDashboardPage,
  dailyPlan: loadDailyPlanPage,
  content: loadContentPage,
  contentTopic: loadContentTopicPage,
  anki: loadAnkiPage,
  corrections: loadCorrectionsPage,
  simulados: loadSimuladosPage,
  projects: loadProjectsPage,
  settings: loadSettingsPage,
  cutoffMarks: loadCutoffMarksPage,
} satisfies Record<ConcursoRouteKey, () => Promise<RouteModule>>;

export const clearConcursoRouteCache = (): void => {
  routeChunkCache.clear();
};

export const preloadConcursoRoute = (route: ConcursoRouteKey): Promise<RouteModule> => {
  const cachedPromise = routeChunkCache.get(route);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = concursoRouteLoaders[route]();
  routeChunkCache.set(route, promise);
  return promise;
};

export const prefetchConcursoRoutePath = (path: string): Promise<RouteModule> | null => {
  const route = resolveConcursoRouteKey(path);
  if (!route) {
    return null;
  }

  return preloadConcursoRoute(route);
};

const createLazyPage = (route: ConcursoRouteKey) => lazy(() => preloadConcursoRoute(route));

export const DashboardPage = createLazyPage('dashboard');
export const DailyPlanPage = createLazyPage('dailyPlan');
export const ContentPage = createLazyPage('content');
export const ContentTopicPage = createLazyPage('contentTopic');
export const AnkiPage = createLazyPage('anki');
export const CorrectionsPage = createLazyPage('corrections');
export const SimuladosPage = createLazyPage('simulados');
export const ProjectsPage = createLazyPage('projects');
export const SettingsPage = createLazyPage('settings');
export const CutoffMarksPage = createLazyPage('cutoffMarks');
