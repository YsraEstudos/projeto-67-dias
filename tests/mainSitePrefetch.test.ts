import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMainSitePrefetchCache, warmMainSiteEntryPoint } from '../utils/mainSitePrefetch';

describe('mainSitePrefetch', () => {
  beforeEach(() => {
    clearMainSitePrefetchCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    clearMainSitePrefetchCache();
    vi.unstubAllGlobals();
  });

  it('prefetches the main document and the published assets', async () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/assets/index-abc.css">
          <script type="module" src="/assets/index-def.js"></script>
        </head>
      </html>
    `;

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => html,
    }));

    vi.stubGlobal('fetch', fetchMock);

    await warmMainSiteEntryPoint();

    expect(fetchMock).toHaveBeenCalledWith('/', { credentials: 'same-origin' });
    expect(document.querySelector('link[data-main-site-prefetch="true"][href$="/"]')).toBeTruthy();
    expect(document.querySelector('link[data-main-site-prefetch="true"][href$="/assets/index-abc.css"]')).toBeTruthy();
    expect(document.querySelector('link[data-main-site-prefetch="true"][href$="/assets/index-def.js"]')).toBeTruthy();
  });

  it('deduplicates repeated warm calls', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<html><head></head></html>',
    }));

    vi.stubGlobal('fetch', fetchMock);

    const first = warmMainSiteEntryPoint();
    const second = warmMainSiteEntryPoint();

    expect(second).toBe(first);

    await first;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
