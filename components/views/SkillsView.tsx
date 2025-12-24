import React, { useState, useMemo, useEffect } from 'react';
import { GraduationCap, Plus, Calendar } from 'lucide-react';
import { Skill, Prompt, PromptCategory } from '../../types';
import { useSkillsStore } from '../../stores/skillsStore';
import { usePromptsStore } from '../../stores/promptsStore';
import { useConfigStore } from '../../stores/configStore';
import { SkillCard } from '../skills/SkillCard';
import { SkillDetailView } from '../skills/SkillDetailView';
import { CreateSkillModal } from '../skills/CreateSkillModal';
import { DailyPlanModal } from '../skills/DailyPlanModal';
import { INITIAL_SKILLS } from '../skills/mockData';
import { ModuleOffensiveBar } from '../shared/ModuleOffensiveBar';
import { calculateSkillProgress } from '../../utils/dailyOffensiveUtils';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';
import { WeeklyAgenda } from '../skills/agenda';

const SkillsView: React.FC = () => {
  // Zustand stores
  const {
    skills,
    addSkill,
    updateSkill: storeUpdateSkill,
    deleteSkill: storeDeleteSkill,
    addLog,
    setDistributionType,
    isLoading: skillsLoading,
    hasInitialized,
    markInitialized
  } = useSkillsStore();
  const { prompts, categories: promptCategories } = usePromptsStore();
  const offensiveConfig = useConfigStore(s => s.config.offensiveGoals) || DEFAULT_OFFENSIVE_GOALS;

  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dailyPlanSkill, setDailyPlanSkill] = useState<Skill | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'agenda'>('skills');
  const initializationRef = React.useRef(false);

  // Initialize with default skills if empty AND not yet initialized
  useEffect(() => {
    // Extra safety: Check localStorage to see if we ever initialized on this device
    const localInit = localStorage.getItem('p67_skills_initialized');

    // Determine if we should initialize:
    // 1. Not loading
    // 2. No skills exist
    // 3. Has NOT been initialized before (persisted flag)
    // 4. Has NOT been initialized in this session (ref)
    // 5. LOCAL STORAGE check (prevent re-spawn bug)
    if (!skillsLoading && skills.length === 0 && !hasInitialized && !initializationRef.current && !localInit) {
      initializationRef.current = true;
      markInitialized();
      localStorage.setItem('p67_skills_initialized', 'true');

      // Generate unique IDs at runtime to prevent duplicate keys
      const skillsWithUniqueIds = INITIAL_SKILLS.map((skill, index) => ({
        ...skill,
        id: `skill_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
      }));
      skillsWithUniqueIds.forEach(skill => addSkill(skill));
    } else if (!hasInitialized && (skills.length > 0 || localInit)) {
      // If we have skills OR local flag, but store says not initialized, fix the store
      markInitialized();
      if (!localInit) localStorage.setItem('p67_skills_initialized', 'true');
    }
  }, [skillsLoading, skills.length, hasInitialized, markInitialized, addSkill]);

  // Derived State
  const activeSkill = useMemo(() => skills.find(s => s.id === activeSkillId), [skills, activeSkillId]);

  const { activeSkills, completedSkills } = useMemo(() => ({
    activeSkills: skills.filter(s => !s.isCompleted),
    completedSkills: skills.filter(s => s.isCompleted)
  }), [skills]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Cálculo de progresso de ofensiva para Skills
  const skillsProgress = useMemo(() =>
    calculateSkillProgress(skills, offensiveConfig.focusSkills),
    [skills, offensiveConfig.focusSkills]
  );
  const skillsOffensive = skillsProgress >= offensiveConfig.minimumPercentage;
  const showSkillsOffensiveBar = offensiveConfig.enabledModules?.skills ?? true;

  // Handlers
  const handleCreateSkill = (newSkill: Skill) => {
    addSkill(newSkill);
    setIsCreateModalOpen(false);
  };

  const handleUpdateSkill = (id: string, updates: Partial<Skill>) => {
    storeUpdateSkill(id, updates);
  };

  const handleDeleteSkill = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta habilidade? Todo o progresso será perdido.')) {
      storeDeleteSkill(id);
      setActiveSkillId(null);
    }
  };

  const handleToggleDistribution = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      const newType = skill.distributionType === 'EXPONENTIAL' ? 'LINEAR' : 'EXPONENTIAL';
      setDistributionType(skillId, newType);
    }
  };

  const handleViewDailyPlan = (skill: Skill) => {
    setDailyPlanSkill(skill);
  };


  // --- RENDER ---

  if (activeSkill) {
    return (
      <SkillDetailView
        skill={activeSkill}
        prompts={prompts}
        promptCategories={promptCategories}
        onBack={() => setActiveSkillId(null)}
        onUpdate={(updates) => handleUpdateSkill(activeSkill.id, updates)}
        onDelete={() => handleDeleteSkill(activeSkill.id)}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-emerald-400" /> Habilidades
          </h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie seu aprendizado e desenvolvimento.</p>
        </div>
        {activeTab === 'skills' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 font-medium transition-all hover:scale-105"
          >
            <Plus size={18} /> Nova Habilidade
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-3">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'skills'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
        >
          <GraduationCap size={18} />
          Skill Tree
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'agenda'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
        >
          <Calendar size={18} />
          Agenda Semanal
        </button>
      </div>

      {/* Barra de Ofensiva de Skills */}
      {showSkillsOffensiveBar && activeTab === 'skills' && (
        <div className="mb-6">
          <ModuleOffensiveBar
            progress={skillsProgress}
            isOffensive={skillsOffensive}
            label="Ofensiva de Skills"
            accentColor="emerald"
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'agenda' ? (
        <WeeklyAgenda />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onClick={() => setActiveSkillId(skill.id)}
                onAddSession={(mins) => addLog(skill.id, { id: Date.now().toString(), date: new Date().toISOString(), minutes: mins })}
                onToggleDistribution={handleToggleDistribution}
                onViewDailyPlan={handleViewDailyPlan}
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

          {/* History Section */}
          {completedSkills.length > 0 && (
            <div className="mt-12 border-t border-slate-800 pt-8">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors mb-6 group w-full"
              >
                <div className={`p-2 rounded-lg bg-yellow-500/10 text-yellow-500 transition-transform duration-300 ${isHistoryOpen ? 'rotate-0' : '-rotate-90'}`}>
                  <GraduationCap size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Habilidades Dominadas
                    <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      {completedSkills.length}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 group-hover:text-slate-400">
                    {isHistoryOpen ? 'Clique para ocultar o histórico' : 'Clique para ver suas conquistas'}
                  </p>
                </div>
              </button>

              {isHistoryOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                  {completedSkills.map(skill => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onClick={() => setActiveSkillId(skill.id)}
                      onAddSession={(mins) => addLog(skill.id, { id: Date.now().toString(), date: new Date().toISOString(), minutes: mins })}
                      onToggleDistribution={handleToggleDistribution}
                      onViewDailyPlan={handleViewDailyPlan}
                      isCompact
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals need to be outside the tab conditional for skills tab access */}
      {isCreateModalOpen && (
        <CreateSkillModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateSkill} />
      )}

      {/* Daily Plan Modal */}
      {dailyPlanSkill && (
        <DailyPlanModal
          skill={dailyPlanSkill}
          onClose={() => setDailyPlanSkill(null)}
        />
      )}
    </div>
  );
};

export default SkillsView;
