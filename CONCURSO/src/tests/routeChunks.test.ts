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

    const loader = vi.spyOn(concursoRouteLoaders, 'clean').mockResolvedValue({
      default: mockPage,
    });

    const first = preloadConcursoRoute('clean');
    const second = preloadConcursoRoute('clean');

    expect(second).toBe(first);

    await first;

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('usa o chunk do novo modulo para a raiz do concurso', async () => {
    const { clearConcursoRouteCache, concursoRouteLoaders, prefetchConcursoRoutePath } = await import(
      '../app/routeChunks'
    );
    clearConcursoRouteCache();

    const cleanLoader = vi.spyOn(concursoRouteLoaders, 'clean').mockResolvedValue({
      default: mockPage,
    });

    await prefetchConcursoRoutePath('/');

    expect(cleanLoader).toHaveBeenCalledTimes(1);
  });

  it('ignora rotas antigas no prefetch', async () => {
    const { clearConcursoRouteCache, prefetchConcursoRoutePath } = await import('../app/routeChunks');
    clearConcursoRouteCache();

    expect(prefetchConcursoRoutePath('/conteudo?focus=review-now')).toBeNull();
    expect(prefetchConcursoRoutePath('/conteudo/topico/item-123?foo=bar')).toBeNull();
  });
});
