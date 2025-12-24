import React, { useMemo, useCallback } from 'react';
import { useConfigStore, useSkillsStore } from '../../stores';
import { Weight, Crosshair, Gamepad2, BookOpen, GraduationCap, Flame, ToggleLeft, Check, Plus } from 'lucide-react';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';
import { FocusSkill, OffensiveGoalsConfig } from '../../types';
import { FocusSkillsCarousel } from './FocusSkillsCarousel';

export const OffensiveSettingsSection: React.FC = () => {
    const { config, setConfig } = useConfigStore();
    const { skills } = useSkillsStore();
    const offensiveConfig = config.offensiveGoals || DEFAULT_OFFENSIVE_GOALS;

    // Helper function to update config immediately (auto-save)
    const updateConfig = (updates: Partial<OffensiveGoalsConfig>) => {
        setConfig({
            offensiveGoals: {
                ...offensiveConfig,
                ...updates
            }
        });
    };

    // Toggle a focus skill on/off
    const toggleFocusSkill = useCallback((skillId: string) => {
        const currentFocusSkills = offensiveConfig.focusSkills || [];
        const exists = currentFocusSkills.find(s => s.skillId === skillId);

        if (exists) {
            updateConfig({
                focusSkills: currentFocusSkills.filter(s => s.skillId !== skillId)
            });
        } else {
            // Add with remaining weight or default
            const remaining = 100 - currentFocusSkills.reduce((acc, s) => acc + s.weight, 0);
            const newWeight = Math.max(0, remaining);
            updateConfig({
                focusSkills: [...currentFocusSkills, { skillId, weight: newWeight }]
            });
        }
    }, [offensiveConfig.focusSkills, updateConfig]);

    // Update individual focus skill weight
    const updateFocusWeight = useCallback((skillId: string, weight: number) => {
        const currentFocusSkills = offensiveConfig.focusSkills || [];
        updateConfig({
            focusSkills: currentFocusSkills.map(s =>
                s.skillId === skillId ? { ...s, weight } : s
            )
        });
    }, [offensiveConfig.focusSkills, updateConfig]);

    // Update category weight, keeping the sum at 100%
    const updateCategoryWeight = (category: 'skills' | 'reading' | 'games', newValue: number) => {
        const currentWeights = offensiveConfig.categoryWeights;
        const clampedValue = Math.min(100, Math.max(0, newValue));
        const remaining = 100 - clampedValue;

        const otherKeys = (['skills', 'reading', 'games'] as const).filter(k => k !== category);
        const otherSum = currentWeights[otherKeys[0]] + currentWeights[otherKeys[1]];

        let newWeights = { ...currentWeights, [category]: clampedValue };

        if (remaining === 0) {
            newWeights[otherKeys[0]] = 0;
            newWeights[otherKeys[1]] = 0;
        } else if (otherSum === 0) {
            newWeights[otherKeys[0]] = Math.round(remaining / 2);
            newWeights[otherKeys[1]] = remaining - Math.round(remaining / 2);
        } else {
            const ratio0 = currentWeights[otherKeys[0]] / otherSum;
            const ratio1 = currentWeights[otherKeys[1]] / otherSum;
            newWeights[otherKeys[0]] = Math.round(remaining * ratio0);
            newWeights[otherKeys[1]] = remaining - newWeights[otherKeys[0]];
        }

        updateConfig({ categoryWeights: newWeights });
    };

    // Toggle enabled module
    const toggleModule = (module: 'skills' | 'reading' | 'games') => {
        const currentModules = offensiveConfig.enabledModules ?? { skills: true, reading: true, games: true };
        updateConfig({
            enabledModules: {
                ...currentModules,
                [module]: !currentModules[module]
            }
        });
    };

    // Use skills directly (no useMemo needed for identity return)
    const activeSkillsList = skills;

    // Computed values
    const weights = offensiveConfig.categoryWeights;
    const enabledModules = offensiveConfig.enabledModules ?? { skills: true, reading: true, games: true };
    const focusSkills = offensiveConfig.focusSkills || [];
    const minPercentage = offensiveConfig.minimumPercentage;
    const gameGoal = offensiveConfig.dailyGameHoursGoal;

    const totalWeight = weights.skills + weights.reading + weights.games;
    const isWeightValid = totalWeight === 100;

    const totalFocusWeight = focusSkills.reduce((acc, s) => acc + s.weight, 0);
    const isFocusWeightValid = focusSkills.length === 0 || totalFocusWeight === 100;

    // Memoized available skills (eliminates duplicate O(n×m) filter in JSX)
    const availableSkills = useMemo(() =>
        activeSkillsList.filter(skill => !focusSkills.some(f => f.skillId === skill.id)),
        [activeSkillsList, focusSkills]
    );

    return (
        <div className="divide-y divide-slate-700">
            {/* Auto-save indicator */}
            <div className="p-4 bg-slate-800/50 flex items-center justify-end">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <Check size={14} />
                    <span>Alterações salvas automaticamente</span>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* 1. Porcentagem Mínima */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Flame size={16} className="text-orange-400" /> Meta Mínima de Ofensiva
                        </label>
                        <span className="text-orange-400 font-mono font-bold">{minPercentage}%</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={minPercentage}
                        onChange={(e) => updateConfig({ minimumPercentage: Number(e.target.value) })}
                        className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                        Você precisa atingir essa porcentagem média para ativar a ofensiva do dia.
                    </p>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 2. Módulos Ativos */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <ToggleLeft size={16} className="text-cyan-400" /> Módulos Ativos
                    </label>
                    <p className="text-xs text-slate-500">
                        Desative módulos que você não está utilizando. Eles serão excluídos do cálculo de ofensiva.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Skills Toggle */}
                        <button
                            type="button"
                            onClick={() => toggleModule('skills')}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${enabledModules.skills
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 opacity-60'
                                }`}
                        >
                            <GraduationCap size={20} />
                            <div className="flex-1 text-left">
                                <div className="font-semibold">Skills</div>
                                <div className="text-xs opacity-70">{enabledModules.skills ? 'Ativo' : 'Inativo'}</div>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${enabledModules.skills ? 'bg-emerald-500' : 'bg-slate-600'} relative`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabledModules.skills ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                        </button>

                        {/* Reading Toggle */}
                        <button
                            type="button"
                            onClick={() => toggleModule('reading')}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${enabledModules.reading
                                ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 opacity-60'
                                }`}
                        >
                            <BookOpen size={20} />
                            <div className="flex-1 text-left">
                                <div className="font-semibold">Leitura</div>
                                <div className="text-xs opacity-70">{enabledModules.reading ? 'Ativo' : 'Inativo'}</div>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${enabledModules.reading ? 'bg-yellow-500' : 'bg-slate-600'} relative`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabledModules.reading ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                        </button>

                        {/* Games Toggle */}
                        <button
                            type="button"
                            onClick={() => toggleModule('games')}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${enabledModules.games
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 opacity-60'
                                }`}
                        >
                            <Gamepad2 size={20} />
                            <div className="flex-1 text-left">
                                <div className="font-semibold">Jogos</div>
                                <div className="text-xs opacity-70">{enabledModules.games ? 'Ativo' : 'Inativo'}</div>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${enabledModules.games ? 'bg-purple-500' : 'bg-slate-600'} relative`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabledModules.games ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 3. Pesos por Categoria */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Weight size={16} className="text-blue-400" /> Pesos por Categoria
                        </label>
                        <div className={`text-xs font-bold px-2 py-1 rounded ${isWeightValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            Total: {totalWeight}%
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Skills Weight */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-400"><GraduationCap size={12} /> Skills</span>
                                <span className="font-mono">{weights.skills}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100" value={weights.skills}
                                onChange={(e) => updateCategoryWeight('skills', Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Reading Weight */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1 text-yellow-400"><BookOpen size={12} /> Leitura</span>
                                <span className="font-mono">{weights.reading}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100" value={weights.reading}
                                onChange={(e) => updateCategoryWeight('reading', Number(e.target.value))}
                                className="w-full accent-yellow-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Games Weight */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="flex items-center gap-1 text-purple-400"><Gamepad2 size={12} /> Jogos</span>
                                <span className="font-mono">{weights.games}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100" value={weights.games}
                                onChange={(e) => updateCategoryWeight('games', Number(e.target.value))}
                                className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="h-4 w-full rounded-full overflow-hidden flex text-[10px] font-bold text-black/50 leading-4 text-center mt-2">
                        {weights.skills > 0 && (
                            <div style={{ width: `${weights.skills}%` }} className="bg-emerald-500 transition-all">Skills</div>
                        )}
                        {weights.reading > 0 && (
                            <div style={{ width: `${weights.reading}%` }} className="bg-yellow-500 transition-all">Leitura</div>
                        )}
                        {weights.games > 0 && (
                            <div style={{ width: `${weights.games}%` }} className="bg-purple-500 transition-all">Jogos</div>
                        )}
                    </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 4. Meta de Jogos */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Gamepad2 size={16} className="text-purple-400" /> Meta Diária de Jogos
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={gameGoal}
                            onChange={(e) => updateConfig({ dailyGameHoursGoal: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-24 text-white font-mono focus:border-purple-500 outline-none"
                        />
                        <span className="text-sm text-slate-400">horas por dia para atingir 100%</span>
                    </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 5. Skills em Foco */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Crosshair size={16} className="text-cyan-400" /> Skills em Foco
                        </label>
                        <div className={`text-xs font-bold px-2 py-1 rounded ${isFocusWeightValid ? 'bg-slate-700 text-slate-300' : 'bg-red-500/10 text-red-400'}`}>
                            {focusSkills.length > 0 ? `Soma Pesos: ${totalFocusWeight}%` : 'Toda skill conta igual'}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-2">
                        Selecione quais skills farão parte da sua ofensiva. Se nenhuma for selecionada, todas contam igualmente.
                    </p>

                    {activeSkillsList.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma skill criada ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Carousel for selected skills */}
                            {focusSkills.length > 0 && (
                                <FocusSkillsCarousel
                                    skills={activeSkillsList}
                                    focusSkills={focusSkills}
                                    onToggleFocusSkill={toggleFocusSkill}
                                    onUpdateWeight={updateFocusWeight}
                                    totalFocusWeight={totalFocusWeight}
                                />
                            )}

                            {/* Add Skills Section */}
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                                    <Plus size={16} />
                                    <span>Adicionar skill ao foco ({availableSkills.length} disponíveis)</span>
                                </summary>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableSkills.map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => toggleFocusSkill(skill.id)}
                                            className="p-3 rounded-xl border border-slate-700 bg-slate-900/30 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
                                        >
                                            <span className="text-sm font-medium text-slate-300">{skill.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
