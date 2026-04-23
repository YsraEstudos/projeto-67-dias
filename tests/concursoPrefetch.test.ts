import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearConcursoPrefetchCache, warmConcursoEntryPoint } from '../utils/concursoPrefetch';

describe('concursoPrefetch', () => {
  beforeEach(() => {
    clearConcursoPrefetchCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    clearConcursoPrefetchCache();
    vi.unstubAllGlobals();
  });

  it('prefetches the concurso document and the published assets', async () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/concurso/assets/index-abc.css">
          <script type="module" src="/concurso/assets/index-def.js"></script>
        </head>
      </html>
    `;

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => html,
    }));

    vi.stubGlobal(
      'fetch',
      fetchMock,
    );

    await warmConcursoEntryPoint();

    expect(fetchMock).toHaveBeenCalledWith('/concurso/', { credentials: 'same-origin' });
    expect(document.querySelector('link[data-concurso-prefetch="true"][href$="/concurso/"]')).toBeTruthy();
    expect(
      document.querySelector('link[data-concurso-prefetch="true"][href$="/concurso/assets/index-abc.css"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('link[data-concurso-prefetch="true"][href$="/concurso/assets/index-def.js"]'),
    ).toBeTruthy();
  });

  it('deduplicates repeated warm calls', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<html><head></head></html>',
    }));

    vi.stubGlobal(
      'fetch',
      fetchMock,
    );

    const first = warmConcursoEntryPoint();
    const second = warmConcursoEntryPoint();

    expect(second).toBe(first);

    await first;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
