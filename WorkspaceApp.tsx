import React, { useState, Suspense, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Library,
  GraduationCap,
  Flame,
  PenTool,
  LineChart,
  Coffee,
  Wrench,
  Settings,
  ChevronLeft,
  Menu,
  Globe,
  LogOut,
  Timer,
  CalendarCheck,
  Gamepad2,
  Trophy,
  BookOpen
} from 'lucide-react';
import { ViewState, DashboardCardProps, type User } from './types';
import { Card } from './components/Card';
import { LoadingSimple } from './components/shared/Loading';
import { DropdownMenu } from './components/shared/DropdownMenu';
import { ConfirmModal } from './components/shared/ConfirmModal';
// Zustand stores (only what WorkspaceApp itself needs)
import { useUIStore, useConfigStore, useWorkStore, useHabitsStore } from './stores';
import { StreakBadge } from './components/shared/StreakBadge';
import { SyncStatusIndicator } from './components/shared/SyncStatusIndicator';
import { ConflictModal } from './components/modals/ConflictModal';
import { TabBar } from './components/shared/TabBar';
import { useTabStore } from './stores/tabStore';
import { useNavigationHistory } from './hooks/useNavigationHistory';
import { useCompetitionTracker } from './hooks/useCompetitionTracker';
import { warmConcursoEntryPoint } from './utils/concursoPrefetch';
// Extracted hooks
import { useHydrationOrchestrator } from './hooks/useHydrationOrchestrator';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { useDashboardStats } from './hooks/useDashboardStats';
// Services
import { calculateCurrentDay, getDaysUntilStart } from './services/weeklySnapshot';

// --- Constants ---
const PROJECT_DURATION_DAYS = 67;

// --- Interfaces ---
interface WorkspaceAppProps {
  user: User;
  onLogout: () => Promise<void>;
}

// --- Lazy Load Views ---
const WorkView = React.lazy(() => import('./components/views/WorkView'));
const RestView = React.lazy(() => import('./components/views/RestView'));
const ToolsView = React.lazy(() => import('./components/views/ToolsView'));
const ReadingView = React.lazy(() => import('./components/views/ReadingView'));
const ProgressView = React.lazy(() => import('./components/views/ProgressView'));
const HabitsView = React.lazy(() => import('./components/views/HabitsView'));
const JournalView = React.lazy(() => import('./components/views/JournalView'));
const SkillsView = React.lazy(() => import('./components/views/SkillsView'));
const SettingsView = React.lazy(() => import('./components/views/SettingsView'));
const LinksView = React.lazy(() => import('./components/views/LinksView'));
const SundayView = React.lazy(() => import('./components/views/SundayView'));
const GamesView = React.lazy(() => import('./components/views/GamesView'));
const PomodoroView = React.lazy(() => import('./components/views/PomodoroView'));
const AulasView = React.lazy(() => import('./components/views/AulasView'));

// --- Floating widgets (lazy loaded) ---
const TimerWidget = React.lazy(() => import('./components/TimerWidget').then(m => ({ default: m.TimerWidget })));
const SundayTimerWidget = React.lazy(() => import('./components/SundayTimerWidget').then(m => ({ default: m.SundayTimerWidget })));
const TaskNotificationWidget = React.lazy(() => import('./components/TaskNotificationWidget').then(m => ({ default: m.TaskNotificationWidget })));

const WorkspaceApp: React.FC<WorkspaceAppProps> = ({ user, onLogout }) => {
  // --- Orchestration hooks ---
  const isDataReady = useHydrationOrchestrator(user?.id);
  useAppBootstrap({ user, isDataReady });
  const { readingStats, aulasStats } = useDashboardStats();

  // --- UI state (Zustand) ---
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const isMenuOpen = useUIStore((state) => state.isMenuOpen);
  const setMenuOpen = useUIStore((state) => state.setMenuOpen);

  // --- Tab state (multi-tab navigation) ---
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const addTab = useTabStore((state) => state.addTab);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const updateTabState = useTabStore((state) => state.updateTabState);
  const { pushNavigation } = useNavigationHistory();

  // --- Concurso prefetch ---
  const warmConcurso = useCallback(() => {
    void warmConcursoEntryPoint();
  }, []);

  // --- Work data for dashboard ---
  const workCurrentCount = useWorkStore((state) => state.currentCount);
  const workGoal = useWorkStore((state) => state.getCurrentWeekGoal());

  // --- Config (start date for day counter) ---
  const config = useConfigStore((state) => state.config);

  // --- Notification count (habits with pending reminders) ---
  const notificationCount = useHabitsStore((state) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return state.tasks.filter((t) => {
        if (t.isCompleted || t.isArchived) return false;
        if (t.reminderDate && t.reminderDate <= today) return true;
        if (t.dueDate && t.dueDate < today) return true;
        return false;
      }).length;
    } catch {
      return 0;
    }
  });

  // --- Logout state ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    setIsLoggingOut(true);
    try {
      await onLogout();
      setActiveView(ViewState.DASHBOARD);
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --- Competition tracker ---
  useCompetitionTracker({
    enabled: Boolean(user?.id) && isDataReady,
    startDate: config.startDate,
  });

  // --- Day counter ---
  const currentDay = useMemo(() => calculateCurrentDay(config.startDate), [config.startDate]);
  const daysUntilStart = useMemo(() => getDaysUntilStart(config.startDate), [config.startDate]);
  const hasStarted = currentDay > 0;

  // --- View label helper ---
  const getViewLabel = useCallback((view: ViewState): string => {
    const labels: Record<ViewState, string> = {
      [ViewState.DASHBOARD]: 'Dashboard',
      [ViewState.WORK]: 'Trabalho',
      [ViewState.SUNDAY]: 'Ajeitar Rápido',
      [ViewState.LINKS]: 'Meus Links',
      [ViewState.READING]: 'Leitura',
      [ViewState.SKILLS]: 'Habilidades',
      [ViewState.HABITS]: 'Hábitos & Tarefas',
      [ViewState.JOURNAL]: 'Diário',
      [ViewState.PROGRESS]: 'Progresso',
      [ViewState.REST]: 'Descansos',
      [ViewState.TOOLS]: 'Ferramentas',
      [ViewState.SETTINGS]: 'Configurações',
      [ViewState.GAMES]: 'Jogos',
      [ViewState.CONCURSO]: 'Concurso',
      [ViewState.POMODORO]: 'Pomodoro',
      [ViewState.AULAS]: 'Estante de Aulas',
    };
    return labels[view] || view;
  }, []);

  // --- Card click handlers ---
  const handleCardClick = useCallback((view: ViewState) => {
    if (view === ViewState.CONCURSO) {
      window.location.href = window.location.origin + '/concurso/#/';
      return;
    }

    const existingTab = tabs.find((t) => t.view === view);

    if (existingTab) {
      setActiveTab(existingTab.id);
      setActiveView(view);
      pushNavigation({ view, tabId: existingTab.id });
    } else if (tabs.length === 0) {
      setActiveView(view);
      pushNavigation({ view });
    } else {
      addTab(view, getViewLabel(view));
      setActiveView(view);
      pushNavigation({ view });
    }
  }, [tabs, setActiveTab, setActiveView, addTab, pushNavigation, getViewLabel]);

  const handleCardMiddleClick = useCallback((view: ViewState) => {
    if (view === ViewState.CONCURSO) {
      window.open(window.location.origin + '/concurso/#/', '_blank');
      return;
    }
    addTab(view, getViewLabel(view));
    setActiveView(view);
    pushNavigation({ view });
  }, [addTab, setActiveView, pushNavigation, getViewLabel]);

  // --- Back button handler ---
  const handleBack = useCallback(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);

    if (activeTab) {
      const hasInternalState =
        activeTab.state?.activeNoteId ||
        activeTab.state?.selectedEntryId ||
        activeTab.state?.isCreating;

      if (hasInternalState) {
        updateTabState(activeTabId!, {
          activeNoteId: null,
          selectedEntryId: null,
          isCreating: false,
        });
        if (history.length > 1) {
          history.back();
        }
      } else {
        setActiveView(ViewState.DASHBOARD);
        setActiveTab('');
      }
    } else {
      setActiveView(ViewState.DASHBOARD);
    }
  }, [tabs, activeTabId, activeView, updateTabState, setActiveView, setActiveTab]);

  // --- Dashboard cards definition ---
  const dashboardCards: Omit<DashboardCardProps, 'onClick'>[] = useMemo(() => {
    const isSunday = new Date().getDay() === 0;
    return [
      {
        id: ViewState.WORK,
        title: 'Trabalho',
        subtitle: `${workCurrentCount}/${workGoal} itens`,
        icon: Briefcase,
        color: 'text-orange-500',
      },
      {
        id: ViewState.SUNDAY,
        title: 'Ajeitar Rápido',
        subtitle: isSunday ? 'É hoje! Dedique 2.5h' : 'Domingos • 2h 30m',
        icon: CalendarCheck,
        color: 'text-pink-500',
        stats: isSunday ? 'HOJE' : undefined,
      },
      {
        id: ViewState.LINKS,
        title: 'Meus Links',
        subtitle: 'Acesso Rápido',
        icon: Globe,
        color: 'text-indigo-400',
      },
      {
        id: ViewState.READING,
        title: 'Leitura',
        subtitle: `${readingStats.completedCount}/${readingStats.totalCount} livros (${readingStats.progressPercent}%)`,
        icon: Library,
        color: 'text-yellow-500',
        stats: readingStats.readingCount > 0 ? `${readingStats.readingCount} lendo` : undefined,
      },
      {
        id: ViewState.SKILLS,
        title: 'Habilidades (Skill Tree)',
        subtitle: 'Desenvolvimento Pessoal',
        icon: GraduationCap,
        color: 'text-emerald-400',
      },
      {
        id: ViewState.HABITS,
        title: 'Hábitos & Tarefas',
        subtitle: notificationCount > 0 ? `${notificationCount} lembretes` : 'Arrumar & Organizar',
        icon: Flame,
        color: 'text-orange-400',
        stats: notificationCount > 0 ? '!' : undefined,
        statsAlert: notificationCount > 0,
      },
      {
        id: ViewState.JOURNAL,
        title: 'Diário & Reflexões',
        subtitle: 'Registre seu dia',
        icon: PenTool,
        color: 'text-purple-500',
      },
      {
        id: ViewState.PROGRESS,
        title: 'Progresso & Revisão',
        subtitle: '',
        icon: LineChart,
        color: 'text-teal-500',
      },
      {
        id: ViewState.REST,
        title: 'Planejador de Descansos',
        subtitle: 'Pausas curtas',
        icon: Coffee,
        color: 'text-cyan-400',
      },
      {
        id: ViewState.TOOLS,
        title: 'Ferramentas',
        subtitle: 'Timer, Calc, Conversor',
        icon: Wrench,
        color: 'text-slate-400',
      },
      {
        id: ViewState.GAMES,
        title: 'Central de Jogos',
        subtitle: 'Missões e progresso',
        icon: Gamepad2,
        color: 'text-purple-400',
      },
      {
        id: ViewState.CONCURSO,
        title: 'Concurso Público',
        subtitle: 'App dedicado',
        icon: Trophy,
        color: 'text-purple-400',
        onWarm: warmConcurso,
      },
      {
        id: ViewState.POMODORO,
        title: 'Pomodoro',
        subtitle: 'Projetos curtos',
        icon: Timer,
        color: 'text-red-500',
      },
      {
        id: ViewState.AULAS,
        title: 'Estante de Aulas',
        subtitle: `${aulasStats.totalBooks} curso${aulasStats.totalBooks !== 1 ? 's' : ''} • ${aulasStats.readChapters}/${aulasStats.totalChapters} aulas`,
        icon: BookOpen,
        color: 'text-amber-400',
        stats: aulasStats.progressPercent > 0 ? `${aulasStats.progressPercent}%` : undefined,
      },
    ];
  }, [notificationCount, workCurrentCount, workGoal, readingStats, aulasStats, warmConcurso]);

  // --- Render view content ---
  const renderContent = () => {
    let content: React.ReactNode;

    switch (activeView) {
      case ViewState.DASHBOARD:
        content = (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {dashboardCards.map((card) => (
              <Card
                key={card.id}
                {...card}
                onClick={handleCardClick}
                onAuxClick={handleCardMiddleClick}
              />
            ))}
          </div>
        );
        break;
      case ViewState.WORK: content = <WorkView />; break;
      case ViewState.REST: content = <RestView />; break;
      case ViewState.TOOLS: content = <ToolsView />; break;
      case ViewState.READING: content = <ReadingView />; break;
      case ViewState.PROGRESS: content = <ProgressView />; break;
      case ViewState.HABITS: content = <HabitsView />; break;
      case ViewState.JOURNAL: content = <JournalView />; break;
      case ViewState.SETTINGS: content = <SettingsView />; break;
      case ViewState.SKILLS: content = <SkillsView />; break;
      case ViewState.LINKS: content = <LinksView />; break;
      case ViewState.SUNDAY: content = <SundayView />; break;
      case ViewState.GAMES: content = <GamesView />; break;
      case ViewState.POMODORO: content = <PomodoroView />; break;
      case ViewState.AULAS: content = <AulasView />; break;
      default: content = <div>View not found</div>;
    }

    return <Suspense fallback={<LoadingSimple />}>{content}</Suspense>;
  };

  const headerTitle = useMemo(() => {
    if (activeView === ViewState.DASHBOARD) return 'Projeto 67 Dias';
    const card = dashboardCards.find((c) => c.id === activeView);
    return card ? card.title : 'Configurações';
  }, [activeView, dashboardCards]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">

      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-slate-800/50 transition-all duration-300">
        {/* Tab Bar (only shown when tabs exist) */}
        <TabBar />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">

          <div className="flex items-center gap-4 w-20">
            {activeView !== ViewState.DASHBOARD && (
              <button
                onClick={handleBack}
                className="p-2.5 sm:p-2 -ml-2 hover:bg-slate-800/80 rounded-full transition-all text-slate-400 hover:text-white group hover:scale-105 active:bg-slate-700 touch-manipulation"
                aria-label="Voltar"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
            )}

            {activeView === ViewState.DASHBOARD && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!isMenuOpen)}
                  className={`p-2.5 bg-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-700 transition-all hover:scale-105 border border-slate-700/50 ${isMenuOpen ? 'bg-slate-700 border-slate-600' : ''}`}
                  aria-label="Menu"
                  aria-expanded={isMenuOpen}
                >
                  <Menu size={20} className="text-slate-400" />
                </button>

                <DropdownMenu
                  isOpen={isMenuOpen}
                  onClose={() => setMenuOpen(false)}
                  items={[
                    {
                      icon: <Settings size={18} />,
                      label: 'Configurações',
                      sublabel: 'Preferências do app',
                      onClick: () => {
                        setActiveView(ViewState.SETTINGS);
                        setMenuOpen(false);
                      },
                    },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <h1 className={`text-lg sm:text-2xl md:text-3xl font-bold text-gradient-primary transition-all duration-300 text-center ${activeView !== ViewState.DASHBOARD ? 'text-base sm:text-xl md:text-2xl' : ''}`}>
              {headerTitle}
            </h1>
            {activeView === ViewState.DASHBOARD && (
              <div className="flex items-center gap-2 mt-1.5">
                <StreakBadge size="sm" showFreeze={false} />
                <div className="flex gap-0.5">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hasStarted && Math.floor(currentDay / 10) > i ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide">
                  {hasStarted
                    ? `Dia ${Math.min(PROJECT_DURATION_DAYS, currentDay)} de ${PROJECT_DURATION_DAYS}`
                    : daysUntilStart === 0
                      ? 'Começa hoje!'
                      : `Faltam ${daysUntilStart} dia${daysUntilStart > 1 ? 's' : ''} para começar`
                  }
                </p>
              </div>
            )}
          </div>

          <div className="w-20 flex justify-end items-center gap-3">
            {activeView === ViewState.DASHBOARD && (
              <div className="flex items-center gap-3">
                <SyncStatusIndicator />
                <span className="hidden md:block text-sm text-slate-400 text-right">
                  <div className="font-bold text-slate-200">{user.name}</div>
                  <div className="text-[10px] uppercase tracking-wider">{user.isGuest ? 'Visitante' : 'Membro'}</div>
                </span>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2.5 bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-slate-400 transition-all border border-slate-700/50 hover:border-red-500/30 hover:scale-105"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 md:py-12 animate-in fade-in duration-500 relative">
        {renderContent()}
      </main>

      {/* Floating Timer Bubble (only on Dashboard) */}
      {activeView === ViewState.DASHBOARD && (
        <Suspense fallback={null}>
          <TimerWidget onClick={() => setActiveView(ViewState.TOOLS)} />
        </Suspense>
      )}

      {/* Floating Task Expiration Notification Widget (only on Dashboard) */}
      {activeView === ViewState.DASHBOARD && (
        <Suspense fallback={null}>
          <TaskNotificationWidget />
        </Suspense>
      )}

      {/* Floating Sunday Timer Widget (global — visible on any view when active) */}
      <Suspense fallback={null}>
        <SundayTimerWidget onClick={() => handleCardClick(ViewState.SUNDAY)} />
      </Suspense>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sair da conta"
        message="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar seus dados."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Footer Version */}
      <footer className="w-full py-4 text-center text-slate-600 text-xs tracking-wider">
        <span title="Atualizações são feitas todo mês" className="cursor-help hover:text-slate-500 transition-colors">
          versão 1.17.1
        </span>
      </footer>

      {/* Conflict Resolution Modal (PWA offline sync) */}
      <ConflictModal />

    </div>
  );
};

export default WorkspaceApp;
