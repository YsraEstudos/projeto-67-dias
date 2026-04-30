import { lazy, type ComponentType } from 'react';

type RouteModule = {
  default: ComponentType<Record<string, never>>;
};

export type ConcursoRouteKey = 'clean';

const normalizeRoutePath = (path: string): string => path.split(/[?#]/, 1)[0];

export const resolveConcursoRouteKey = (path: string): ConcursoRouteKey | null => {
  const normalizedPath = normalizeRoutePath(path);

  switch (normalizedPath) {
    case '/':
      return 'clean';
    default:
      return null;
  }
};

const routeChunkCache = new Map<ConcursoRouteKey, Promise<RouteModule>>();

const loadCleanConcursoPage = () =>
  import('../pages/CleanConcursoPage').then((module) => ({ default: module.CleanConcursoPage }));

export const concursoRouteLoaders = {
  clean: loadCleanConcursoPage,
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

export const CleanConcursoPage = createLazyPage('clean');
