import React, { useState, Suspense, useMemo, useEffect, useCallback } from 'react';
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
  Gamepad2
} from 'lucide-react';
import { ViewState, DashboardCardProps, OrganizeTask } from './types';
import { Card } from './components/Card';
import { Loading, LoadingSimple } from './components/shared/Loading';
import { DropdownMenu } from './components/shared/DropdownMenu';
import { ConfirmModal } from './components/shared/ConfirmModal';
import { useAuth } from './hooks/useAuth';
// Zustand stores
import { useUIStore, useConfigStore, useWorkStore, useHabitsStore, useStreakStore, useSkillsStore, useReadingStore, useJournalStore, useNotesStore, useSundayStore, useGamesStore, useLinksStore, useRestStore, usePromptsStore, useReviewStore, useWaterStore, useTimerStore, clearAllStores } from './stores';
import { subscribeToDocument, flushPendingWrites } from './stores/firestoreSync';
import { StreakBadge } from './components/shared/StreakBadge';
import { SyncStatusIndicator } from './components/shared/SyncStatusIndicator';
import { ConflictModal } from './components/modals/ConflictModal';

// Services
import { calculateCurrentDay, getDaysUntilStart } from './services/weeklySnapshot';

// Data Migration
import { setupDataMigration } from './utils/dataMigration';
import { setupFirestoreMigration } from './utils/legacyToFirestoreMigration';


// Lazy load AuthView (only needed before login)
const AuthView = React.lazy(() => import('./components/views/AuthView').then(m => ({ default: m.AuthView })));

// --- Constants ---
const PROJECT_DURATION_DAYS = 67;

// --- Interfaces ---
interface WorkViewData {
  currentCount?: number;
  goal?: number;
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

// --- Floating Timer Widget (lazy loaded) ---
const TimerWidget = React.lazy(() => import('./components/TimerWidget').then(m => ({ default: m.TimerWidget })));

const App: React.FC = () => {
  // --- AUTH STATE (Firebase) ---
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    register,
    loginGoogle,
    loginGuest,
    logout,
    sendResetEmail,
    clearError
  } = useAuth();

  // --- APP STATE (Zustand) ---
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const isMenuOpen = useUIStore((state) => state.isMenuOpen);
  const setMenuOpen = useUIStore((state) => state.setMenuOpen);

  // Track if data has finished syncing from cloud
  const [isDataReady, setIsDataReady] = useState(false);

  // Read Work Data for Dashboard (Zustand)
  const workCurrentCount = useWorkStore((state) => state.currentCount);
  const workGoal = useWorkStore((state) => state.goal);

  // Read Reading Data for Dashboard (Zustand)
  const books = useReadingStore((state) => state.books);

  // Calculate reading stats dynamically
  const readingStats = useMemo(() => {
    const reading = books.filter(b => b.status === 'READING');
    const completed = books.filter(b => b.status === 'COMPLETED');
    const total = books.length;
    const progressPercent = total > 0
      ? Math.round((completed.length / total) * 100)
      : 0;

    return {
      readingCount: reading.length,
      completedCount: completed.length,
      totalCount: total,
      progressPercent
    };
  }, [books]);

  // --- PROJECT CONFIG (Zustand) ---
  const config = useConfigStore((state) => state.config);
  const setConfig = useConfigStore((state) => state.setConfig);

  // Update project config when user changes
  useEffect(() => {
    if (user && !config.userName && isDataReady) {
      setConfig({
        userName: user.name,
        isGuest: user.isGuest
      });
    }
  }, [user, config.userName, setConfig, isDataReady]);

  // Apply theme class to body element
  useEffect(() => {
    // Remove all theme classes
    document.body.classList.remove('theme-default', 'theme-amoled');
    // Apply current theme
    document.body.classList.add(`theme-${config.theme || 'default'}`);
  }, [config.theme]);

  // FIRESTORE-FIRST: Subscribe to real-time updates for all stores
  // This replaces the old rehydrateAllStores approach
  useEffect(() => {
    if (!user?.id) {
      setIsDataReady(true); // No user, no sync needed
      return;
    }

    setIsDataReady(false);
    flushPendingWrites(); // Flush pending writes before clearing stores
    clearAllStores(); // Prevent data leaks between users

    const unsubscribers: (() => void)[] = [];
    const hydratedStores = new Set<string>();
    const totalStores = 16;

    const checkAllHydrated = (storeKey: string) => {
      // Only count first hydration per store
      if (hydratedStores.has(storeKey)) return;
      hydratedStores.add(storeKey);

      if (hydratedStores.size >= totalStores) {
        setIsDataReady(true);
        console.log('[App] All stores hydrated, UI ready');
      }
    };

    // Subscribe to all stores and hydrate with _hydrateFromFirestore
    unsubscribers.push(subscribeToDocument('p67_project_config', (data: any) => {
      useConfigStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_project_config');
    }));

    unsubscribers.push(subscribeToDocument('p67_habits_store', (data: any) => {
      useHabitsStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_habits_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_work_store', (data: any) => {
      useWorkStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_work_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_notes_store', (data: any) => {
      useNotesStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_notes_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_sunday_store', (data: any) => {
      useSundayStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_sunday_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_journal_store', (data: any) => {
      useJournalStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_journal_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_links_store', (data: any) => {
      useLinksStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_links_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_skills_store', (data: any) => {
      useSkillsStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_skills_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_reading_store', (data: any) => {
      useReadingStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_reading_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_rest_store', (data: any) => {
      useRestStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_rest_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_prompts_store', (data: any) => {
      usePromptsStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_prompts_store');
    }));

    unsubscribers.push(subscribeToDocument('games-storage', (data: any) => {
      useGamesStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('games-storage');
    }));

    unsubscribers.push(subscribeToDocument('p67_review_store', (data: any) => {
      useReviewStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_review_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_water_store', (data: any) => {
      useWaterStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_water_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_streak_store', (data: any) => {
      useStreakStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_streak_store');
    }));

    unsubscribers.push(subscribeToDocument('p67_tool_timer', (data: any) => {
      useTimerStore.getState()._hydrateFromFirestore(data);
      checkAllHydrated('p67_tool_timer');
    }));

    console.log('[App] Subscribed to', totalStores, 'stores for real-time sync');

    return () => {
      unsubscribers.forEach(unsub => unsub());
      console.log('[App] Unsubscribed from all stores');
    };
  }, [user?.id]);

  // Run data migration from legacy useStorage to Zustand stores
  useEffect(() => {
    const unsubscribe = setupDataMigration();
    return () => unsubscribe();
  }, []);

  // Run LocalStorage to Firestore migration for existing users
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = setupFirestoreMigration();
      return () => unsubscribe();
    }
  }, [user?.id]);

  // Check streak status on load
  // Check streak status ONLY after data is fully synced
  useEffect(() => {
    if (isDataReady) {
      useStreakStore.getState().checkStreak();
    }
  }, [isDataReady]);



  // Calculate current day and days until start
  const currentDay = useMemo(() => calculateCurrentDay(config.startDate), [config.startDate]);
  const daysUntilStart = useMemo(() => getDaysUntilStart(config.startDate), [config.startDate]);
  const hasStarted = currentDay > 0;

  // Optimization: Calculate notifications directly in selector to avoid re-renders
  const notificationCount = useHabitsStore((state) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return state.tasks.filter((t) => {
        if (t.isCompleted || t.isArchived) return false;
        if (t.reminderDate && t.reminderDate <= today) return true; // Due today or earlier
        if (t.dueDate && t.dueDate < today) return true; // Overdue
        return false;
      }).length;
    } catch {
      return 0;
    }
  });

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Security: Prevent multiple logout attempts
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setActiveView(ViewState.DASHBOARD);
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --- Configuration Data ---
  // Work data is now from Zustand store (already declared above)

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
        stats: isSunday ? 'HOJE' : undefined
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
        stats: readingStats.readingCount > 0
          ? `${readingStats.readingCount} lendo`
          : undefined,
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
    ];
  }, [notificationCount, workCurrentCount, workGoal, readingStats]);

  const renderContent = () => {
    let content: React.ReactNode;

    switch (activeView) {
      case ViewState.DASHBOARD:
        content = (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {dashboardCards.map((card) => (
              <Card
                key={card.id}
                {...card}
                onClick={setActiveView}
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
      default: content = <div>View not found</div>;
    }

    return (
      <Suspense fallback={<LoadingSimple />}>
        {content}
      </Suspense>
    );
  };

  const headerTitle = useMemo(() => {
    if (activeView === ViewState.DASHBOARD) return "Projeto 67 Dias";
    const card = dashboardCards.find(c => c.id === activeView);
    return card ? card.title : "Configurações";
  }, [activeView, dashboardCards]);

  // --- RENDER AUTH ---

  // Show loading while checking auth state or syncing data
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Show loading while syncing data from cloud (prevents stale data flash)
  if (user && !isDataReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-3">
        <Loading />
        <p className="text-slate-400 text-sm animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthView
        onEmailLogin={login}
        onRegister={register}
        onGoogleLogin={loginGoogle}
        onGuestLogin={loginGuest}
        onResetPassword={sendResetEmail}
        isLoading={authLoading}
        error={authError}
        clearError={clearError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">

      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-slate-800/50 transition-all duration-300">


        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">

          <div className="flex items-center gap-4 w-20">
            {activeView !== ViewState.DASHBOARD && (
              <button
                onClick={() => setActiveView(ViewState.DASHBOARD)}
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
                      }
                    }
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
            {/* User Profile / Logout */}
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

      {/* Floating Timer Bubble (Only on Dashboard) */}
      {activeView === ViewState.DASHBOARD && (
        <Suspense fallback={null}>
          <TimerWidget onClick={() => setActiveView(ViewState.TOOLS)} />
        </Suspense>
      )}

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
        <span title="Atualizações são feitas de 15 em 15 dias" className="cursor-help hover:text-slate-500 transition-colors">
          versão 1.0
        </span>
      </footer>

      {/* Conflict Resolution Modal (PWA offline sync) */}
      <ConflictModal />

    </div>
  );
};

export default App;
