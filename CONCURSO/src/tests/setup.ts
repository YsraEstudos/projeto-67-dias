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
  const cleanConcursoPage = await import('../pages/CleanConcursoPage');

  return {
    CleanConcursoPage: cleanConcursoPage.CleanConcursoPage,
    concursoRouteLoaders: {
      clean: vi.fn(async () => ({ default: cleanConcursoPage.CleanConcursoPage })),
    },
    clearConcursoRouteCache: vi.fn(),
    preloadConcursoRoute: vi.fn(async () => ({ default: cleanConcursoPage.CleanConcursoPage })),
    prefetchConcursoRoutePath: vi.fn(async () => undefined),
    resolveConcursoRouteKey: vi.fn(() => null),
  };
});

vi.mock('../../../utils/mainSitePrefetch', () => ({
  warmMainSiteEntryPoint: vi.fn(async () => undefined),
  clearMainSitePrefetchCache: vi.fn(),
}));

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

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: function (index: number) {
      return Object.keys(store)[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
