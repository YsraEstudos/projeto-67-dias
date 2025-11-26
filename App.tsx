
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
  CalendarCheck // Changed Icon
} from 'lucide-react';
import { ViewState, DashboardCardProps, OrganizeTask, ProjectConfig } from './types';
import { Card } from './components/Card';
import { Loading } from './components/shared/Loading';
import { AuthView } from './components/views/AuthView';
import { useStorage } from './hooks/useStorage';
import { useAuth } from './hooks/useAuth';

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
const SundayView = React.lazy(() => import('./components/views/SundayView')); // New View
const PlaceholderView = React.lazy(() => import('./components/shared/PlaceholderView'));

// --- Floating Timer Widget ---
import { TimerWidget } from './components/TimerWidget';

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

  // --- APP STATE ---
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [notificationCount, setNotificationCount] = useState(0);

  // Read Work Data for Dashboard
  const [workData] = useStorage<any>('workview_data', {});

  // --- PROJECT CONFIG (For Day Counter) ---
  const [projectConfig, setProjectConfig] = useStorage<ProjectConfig>('p67_project_config', {
    startDate: new Date().toISOString(),
    userName: user?.name || '',
    isGuest: user?.isGuest || false
  });

  // Update project config when user changes
  useEffect(() => {
    if (user && !projectConfig.userName) {
      setProjectConfig(prev => ({
        ...prev,
        userName: user.name,
        isGuest: user.isGuest
      }));
    }
  }, [user, projectConfig.userName, setProjectConfig]);

  // Calculate current day
  const currentDay = useMemo(() => {
    const start = new Date(projectConfig.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [projectConfig.startDate]);

  // Optimization: Read tasks only when needed for notifications
  const updateNotifications = useCallback(() => {
    try {
      const saved = localStorage.getItem('p67_tasks');
      if (!saved) {
        setNotificationCount(0);
        return;
      }
      const tasks: OrganizeTask[] = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];

      const count = tasks.filter(t => {
        if (t.isCompleted || t.isArchived) return false;
        if (t.reminderDate && t.reminderDate <= today) return true;
        if (t.dueDate && t.dueDate < today) return true; // Overdue
        return false;
      }).length;
      setNotificationCount(count);
    } catch {
      setNotificationCount(0);
    }
  }, []);

  // Update notifications when returning to dashboard
  useEffect(() => {
    if (activeView === ViewState.DASHBOARD) {
      updateNotifications();
    }
  }, [activeView, updateNotifications]);

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      await logout();
      setActiveView(ViewState.DASHBOARD);
    }
  };

  // --- Configuration Data ---
  const dashboardCards: Omit<DashboardCardProps, 'onClick'>[] = useMemo(() => {
    const isSunday = new Date().getDay() === 0;
    return [
      {
        id: ViewState.WORK,
        title: 'Trabalho',
        subtitle: `${workData.currentCount || 0}/${workData.goal || 250} itens`,
        icon: Briefcase,
        color: 'text-orange-500',
      },
      {
        id: ViewState.SUNDAY, // Renamed from STUDY
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
    ];
  }, [notificationCount, workData]);

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
            {/* Settings Card */}
            <div className="col-span-1 md:col-span-2">
              <Card
                id={ViewState.SETTINGS}
                title="Configurações"
                icon={Settings}
                color="text-slate-400"
                onClick={setActiveView}
              />
            </div>
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
      case ViewState.SUNDAY: content = <SundayView />; break; // New Component
      default: content = <div>View not found</div>;
    }

    return (
      <Suspense fallback={<Loading />}>
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
        onLogin={() => {}}
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
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">

          <div className="flex items-center gap-4 w-20">
            {activeView !== ViewState.DASHBOARD && (
              <button
                onClick={() => setActiveView(ViewState.DASHBOARD)}
                className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white group"
                aria-label="Voltar"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {activeView === ViewState.DASHBOARD && (
              <div className="p-2 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700 transition-colors">
                <Menu size={20} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent transition-all duration-300 ${activeView !== ViewState.DASHBOARD ? 'text-xl md:text-2xl' : ''}`}>
              {headerTitle}
            </h1>
            {activeView === ViewState.DASHBOARD && (
              <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium tracking-wide">
                Dia {Math.min(67, Math.max(1, currentDay))} de 67
              </p>
            )}
          </div>

          <div className="w-20 flex justify-end items-center gap-3">
            {/* User Profile / Logout */}
            {activeView === ViewState.DASHBOARD && (
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm text-slate-400 text-right">
                  <div className="font-bold text-slate-200">{user.name}</div>
                  <div className="text-[10px] uppercase">{user.isGuest ? 'Visitante' : 'Membro'}</div>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-400 transition-colors"
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
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500 relative">
        {renderContent()}
      </main>

      {/* Floating Timer Bubble (Only on Dashboard) */}
      {activeView === ViewState.DASHBOARD && (
        <TimerWidget onClick={() => setActiveView(ViewState.TOOLS)} />
      )}

    </div>
  );
};

export default App;
