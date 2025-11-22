import React, { useState, useMemo } from 'react';
import {
  GraduationCap, Clock, Plus,
  Link as LinkIcon, Trash2, Bot, Sparkles, X, CheckCircle2, Circle,
  Youtube, FileText, Play, ArrowLeft, Layers, Download
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Skill, SkillResource, SkillRoadmapItem } from '../types';
import { useStorage } from '../../hooks/useStorage';

// --- MOCK DATA ---
const INITIAL_SKILLS: Skill[] = [
  {
    id: '1',
    name: 'Inglês Avançado',
    description: 'Fluência total para negócios e viagens.',
    level: 'Intermediário',
    currentMinutes: 3600, // 60h
    goalMinutes: 6000, // 100h
    colorTheme: 'emerald',
    resources: [
      { id: 'r1', title: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', type: 'OTHER' },
    ],
    roadmap: [
      { id: 'rm0', title: 'Fundamentos', isCompleted: false, type: 'SECTION' },
      { id: 'rm1', title: 'Dominar Phrasal Verbs', isCompleted: true, type: 'TASK' },
      { id: 'rm2', title: 'Praticar conversação (Shadowing)', isCompleted: false, type: 'TASK' },
    ],
    logs: [],
    createdAt: Date.now()
  }
];

const THEMES = {
  emerald: 'text-emerald-400 bg-emerald-500',
  blue: 'text-blue-400 bg-blue-500',
  purple: 'text-purple-400 bg-purple-500',
  amber: 'text-amber-400 bg-amber-500',
  rose: 'text-rose-400 bg-rose-500',
};

// --- COMPONENTS ---

const SkillsView: React.FC = () => {
  // Main State with Hook
  const [skills, setSkills] = useStorage<Skill[]>('p67_skills', INITIAL_SKILLS);

  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived State
  const activeSkill = useMemo(() => skills.find(s => s.id === activeSkillId), [skills, activeSkillId]);

  // Handlers
  const handleCreateSkill = (newSkill: Skill) => {
    setSkills([...skills, newSkill]);
    setIsCreateModalOpen(false);
  };

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSkill = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta habilidade? Todo o progresso será perdido.')) {
      setSkills(prev => prev.filter(s => s.id !== id));
      setActiveSkillId(null);
    }
  };

  // --- RENDER ---

  if (activeSkill) {
    return (
      <SkillDetailView
        skill={activeSkill}
        onBack={() => setActiveSkillId(null)}
        onUpdate={(updates) => updateSkill(activeSkill.id, updates)}
        onDelete={() => deleteSkill(activeSkill.id)}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-emerald-400" /> Skill Tree
          </h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie seu aprendizado e desenvolvimento.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 font-medium transition-all hover:scale-105"
        >
          <Plus size={18} /> Nova Habilidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onClick={() => setActiveSkillId(skill.id)}
            onAddSession={(mins) => {
              const newLogs = [...skill.logs, { id: Date.now().toString(), date: new Date().toISOString(), minutes: mins }];
              updateSkill(skill.id, { currentMinutes: skill.currentMinutes + mins, logs: newLogs });
            }}
          />
        ))}

        {skills.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <GraduationCap size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-500">Você ainda não está rastreando nenhuma habilidade.</p>
            <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-emerald-400 hover:underline">Começar agora</button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateSkillModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateSkill} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SkillCard: React.FC<{ skill: Skill; onClick: () => void; onAddSession: (m: number) => void }> = ({ skill, onClick, onAddSession }) => {
  const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
  const themeColor = THEMES[skill.colorTheme as keyof typeof THEMES] || THEMES.emerald;
  const textColor = themeColor.split(' ')[0];
  const barColor = themeColor.split(' ')[1];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mins = prompt("Quantos minutos você estudou?", "30");
    if (mins && !isNaN(Number(mins))) {
      onAddSession(Number(mins));
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden"
    >
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 h-1 w-full bg-slate-900">
        <div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${textColor}`}>{skill.level}</div>
          <h3 className="text-xl font-bold text-white mb-1">{skill.name}</h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
          {percentage}%
        </div>
      </div>

      <div className="flex items-end justify-between mt-6">
        <div className="text-sm text-slate-500">
          <span className="text-white font-mono text-lg">{(skill.currentMinutes / 60).toFixed(1)}</span>
          <span className="text-xs"> / {(skill.goalMinutes / 60).toFixed(0)}h</span>
        </div>

        <button
          onClick={handleQuickAdd}
          className="p-2 bg-slate-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg active:scale-95 flex items-center gap-1 text-xs font-medium"
        >
          <Play size={14} fill="currentColor" /> +Sessão
        </button>
      </div>
    </div>
  );
};

const SkillDetailView: React.FC<{
  skill: Skill;
  onBack: () => void;
  onUpdate: (u: Partial<Skill>) => void;
  onDelete: () => void;
}> = ({ skill, onBack, onUpdate, onDelete }) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [newResourceUrl, setNewResourceUrl] = useState('');

  const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
  const remainingHours = Math.max(0, (skill.goalMinutes - skill.currentMinutes) / 60);

  // Roadmap Stats
  const roadmapTasks = skill.roadmap.filter(i => i.type !== 'SECTION');
  const completedTasks = roadmapTasks.filter(i => i.isCompleted).length;
  const totalTasks = roadmapTasks.length;
  const roadmapProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Resource Handling
  const addResource = () => {
    if (!newResourceUrl) return;
    const newResource: SkillResource = {
      id: Date.now().toString(),
      title: newResourceUrl.replace(/^https?:\/\//, '').split('/')[0], // Simple domain extraction
      url: newResourceUrl,
      type: newResourceUrl.includes('youtube') ? 'VIDEO' : 'OTHER'
    };
    onUpdate({ resources: [...skill.resources, newResource] });
    setNewResourceUrl('');
  };

  const removeResource = (rId: string) => {
    onUpdate({ resources: skill.resources.filter(r => r.id !== rId) });
  };

  // Roadmap Handling
  const toggleRoadmapItem = (itemId: string) => {
    onUpdate({
      roadmap: skill.roadmap.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i)
    });
  };

  const handleAIRoadmap = (items: string[]) => {
    const newItems: SkillRoadmapItem[] = items.map((t, i) => ({
      id: Date.now().toString() + i,
      title: t,
      isCompleted: false,
      type: 'TASK'
    }));
    onUpdate({ roadmap: [...skill.roadmap, ...newItems] });
    setIsAIModalOpen(false);
  };

  const addSectionDivider = () => {
    const name = prompt("Nome da categoria/nível:", "Nível X");
    if (!name) return;
    const newSection: SkillRoadmapItem = {
      id: Date.now().toString(),
      title: name,
      isCompleted: false,
      type: 'SECTION'
    };
    onUpdate({ roadmap: [...skill.roadmap, newSection] });
  };

  const exportRoadmapToTxt = () => {
    const content = `ROADMAP: ${skill.name}
Nível: ${skill.level}
Progresso: ${roadmapProgress}% (${completedTasks}/${totalTasks})
Gerado em: ${new Date().toLocaleDateString()}

=============================================

${skill.roadmap.map(item => {
      if (item.type === 'SECTION') return `\n--- ${item.title.toUpperCase()} ---`;
      return `[${item.isCompleted ? 'X' : ' '}] ${item.title}`;
    }).join('\n')}

=============================================
Projeto 67 Dias`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.name.replace(/\s+/g, '_')}_Roadmap.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white">{skill.name}</h2>
          <p className="text-slate-400 flex items-center gap-2 text-sm">
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{skill.level}</span>
            • Criado em {new Date(skill.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="ml-auto">
          <button onClick={onDelete} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Stats & Log */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl font-bold text-white font-mono">{(skill.currentMinutes / 60).toFixed(1)}<span className="text-xl text-slate-500">h</span></div>
              <div className="text-sm text-slate-400 mt-1">de {(skill.goalMinutes / 60)}h meta (Tempo)</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-900 p-3 rounded-xl text-center">
                <div className="text-xs text-slate-500 uppercase">Restam</div>
                <div className="text-lg font-bold text-emerald-400">{remainingHours.toFixed(1)}h</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl text-center">
                <div className="text-xs text-slate-500 uppercase">Sessões</div>
                <div className="text-lg font-bold text-blue-400">{skill.logs.length}</div>
              </div>
            </div>

            <button
              onClick={() => {
                const mins = prompt("Adicionar quantos minutos?", "60");
                if (mins) {
                  const m = parseInt(mins);
                  onUpdate({
                    currentMinutes: skill.currentMinutes + m,
                    logs: [...skill.logs, { id: Date.now().toString(), date: new Date().toISOString(), minutes: m }]
                  });
                }
              }}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Clock size={18} /> Registrar Estudo
            </button>
          </div>

          {/* Resources Vault */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <LinkIcon size={18} className="text-blue-400" /> Cofre de Recursos
            </h3>

            <div className="flex gap-2 mb-4">
              <input
                value={newResourceUrl}
                onChange={e => setNewResourceUrl(e.target.value)}
                placeholder="Cole um link aqui..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              />
              <button onClick={addResource} className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {skill.resources.map(res => (
                <div key={res.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-600 group">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    {res.type === 'VIDEO' ? <Youtube size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline truncate block font-medium">
                      {res.title || res.url}
                    </a>
                  </div>
                  <button onClick={() => removeResource(res.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {skill.resources.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum link salvo.</p>}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Roadmap */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot size={18} className="text-purple-400" /> Roadmap Inteligente
            </h3>
            <div className="flex gap-2">
              <button
                onClick={exportRoadmapToTxt}
                className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                title="Exportar TXT"
              >
                <Download size={12} /> Exportar
              </button>
              <button
                onClick={addSectionDivider}
                className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                title="Adicionar Separador"
              >
                <Layers size={12} /> Divisória
              </button>
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 flex items-center gap-1 transition-colors"
              >
                <Sparkles size={12} /> Gerar com IA
              </button>
            </div>
          </div>

          {/* Roadmap Progress Bar */}
          <div className="mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase text-slate-500 tracking-wider">
              <span>Progresso de Tarefas</span>
              <span>{completedTasks} / {totalTasks}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${roadmapProgress}%` }}
              />
            </div>
            <div className="text-right mt-1 text-xs text-purple-400 font-mono">{roadmapProgress}% Completo</div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
            {skill.roadmap.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[200px]">
                <Sparkles size={48} className="mb-4" />
                <p>Gere um plano de estudos com IA para começar.</p>
              </div>
            )}

            {skill.roadmap.map(item => {
              if (item.type === 'SECTION') {
                return (
                  <div key={item.id} className="flex items-center gap-4 py-4 group">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.title}</span>
                    <div className="h-px bg-slate-700 flex-1 relative">
                      <button
                        onClick={() => onUpdate({ roadmap: skill.roadmap.filter(r => r.id !== item.id) })}
                        className="absolute right-0 -top-2.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 bg-slate-800 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${item.isCompleted ? 'bg-slate-900/30 border-slate-800 opacity-50' : 'bg-slate-900/80 border-slate-700 hover:border-emerald-500/30'}`}
                >
                  <button
                    onClick={() => toggleRoadmapItem(item.id)}
                    className={`mt-0.5 transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-400'}`}
                  >
                    {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {item.title}
                    </p>
                  </div>
                  <button onClick={() => onUpdate({ roadmap: skill.roadmap.filter(r => r.id !== item.id) })} className="text-slate-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isAIModalOpen && (
        <AIRoadmapModal
          skillName={skill.name}
          level={skill.level}
          onClose={() => setIsAIModalOpen(false)}
          onGenerate={handleAIRoadmap}
        />
      )}
    </div>
  );
};

// --- CREATE MODAL ---

const CreateSkillModal: React.FC<{ onClose: () => void; onCreate: (s: Skill) => void }> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Skill['level']>('Iniciante');
  const [goalHours, setGoalHours] = useState(20);
  const [theme, setTheme] = useState('emerald');

  const handleSubmit = () => {
    if (!name) return;
    const newSkill: Skill = {
      id: Date.now().toString(),
      name,
      level,
      currentMinutes: 0,
      goalMinutes: goalHours * 60,
      resources: [],
      roadmap: [],
      logs: [],
      colorTheme: theme,
      createdAt: Date.now()
    };
    onCreate(newSkill);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-white">Nova Habilidade</h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">O que você vai aprender?</label>
            <input
              value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
              placeholder="Ex: Python, Design, Guitarra..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nível Atual</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
              >
                <option>Iniciante</option>
                <option>Intermediário</option>
                <option>Avançado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Meta (Horas)</label>
              <input
                type="number"
                value={goalHours} onChange={e => setGoalHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Cor do Tema</label>
            <div className="flex gap-3">
              {['emerald', 'blue', 'purple', 'amber', 'rose'].map(c => (
                <button
                  key={c}
                  onClick={() => setTheme(c)}
                  className={`w-8 h-8 rounded-full border-2 ${theme === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: `var(--color-${c}-500)` }}
                >
                  <div className={`w-full h-full rounded-full ${c === 'emerald' ? 'bg-emerald-500' :
                      c === 'blue' ? 'bg-blue-500' :
                        c === 'purple' ? 'bg-purple-500' :
                          c === 'amber' ? 'bg-amber-500' :
                            'bg-rose-500'
                    }`}></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
            <Plus size={18} /> Criar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AI MODAL ---

const AIRoadmapModal: React.FC<{
  skillName: string;
  level: string;
  onClose: () => void;
  onGenerate: (items: string[]) => void;
}> = ({ skillName, level, onClose, onGenerate }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<string[] | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    const prompt = input || `Create a study roadmap for learning ${skillName} at ${level} level.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `User goal: ${prompt}.
                
                Output Requirement:
                Return ONLY a JSON object with a property "roadmap" which is an array of strings (task titles).
                Keep items actionable and concise.
                Language: Portuguese.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadmap: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setGeneratedItems(data.roadmap);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-900/50 to-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Gerador de Roadmap</h3>
              <p className="text-xs text-emerald-400">Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {!generatedItems && (
            <>
              <div className="text-center text-slate-500 py-6">
                <Sparkles size={48} className="mx-auto mb-4 text-emerald-500/50" />
                <p className="text-sm">Defina o foco ou deixe a IA sugerir o caminho ideal para {skillName}.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Instruções extras (Opcional)</label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ex: Focar em conversação, ou focar em gramática..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none h-24 resize-none"
                />
              </div>
            </>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
            </div>
          )}

          {generatedItems && (
            <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
              <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Sugestão ({generatedItems.length} itens)</div>
              <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                {generatedItems.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800/50 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
          {!generatedItems ? (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Sparkles size={18} /> Gerar Roadmap
            </button>
          ) : (
            <>
              <button onClick={() => setGeneratedItems(null)} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">Tentar de novo</button>
              <button onClick={() => onGenerate(generatedItems)} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg">
                Aplicar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsView;
