import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Skill, Prompt, PromptCategory } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { SkillCard } from '../skills/SkillCard';
import { SkillDetailView } from '../skills/SkillDetailView';
import { CreateSkillModal } from '../skills/CreateSkillModal';
import { INITIAL_SKILLS } from '../skills/mockData';

const SkillsView: React.FC = () => {
  // Main State with Hook
  const [skills, setSkills] = useStorage<Skill[]>('p67_skills', INITIAL_SKILLS);
  const [prompts] = useStorage<Prompt[]>('p67_prompts', []);
  const [promptCategories] = useStorage<PromptCategory[]>('p67_prompt_categories', []);

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
        prompts={prompts}
        promptCategories={promptCategories}
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

export default SkillsView;
