import type { JSX as ReactJSX } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPage = (() => null) as unknown as () => ReactJSX.Element;

describe('routeChunks', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('../app/routeChunks');
  });

  it('deduplica o prefetch do mesmo chunk', async () => {
    const { clearConcursoRouteCache, concursoRouteLoaders, preloadConcursoRoute } = await import('../app/routeChunks');
    clearConcursoRouteCache();

    const loader = vi.spyOn(concursoRouteLoaders, 'content').mockResolvedValue({
      default: mockPage,
    });

    const first = preloadConcursoRoute('content');
    const second = preloadConcursoRoute('content');

    expect(second).toBe(first);

    await first;

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('resolve query strings e topicos para o chunk correto', async () => {
    const { clearConcursoRouteCache, concursoRouteLoaders, prefetchConcursoRoutePath } = await import(
      '../app/routeChunks'
    );
    clearConcursoRouteCache();

    const contentLoader = vi.spyOn(concursoRouteLoaders, 'content').mockResolvedValue({
      default: mockPage,
    });
    const topicLoader = vi.spyOn(concursoRouteLoaders, 'contentTopic').mockResolvedValue({
      default: mockPage,
    });

    await prefetchConcursoRoutePath('/conteudo?focus=review-now');
    await prefetchConcursoRoutePath('/conteudo/topico/item-123?foo=bar');

    expect(contentLoader).toHaveBeenCalledTimes(1);
    expect(topicLoader).toHaveBeenCalledTimes(1);
  });
});
