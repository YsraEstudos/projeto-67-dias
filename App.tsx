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
import { useUIStore, useConfigStore, useWorkStore, useHabitsStore, useStreakStore, useSkillsStore, useReadingStore, useJournalStore, useNotesStore, useSundayStore, useGamesStore, subscribeToFirestore, rehydrateAllStores } from './stores';
import { StreakBadge } from './components/shared/StreakBadge';

// Data Migration
import { setupDataMigration } from './utils/dataMigration';


// Lazy load AuthView (only needed before login)
const AuthView = React.lazy(() => import('./components/views/AuthView').then(m => ({ default: m.AuthView })));

// --- Constants ---
const PROJECT_DURATION_DAYS = 67;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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



  // Read Work Data for Dashboard (Zustand)
  const workCurrentCount = useWorkStore((state) => state.currentCount);
  const workGoal = useWorkStore((state) => state.goal);

  // --- PROJECT CONFIG (Zustand) ---
  const config = useConfigStore((state) => state.config);
  const setConfig = useConfigStore((state) => state.setConfig);

  // Update project config when user changes
  useEffect(() => {
    if (user && !config.userName) {
      setConfig({
        userName: user.name,
        isGuest: user.isGuest
      });
    }
  }, [user, config.userName, setConfig]);

  // Ensure ALL stores rehydrate with the authenticated user scope (avoids guest fallback when auth is late)
  useEffect(() => {
    if (user?.id) {
      rehydrateAllStores(user.id);
    }
  }, [user?.id]);

  // Run data migration from legacy useStorage to Zustand stores
  useEffect(() => {
    const unsubscribe = setupDataMigration();
    return () => unsubscribe();
  }, []);

  // Check streak status on load
  useEffect(() => {
    useStreakStore.getState().checkStreak();
  }, []);

  // Real-time sync with Firebase for multi-device support
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to main stores for real-time sync across devices
    // When data changes in Firebase, update the local store
    const storeConfigs: Array<{ store: { getState: () => any; setState: (state: any) => void }; key: string }> = [
      { store: useConfigStore, key: 'p67_project_config' },
      { store: useHabitsStore, key: 'p67_habits_store' },
      { store: useWorkStore, key: 'p67_work_store' },
      { store: useSkillsStore, key: 'p67_skills_store' },
      { store: useReadingStore, key: 'p67_reading_store' },
      { store: useStreakStore, key: 'p67_streak_store' },
      { store: useJournalStore, key: 'p67_journal_store' },
      { store: useNotesStore, key: 'p67_notes_store' },
      { store: useSundayStore, key: 'p67_sunday_store' },
      { store: useGamesStore, key: 'games-storage' },
    ];

    storeConfigs.forEach(({ store, key }) => {
      const unsub = subscribeToFirestore(key, (data: any) => {
        if (data) {
          const currentState = store.getState();
          // Merge remote data with current state (preserve actions/methods)
          store.setState({ ...currentState, ...data });
        }
      });
      unsubscribers.push(unsub);
    });

    console.log('[App] Firebase real-time sync enabled for', storeConfigs.length, 'stores');

    return () => {
      unsubscribers.forEach(unsub => unsub());
      console.log('[App] Firebase real-time sync disabled');
    };
  }, [user?.id]);


  // Calculate current day
  const currentDay = useMemo(() => {
    const start = new Date(config.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / MS_PER_DAY);
    return diffDays;
  }, [config.startDate]);

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
        subtitle: '0/4 livros (0%)',
        icon: Library,
        color: 'text-yellow-500',
        stats: '2 lendo',
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
  }, [notificationCount, workCurrentCount, workGoal]);

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

  // Show loading while checking auth state
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loading />
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
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${Math.floor(currentDay / 10) > i ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide">
                  Dia {Math.min(PROJECT_DURATION_DAYS, Math.max(1, currentDay))} de {PROJECT_DURATION_DAYS}
                </p>
              </div>
            )}
          </div>

          <div className="w-20 flex justify-end items-center gap-3">
            {/* User Profile / Logout */}
            {activeView === ViewState.DASHBOARD && (
              <div className="flex items-center gap-3">
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

    </div>
  );
};

export default App;
