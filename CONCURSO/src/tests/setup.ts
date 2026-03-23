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
