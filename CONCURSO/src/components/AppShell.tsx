import { ArrowLeft, Menu, Settings } from 'lucide-react';
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { END_DATE, NAV_ITEMS } from '../app/constants';
import { MAIN_SITE_URL } from '../app/mainSite';
import { useAppContext } from '../app/AppContext';
import { prefetchConcursoRoutePath } from '../app/routeChunks';
import { getChecklistProgressPercent } from '../app/progress';
import { ProgressBar } from './ProgressBar';
import { formatIsoDateCompactPtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { buildManualPlanSummary } from '../app/manualPlanContentRefs';
import { FloatingBottomNav } from './Navigation/FloatingBottomNav';
import { warmMainSiteEntryPoint } from '../../../utils/mainSitePrefetch';

const PRIMARY_NAV_PATHS = new Set(['/', '/plano-diario', '/conteudo', '/anki', '/simulados-redacoes']);
const primaryNavItems = NAV_ITEMS.filter((item) => PRIMARY_NAV_PATHS.has(item.to));
const settingsNavItem = NAV_ITEMS.find((item) => item.to === '/configuracoes');
const READER_EVENT_NAME = 'concurso-reader-mode';
const ROUTE_PREFETCH_PATHS = ['/plano-diario', '/conteudo', '/anki', '/simulados-redacoes', '/configuracoes'] as const;

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
  const { state, dayPlansByDate, setSelectedDate } = useAppContext();
  const record = state.dailyRecords[state.selectedDate];
  const dayPlan = dayPlansByDate[state.selectedDate];
  const dayProgress = record ? getChecklistProgressPercent(record.checklist) : 0;
  const shellRef = useRef<HTMLElement | null>(null);
  const [isTouchMode, setIsTouchMode] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(hover: none), (pointer: coarse)').matches
      : false,
  );
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 920px)').matches
      : false,
  );
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [contentOffset, setContentOffset] = useState(34);
  const location = useLocation();
  const navigate = useNavigate();
  const manualSummary = dayPlan?.manualBlocks ? buildManualPlanSummary(dayPlan.manualBlocks) : '';
  const shellToggleAriaLabel = isCompactViewport
    ? isShellOpen
      ? 'Fechar menu lateral'
      : 'Abrir menu lateral'
    : isShellOpen
      ? 'Fechar menu superior'
      : 'Abrir menu superior';
  const isIslandVisible = isShellOpen || isHovered;
  const shellState = isReaderMode
    ? isIslandVisible
      ? 'reader-expanded'
      : 'reader-collapsed'
    : isIslandVisible
      ? 'expanded'
      : 'collapsed';

  const closeShell = () => {
    setIsShellOpen(false);
    setIsHovered(false);
  };

  const warmMainSite = useCallback(() => {
    void warmMainSiteEntryPoint();
  }, []);

  const toggleShell = () => {
    setIsShellOpen((current) => !current);
  };

  const handleMouseEnter = () => {
    if (isCompactViewport || isTouchMode) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isCompactViewport || isTouchMode) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 400);
  };

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

    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const applyMatches = (matches: boolean) => setIsTouchMode(matches);
    applyMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => applyMatches(event.matches);
    mediaQuery.addEventListener?.('change', listener);

    return () => {
      mediaQuery.removeEventListener?.('change', listener);
    };
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

  useEffect(() => {
    if (!isCompactViewport) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsShellOpen(false);
      setIsHovered(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCompactViewport, location.pathname]);

  useEffect(() => {
    if (!isShellOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeShell();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isShellOpen]);

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
  }, [shellState, isTouchMode]);

  const contentStyle = {
    '--content-offset': `${contentOffset}px`,
  } as CSSProperties;

  return (
    <div className="shell">
      {!isCompactViewport && isShellOpen ? (
        <button
          type="button"
          className="shell-backdrop"
          data-testid="desktop-shell-backdrop"
          aria-label="Fechar menu superior"
          onClick={closeShell}
        />
      ) : null}

      <div className="main-area">
        <header
          ref={shellRef}
          className="shell-chrome"
          data-testid="shell-chrome"
          data-shell-state={shellState}
        >
          <div className="mobile-brand-bar">
            {isCompactViewport ? (
              <button
                type="button"
                className="button button-ghost"
                onClick={() => navigate('/configuracoes')}
                aria-label="Abrir Configurações"
                style={{ padding: '8px', marginLeft: '-8px' }}
                onMouseEnter={() => {
                  void prefetchConcursoRoutePath('/configuracoes');
                }}
                onFocus={() => {
                  void prefetchConcursoRoutePath('/configuracoes');
                }}
              >
                <Settings size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="shell-handle shell-handle-mobile"
                data-testid="shell-handle"
                aria-controls="main-nav"
                aria-expanded={isShellOpen}
                aria-label={shellToggleAriaLabel}
                onClick={toggleShell}
              >
                <Menu size={18} />
                <span>Menu</span>
              </button>
            )}
            <div>
              <p className="kicker-label">Plano TRT 4</p>
              <strong className="mobile-brand-title">Command center do edital</strong>
            </div>
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

          {/* Desktop Shell menu has been removed in favor of hover island */}

          <div
            className={`island-wrapper ${isIslandVisible ? 'island-expanded' : 'island-collapsed'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!isCompactViewport && (
              <div
                className="desktop-dynamic-island"
                id="main-nav"
                aria-label="Navegacao principal e Contexto"
                aria-hidden={!isIslandVisible}
              >
                <div className="dynamic-island-collapsed" aria-hidden={isHovered}>
                  <div className="island-collapsed-kicker">
                    <span>Plano TRT 4</span>
                    <span className="island-collapsed-date">{formatIsoDateCompactPtBr(state.selectedDate)}</span>
                  </div>
                  <strong className="island-collapsed-title">
                    {dayPlan?.isRestDay
                      ? 'Domingo de descanso'
                      : dayPlan?.planMode === 'manual'
                        ? `Semana ${dayPlan.weekNumber ?? '-'} | ${manualSummary ?? 'Roteiro manual'}`
                        : `${subjectLabel(dayPlan?.subjects[0] ?? 'portugues')} + ${subjectLabel(
                            dayPlan?.subjects[1] ?? 'rlm',
                          )} | ${workActivityLabel(dayPlan?.workActivity ?? 'programacao')}`}
                  </strong>
                  <div className="island-collapsed-progress">
                    <ProgressBar value={dayProgress} compact />
                  </div>
                </div>

                <nav className="desktop-nav-panel context-tray" aria-hidden={!isIslandVisible}>
                  <div className="desktop-nav-header">
                    <div className="island-date-picker">
                      <label className="context-label" htmlFor="shell-date-input">Dia selecionado</label>
                      <input
                        id="shell-date-input"
                        className="input"
                        type="date"
                        min={state.planSettings.startDate}
                        max={END_DATE}
                        value={state.selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                      />
                    </div>
                  </div>

                  <ul className="desktop-nav-list">
                    {primaryNavItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          data-testid={`nav-${item.to === '/' ? 'dashboard' : item.to.replace('/', '')}`}
                          className={({ isActive }) =>
                            isActive ? 'desktop-nav-link desktop-nav-link-active' : 'desktop-nav-link'
                          }
                          onClick={closeShell}
                          onMouseEnter={() => {
                            void prefetchConcursoRoutePath(item.to);
                          }}
                          onFocus={() => {
                            void prefetchConcursoRoutePath(item.to);
                          }}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>

                  <div className="desktop-nav-footer">
                    {settingsNavItem ? (
                      <NavLink
                        to={settingsNavItem.to}
                        className={({ isActive }) =>
                          isActive
                            ? 'desktop-nav-secondary desktop-nav-secondary-active'
                            : 'desktop-nav-secondary'
                        }
                        onClick={closeShell}
                        onMouseEnter={() => {
                          void prefetchConcursoRoutePath(settingsNavItem.to);
                        }}
                        onFocus={() => {
                          void prefetchConcursoRoutePath(settingsNavItem.to);
                        }}
                      >
                        <Settings size={16} />
                        <span>{settingsNavItem.label}</span>
                      </NavLink>
                    ) : null}
                    <div className="island-fixed-rhythm">
                      <span className="context-label">Ritmo fixo</span>
                      <strong className="context-main-value">Domingo descanso · 50 questões</strong>
                    </div>
                  </div>
                </nav>
              </div>
            )}
          </div>

          {/* ContextBar removed, components merged into Dynamic Island */}
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
