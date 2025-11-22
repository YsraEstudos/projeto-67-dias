
import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Archive, Plus, Bell, Tag, Trash2, RotateCcw, Search, X, Save,
  LayoutList, CheckCircle2, Clock, Sparkles, Bot, Calendar, ChevronLeft, ChevronRight,
  Target, ListChecks, Minus
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { OrganizeTask, Habit, SubHabit } from '../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// --- MOCK DATA FOR FIRST LOAD ---
const INITIAL_TASKS: OrganizeTask[] = [
  {
    id: '1',
    title: 'Organizar armário do quarto',
    isCompleted: false,
    isArchived: false,
    category: 'Casa',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    createdAt: Date.now()
  },
  {
    id: '2',
    title: 'Pagar conta de luz',
    isCompleted: true,
    isArchived: true,
    category: 'Finanças',
    createdAt: Date.now() - 100000
  }
];

const INITIAL_HABITS: Habit[] = [
    {
        id: 'h1',
        title: 'Treino Matinal',
        category: 'Saúde',
        subHabits: [
            { id: 's1', title: 'Alongamento (5 min)' },
            { id: 's2', title: '30 Flexões' },
            { id: 's3', title: 'Beber 500ml Água' }
        ],
        history: {},
        createdAt: Date.now(),
        archived: false
    }
];

// --- HELPER FUNCTIONS ---

const getCategoryColor = (category: string) => {
  const colors = [
    'bg-red-500/10 text-red-400 border-red-500/20',
    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'bg-green-500/10 text-green-400 border-green-500/20',
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  ];
  
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(adjustedDate);
};

// --- COMPONENTS ---

const HabitsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS'>('TASKS');
  
  // Data State
  const [tasks, setTasks] = useLocalStorage<OrganizeTask[]>('p67_tasks', INITIAL_TASKS);
  const [habits, setHabits] = useLocalStorage<Habit[]>('p67_habits', INITIAL_HABITS);
  
  // View State
  const [showArchived, setShowArchived] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Habits View Specific State
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  const [editingTask, setEditingTask] = useState<OrganizeTask | null>(null);

  // --- COMPUTED ---
  
  const categories = useMemo(() => {
    const cats = new Set([...tasks.map(t => t.category), ...habits.map(h => h.category)]);
    return Array.from(cats).sort();
  }, [tasks, habits]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (showArchived) return t.isArchived;
        return !t.isArchived;
      })
      .filter(t => {
        if (filterCategory) return t.category === filterCategory;
        return true;
      })
      .filter(t => {
        if (!searchQuery) return true;
        return t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               t.category.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return b.createdAt - a.createdAt;
      });
  }, [tasks, showArchived, filterCategory, searchQuery]);

  // --- HANDLERS (TASKS) ---

  const handleSaveTask = (taskData: Partial<OrganizeTask>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as OrganizeTask : t));
    } else {
      const newTask: OrganizeTask = {
        id: Date.now().toString(),
        title: taskData.title || 'Nova Tarefa',
        category: taskData.category || 'Geral',
        isCompleted: false,
        isArchived: false,
        createdAt: Date.now(),
        dueDate: taskData.dueDate,
        reminderDate: taskData.reminderDate,
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleAIGeneratedTasks = (newTasks: {title: string, category: string, daysFromNow?: number}[]) => {
    const createdTasks: OrganizeTask[] = newTasks.map((t, idx) => {
        const dueDate = t.daysFromNow ? new Date(new Date().setDate(new Date().getDate() + t.daysFromNow)).toISOString().split('T')[0] : undefined;
        return {
            id: (Date.now() + idx).toString(),
            title: t.title,
            category: t.category,
            isCompleted: false,
            isArchived: false,
            createdAt: Date.now(),
            dueDate: dueDate
        };
    });
    setTasks(prev => [...prev, ...createdTasks]);
    setIsAIModalOpen(false);
  };

  const toggleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newStatus = !t.isCompleted;
      return { 
        ...t, 
        isCompleted: newStatus, 
        isArchived: newStatus // Auto archive on complete
      };
    }));
  };

  const restoreTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: false, isArchived: false } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- HANDLERS (HABITS) ---

  const handleSaveHabit = (habit: Habit) => {
      setHabits(prev => [...prev, habit]);
      setIsHabitModalOpen(false);
  };

  const deleteHabit = (id: string) => {
      if (confirm('Remover este hábito? Todo o histórico será perdido.')) {
          setHabits(prev => prev.filter(h => h.id !== id));
      }
  };

  const toggleHabitCompletion = (habitId: string, subHabitId?: string) => {
      const dateKey = selectedDate.toISOString().split('T')[0];
      
      setHabits(prev => prev.map(habit => {
          if (habit.id !== habitId) return habit;

          const currentLog = habit.history[dateKey] || { completed: false, subHabitsCompleted: [] };
          let newLog = { ...currentLog };

          if (subHabitId) {
              // Toggle Sub-habit
              if (newLog.subHabitsCompleted.includes(subHabitId)) {
                  newLog.subHabitsCompleted = newLog.subHabitsCompleted.filter(id => id !== subHabitId);
              } else {
                  newLog.subHabitsCompleted = [...newLog.subHabitsCompleted, subHabitId];
              }
              
              // Check if ALL sub-habits are done to complete main habit
              const allSubDone = habit.subHabits.every(sh => newLog.subHabitsCompleted.includes(sh.id));
              newLog.completed = allSubDone;

          } else {
              // Toggle Main Habit (If no sub-habits, simple toggle. If sub-habits exist, auto-fill/unfill all)
              if (habit.subHabits.length === 0) {
                  newLog.completed = !newLog.completed;
              } else {
                  // If marking parent as complete, mark all children complete. If incomplete, clear children.
                  const willBeComplete = !newLog.completed;
                  newLog.completed = willBeComplete;
                  newLog.subHabitsCompleted = willBeComplete ? habit.subHabits.map(sh => sh.id) : [];
              }
          }

          return {
              ...habit,
              history: {
                  ...habit.history,
                  [dateKey]: newLog
              }
          };
      }));
  };

  const changeDay = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      setSelectedDate(newDate);
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto animate-in fade-in duration-500 pb-24 relative">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setActiveTab('TASKS')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutList size={18} /> Tarefas & Arrumar
          </button>
          <button 
            onClick={() => setActiveTab('HABITS')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'HABITS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Target size={18} /> Rotina & Hábitos
          </button>
        </div>

        {activeTab === 'TASKS' ? (
           <button 
             onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm w-full md:w-auto justify-center"
           >
             <Plus size={18} /> Nova Tarefa
           </button>
        ) : (
            <button 
             onClick={() => setIsHabitModalOpen(true)}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm w-full md:w-auto justify-center"
           >
             <Plus size={18} /> Novo Hábito
           </button>
        )}
      </div>

      {/* ====================== TASKS VIEW ====================== */}
      {activeTab === 'TASKS' && (
        <div className="flex flex-col gap-6">
            {/* FILTERS BAR */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar tarefas..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <select 
                        value={filterCategory || ''}
                        onChange={(e) => setFilterCategory(e.target.value || null)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none"
                    >
                        <option value="">Todas Categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 whitespace-nowrap ${showArchived ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'}`}
                    >
                        {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                        {showArchived ? 'Voltar às Ativas' : 'Ver Arquivados'}
                    </button>
                </div>
            </div>

            {/* TASK LIST */}
            <div className="space-y-2">
                {filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <LayoutList size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">{showArchived ? 'Nenhuma tarefa arquivada.' : 'Tudo organizado! Nenhuma tarefa pendente.'}</p>
                    </div>
                )}

                {filteredTasks.map(task => (
                    <div 
                        key={task.id} 
                        className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${task.isCompleted ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 hover:border-indigo-500/30 hover:bg-slate-750 shadow-md'}`}
                    >
                        {/* Checkbox / Restore */}
                        {task.isArchived ? (
                            <button onClick={() => restoreTask(task.id)} className="text-slate-600 hover:text-indigo-400 transition-colors" title="Restaurar">
                                <RotateCcw size={24} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => toggleCompleteTask(task.id)} 
                                className={`transition-colors ${task.isCompleted ? 'text-indigo-500' : 'text-slate-600 hover:text-indigo-400'}`}
                            >
                                {task.isCompleted ? <CheckSquare size={24} /> : <div className="w-6 h-6 rounded border-2 border-current" />}
                            </button>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-base font-medium truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                    {task.title}
                                </span>
                                {task.dueDate && !task.isCompleted && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                        <Clock size={10} />
                                        {formatDate(task.dueDate)}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${getCategoryColor(task.category)}`}>
                                    {task.category.toUpperCase()}
                                </span>
                                
                                {task.reminderDate && (
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1" title={`Lembrete para: ${formatDate(task.reminderDate)}`}>
                                        <Bell size={10} className="text-yellow-500" /> Lembrete
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!task.isArchived && (
                                <button 
                                    onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                                    className="p-2 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                                >
                                    <Tag size={16} />
                                </button>
                            )}
                            <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-2 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* ====================== HABITS VIEW ====================== */}
      {activeTab === 'HABITS' && (
          <div className="flex flex-col gap-6">
              {/* Date Navigator */}
              <div className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                  <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft size={24} />
                  </button>
                  
                  <div className="flex flex-col items-center">
                      <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Registro Diário</div>
                      <div className="flex items-center gap-2 text-xl font-bold text-white">
                          <Calendar size={20} className="text-slate-400" />
                          {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                          {selectedDate.toDateString() === new Date().toDateString() && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Hoje</span>}
                      </div>
                  </div>

                  <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <ChevronRight size={24} />
                  </button>
              </div>

              <div className="space-y-4">
                  {habits.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                          <CheckCircle2 size={48} className="text-slate-700 mb-4" />
                          <p className="text-slate-500 font-medium">Nenhum hábito criado ainda.</p>
                      </div>
                  )}

                  {habits.map(habit => {
                      const dateKey = selectedDate.toISOString().split('T')[0];
                      const log = habit.history[dateKey] || { completed: false, subHabitsCompleted: [] };
                      const hasSubHabits = habit.subHabits.length > 0;
                      const isFullyCompleted = log.completed;

                      return (
                          <div key={habit.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md hover:shadow-lg hover:border-emerald-500/20 transition-all">
                              <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <button 
                                              onClick={() => toggleHabitCompletion(habit.id)}
                                              className={`rounded-full p-1 transition-all ${isFullyCompleted ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-emerald-400 hover:bg-slate-700'}`}
                                          >
                                              {isFullyCompleted ? <CheckCircle2 size={28} /> : <div className="w-7 h-7 rounded-full border-2 border-current" />}
                                          </button>
                                          <div>
                                              <h3 className={`text-lg font-bold leading-tight ${isFullyCompleted ? 'text-emerald-400' : 'text-white'}`}>{habit.title}</h3>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${getCategoryColor(habit.category)}`}>
                                                  {habit.category}
                                              </span>
                                          </div>
                                      </div>

                                      {/* Sub Habits List */}
                                      {hasSubHabits && (
                                          <div className="mt-3 ml-10 space-y-2 border-l-2 border-slate-700 pl-4 py-1">
                                              <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                  <ListChecks size={12} /> Passos para completar:
                                              </div>
                                              {habit.subHabits.map(sub => {
                                                  const isSubDone = log.subHabitsCompleted.includes(sub.id);
                                                  return (
                                                      <div 
                                                          key={sub.id} 
                                                          onClick={() => toggleHabitCompletion(habit.id, sub.id)}
                                                          className={`flex items-center gap-2 cursor-pointer group ${isSubDone ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                                      >
                                                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isSubDone ? 'bg-emerald-600 border-emerald-600' : 'border-slate-500 group-hover:border-emerald-500'}`}>
                                                              {isSubDone && <CheckCircle2 size={12} className="text-white" />}
                                                          </div>
                                                          <span className={`text-sm ${isSubDone ? 'text-emerald-300 line-through' : 'text-slate-300'}`}>{sub.title}</span>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                  </div>
                                  
                                  <button onClick={() => deleteHabit(habit.id)} className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-slate-900 transition-colors self-start">
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* FLOATING AI BUTTON (For Tasks only) */}
      {activeTab === 'TASKS' && (
        <button
            onClick={() => setIsAIModalOpen(true)}
            className="fixed bottom-8 right-8 z-40 group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:scale-110 transition-all duration-300 hover:shadow-indigo-500/50 border border-white/10"
            title="Planejador IA"
        >
            <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
        </button>
      )}

      {/* TASK MODAL */}
      {isModalOpen && (
        <TaskModal 
            task={editingTask} 
            categories={categories}
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveTask} 
        />
      )}
      
      {/* HABIT CREATE MODAL */}
      {isHabitModalOpen && (
          <HabitModal 
             categories={categories}
             onClose={() => setIsHabitModalOpen(false)}
             onSave={handleSaveHabit}
          />
      )}

      {/* AI ASSISTANT MODAL */}
      {isAIModalOpen && (
        <AITaskAssistantModal 
            onClose={() => setIsAIModalOpen(false)}
            onApply={handleAIGeneratedTasks}
        />
      )}

    </div>
  );
};

// --- HABIT MODAL ---
const HabitModal: React.FC<{
    categories: string[];
    onClose: () => void;
    onSave: (habit: Habit) => void;
}> = ({ categories, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Saúde');
    const [subHabits, setSubHabits] = useState<string[]>([]);
    const [currentSub, setCurrentSub] = useState('');

    const addSubHabit = () => {
        if (currentSub.trim()) {
            setSubHabits([...subHabits, currentSub.trim()]);
            setCurrentSub('');
        }
    };

    const removeSubHabit = (index: number) => {
        setSubHabits(subHabits.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!title.trim()) return;
        
        const newHabit: Habit = {
            id: Date.now().toString(),
            title,
            category,
            subHabits: subHabits.map((t, i) => ({ id: `sh_${Date.now()}_${i}`, title: t })),
            history: {},
            createdAt: Date.now(),
            archived: false
        };
        onSave(newHabit);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white">Novo Hábito</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Hábito Principal</label>
                        <input 
                            autoFocus
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                            placeholder="Ex: Treino Diário"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria</label>
                        <input 
                            list="categories-list-habit"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                        />
                        <datalist id="categories-list-habit">
                             {categories.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <ListChecks size={14}/> Sub-hábitos (Opcional)
                        </label>
                        <p className="text-xs text-slate-500 mb-3">Adicione passos necessários para completar este hábito.</p>
                        
                        <div className="flex gap-2 mb-3">
                            <input 
                                value={currentSub}
                                onChange={e => setCurrentSub(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addSubHabit()}
                                placeholder="Ex: 10 Flexões..."
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                            />
                            <button onClick={addSubHabit} className="p-2 bg-slate-700 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {subHabits.map((sub, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700 text-sm">
                                    <span className="text-slate-300">{sub}</span>
                                    <button onClick={() => removeSubHabit(i)} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Hábito
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- AI ASSISTANT COMPONENT ---
const AITaskAssistantModal: React.FC<{
    onClose: () => void;
    onApply: (tasks: any[]) => void;
}> = ({ onClose, onApply }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<any[] | null>(null);
    const [conversation, setConversation] = useState<{role: 'user' | 'ai', text: string}[]>([]);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        // Add user message immediately for UI feedback
        const userMsg = input;
        setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
        setGeneratedTasks(null); 
        setInput('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `User request: "${userMsg}".
                
                Goal: The user wants to plan a project, event, or organize their life. 
                Break this down into a list of concrete, actionable sub-tasks.
                
                Output Requirement:
                Return ONLY a JSON object with a property "tasks" which is an array of objects.
                Each object must have:
                - "title": string (The task description, keep it concise)
                - "category": string (Pick a relevant category like 'Casa', 'Trabalho', 'Estudos', 'Pessoal', 'Finanças')
                - "daysFromNow": number (0 for today, 1 for tomorrow, etc. Estimate a reasonable timeline).
                
                Example JSON:
                {
                  "tasks": [
                    { "title": "Buy paint", "category": "Casa", "daysFromNow": 0 },
                    { "title": "Move furniture", "category": "Casa", "daysFromNow": 1 }
                  ]
                }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        category: { type: Type.STRING },
                                        daysFromNow: { type: Type.NUMBER }
                                    },
                                    required: ["title", "category", "daysFromNow"]
                                }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setGeneratedTasks(data.tasks);
                setConversation(prev => [...prev, { 
                    role: 'ai', 
                    text: `Entendido! Criei um plano com ${data.tasks.length} subtarefas para você.` 
                }]);
            }
        } catch (error) {
            console.error(error);
            setConversation(prev => [...prev, { role: 'ai', text: 'Erro ao processar. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-900/50 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Assistente de Planejamento</h3>
                            <p className="text-xs text-indigo-300">Gemini 2.5 Flash</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {conversation.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <Sparkles size={48} className="mx-auto mb-4 text-indigo-500/50" />
                            <p className="text-sm mb-2">Olá! Eu posso te ajudar a planejar.</p>
                            <p className="text-xs">Ex: "Planejar uma festa de aniversário", "Organizar minha mudança", "Roteiro de estudos de React".</p>
                        </div>
                    )}
                    
                    {conversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}

                    {generatedTasks && (
                        <div className="mt-4 bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
                            <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Pré-visualização ({generatedTasks.length} itens)</div>
                            <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                                {generatedTasks.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800/50 text-xs">
                                        <span className="text-slate-300 truncate flex-1">{t.title}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 ml-2">{t.category}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => onApply(generatedTasks)}
                                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                            >
                                <Plus size={16} /> Adicionar Tarefas
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none placeholder:text-slate-600"
                            placeholder="O que você quer planejar?"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                            autoFocus
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                            className="bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-colors"
                        >
                            <Bot size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskModal: React.FC<{
    task: OrganizeTask | null;
    categories: string[];
    onClose: () => void;
    onSave: (data: any) => void;
}> = ({ task, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        category: task?.category || 'Casa',
        dueDate: task?.dueDate || '',
        reminderDate: task?.reminderDate || '',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">O que precisa ser feito?</label>
                        <input 
                            autoFocus
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none placeholder:text-slate-600"
                            placeholder="Ex: Limpar a garagem"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria</label>
                        <div className="relative">
                            <input 
                                list="categories-list"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                placeholder="Selecione ou digite..."
                            />
                            <datalist id="categories-list">
                                <option value="Casa" />
                                <option value="Trabalho" />
                                <option value="Finanças" />
                                <option value="Estudos" />
                                <option value="Pessoal" />
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Data Limite</label>
                            <input 
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                <Bell size={10} className="text-yellow-500"/> Lembrete
                            </label>
                            <input 
                                type="date"
                                value={formData.reminderDate}
                                onChange={e => setFormData({...formData, reminderDate: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                            {formData.reminderDate && (
                                <p className="text-[10px] text-slate-500 mt-1">Aparecerá no painel neste dia.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HabitsView;
