
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
import { ViewState, DashboardCardProps, OrganizeTask, User, GlobalTimerState, ProjectConfig } from './types';
import { Card } from './components/Card';
import { Loading } from './components/shared/Loading';
import { AuthView } from './components/views/AuthView';
import { useLocalStorage } from './hooks/useLocalStorage';

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
const TimerWidget: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [timerState, setTimerState] = useLocalStorage<GlobalTimerState>('p67_tool_timer', {
    mode: 'TIMER',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0
  });
  const [display, setDisplay] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const update = () => {
        if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') return;
        
        const now = Date.now();
        let ms = 0;
        
        if (timerState.status === 'PAUSED') {
            ms = timerState.accumulated;
        } else if (timerState.status === 'RUNNING') {
            if (timerState.mode === 'TIMER' && timerState.endTime) {
                ms = Math.max(0, timerState.endTime - now);
            } else if (timerState.mode === 'STOPWATCH' && timerState.startTime) {
                ms = now - timerState.startTime + timerState.accumulated;
            }
        }

        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setDisplay(`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
    >
        {expanded && (
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-2 mb-2 w-48">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">{timerState.label || (timerState.mode === 'TIMER' ? 'Temporizador' : 'Cronômetro')}</span>
                    {timerState.status === 'RUNNING' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center my-2">
                    {display}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onClick(); }} 
                    className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
                >
                    Abrir Ferramentas
                </button>
            </div>
        )}
        
        <button className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border transition-all hover:scale-110 ${
            timerState.status === 'RUNNING' 
            ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30' 
            : 'bg-slate-800 border-slate-600 text-slate-400'
        }`}>
            <Timer size={24} className={timerState.status === 'RUNNING' ? 'animate-pulse' : ''} />
            {!expanded && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950"></span>
            )}
        </button>
    </div>
  );
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useLocalStorage<User | null>('p67_session', null);
  
  // --- APP STATE ---
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // --- PROJECT CONFIG (For Day Counter) ---
  const [projectConfig, setProjectConfig] = useLocalStorage<ProjectConfig>('p67_project_config', {
    startDate: new Date().toISOString(),
    userName: user?.name || '',
    isGuest: user?.isGuest || false
  });

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

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // If new user, set start date
    if (!localStorage.getItem('p67_project_config')) {
        setProjectConfig({
            startDate: new Date().toISOString(),
            userName: loggedInUser.name,
            isGuest: loggedInUser.isGuest
        });
    }
  };

  const handleLogout = () => {
    if (confirm("Tem certeza que deseja sair?")) {
      setUser(null);
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
        subtitle: '0/250 itens',
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
  }, [notificationCount]);

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
  
  if (!user) {
    return <AuthView onLogin={handleLogin} />;
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
