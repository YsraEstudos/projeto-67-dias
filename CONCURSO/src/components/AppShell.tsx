import { ArrowLeft } from 'lucide-react';
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { MAIN_SITE_URL } from '../app/mainSite';
import { prefetchConcursoRoutePath } from '../app/routeChunks';
import { FloatingBottomNav } from './Navigation/FloatingBottomNav';
import { warmMainSiteEntryPoint } from '../../../utils/mainSitePrefetch';

const READER_EVENT_NAME = 'concurso-reader-mode';
const ROUTE_PREFETCH_PATHS = ['/'] as const;

const RouteLoadingFallback = () => (
  <section className="page" aria-busy="true" aria-live="polite">
    <div className="section-card section-card-flat route-loading-card">
      <p className="kicker-label">Carregando módulo</p>
      <h3>Preparando a próxima tela</h3>
      <p>O shell já está pronto. Estamos buscando apenas o conteúdo específico desta rota.</p>
    </div>
  </section>
);

export const AppShell = () => {
  const shellRef = useRef<HTMLElement | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 920px)').matches
      : false,
  );
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [contentOffset, setContentOffset] = useState(34);
  const shellState = isReaderMode ? 'reader-collapsed' : 'collapsed';

  const warmMainSite = useCallback(() => {
    void warmMainSiteEntryPoint();
  }, []);

  useEffect(() => {
    const warmRoutes = () => {
      ROUTE_PREFETCH_PATHS.forEach((path) => {
        void prefetchConcursoRoutePath(path);
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(warmRoutes, { timeout: 1800 });
      return () => window.cancelIdleCallback?.(idleHandle);
    }

    const timer = window.setTimeout(warmRoutes, 1600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 920px)');
    const applyMatches = (matches: boolean) => setIsCompactViewport(matches);
    applyMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => applyMatches(event.matches);
    mediaQuery.addEventListener?.('change', listener);

    return () => {
      mediaQuery.removeEventListener?.('change', listener);
    };
  }, []);

  useEffect(() => {
    const handleReaderMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean }>;
      setIsReaderMode(Boolean(customEvent.detail?.active));
    };

    window.addEventListener(READER_EVENT_NAME, handleReaderMode as EventListener);
    return () => {
      window.removeEventListener(READER_EVENT_NAME, handleReaderMode as EventListener);
    };
  }, []);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return undefined;
    }

    const updateOffset = () => {
      const { height } = shell.getBoundingClientRect();
      setContentOffset(Math.max(34, Math.ceil(height) + 18));
    };

    updateOffset();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateOffset);
      return () => {
        window.removeEventListener('resize', updateOffset);
      };
    }

    const observer = new ResizeObserver(() => {
      updateOffset();
    });

    observer.observe(shell);
    window.addEventListener('resize', updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOffset);
    };
  }, [shellState]);

  const contentStyle = {
    '--content-offset': `${contentOffset}px`,
  } as CSSProperties;

  return (
    <div className="shell">
      <div className="main-area">
        <header
          ref={shellRef}
          className="shell-chrome"
          data-testid="shell-chrome"
          data-shell-state={shellState}
        >
          <div className="mobile-brand-bar">

            <button
              type="button"
              className="button button-ghost"
              onClick={() => window.location.assign(MAIN_SITE_URL)}
              aria-label="Voltar ao Projeto 67 Dias"
              onMouseEnter={warmMainSite}
              onFocus={warmMainSite}
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        </header>

        <main className={`content ${isCompactViewport ? 'content-mobile-spaced' : ''}`} style={contentStyle}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
        {isCompactViewport && <FloatingBottomNav />}
      </div>
    </div>
  );
};
