import React from 'react';
import { Database, RotateCcw } from 'lucide-react';
import { usePromptsStore } from '../../stores';
import { useSkillsStore } from '../../stores/skillsStore';
import { INITIAL_SKILLS } from '../skills/mockData';

export const DataManagementSection: React.FC = () => {
    // Stores
    const { initializeDefaults: initPrompts } = usePromptsStore();
    const { setSkills, skills } = useSkillsStore();

    const handleRestoreDefaults = () => {
        if (confirm('Isso irá restaurar os dados padrão de Prompts e Skills SE eles estiverem vazios. Continuar?')) {
            initPrompts();

            // Skill logic (simplified from SkillsView)
            if (skills.length === 0) {
                const skillsWithUniqueIds = INITIAL_SKILLS.map((skill, index) => ({
                    ...skill,
                    id: `skill_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
                }));
                setSkills(skillsWithUniqueIds);
            }

            alert('Verificação de dados padrão concluída.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Database size={20} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm">
                        Restaure dados padrão caso Prompts ou Skills estejam faltando.
                    </p>
                </div>
            </div>

            {/* Restore Defaults */}
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between gap-3 max-w-md">
                <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                        <RotateCcw size={16} />
                        Restaurar Padrões
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Recarrega Prompts e Skills iniciais se estiverem faltando.
                    </p>
                </div>
                <button
                    onClick={handleRestoreDefaults}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Verificar Padrões
                </button>
            </div>
        </div>
    );
};
