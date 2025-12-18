import React, { useState } from 'react';
import { useConfigStore, useSkillsStore } from '../../stores';
import { Target, Weight, Crosshair, Gamepad2, BookOpen, GraduationCap, Flame, AlertCircle } from 'lucide-react';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';
import { FocusSkill } from '../../types';

export const OffensiveSettingsSection: React.FC = () => {
    const { config, setConfig } = useConfigStore();
    const { skills } = useSkillsStore();
    const offensiveConfig = config.offensiveGoals || DEFAULT_OFFENSIVE_GOALS;

    // Estado local para form
    const [minPercentage, setMinPercentage] = useState(offensiveConfig.minimumPercentage);
    const [weights, setWeights] = useState(offensiveConfig.categoryWeights);
    const [gameGoal, setGameGoal] = useState(offensiveConfig.dailyGameHoursGoal);
    const [focusSkills, setFocusSkills] = useState<FocusSkill[]>(offensiveConfig.focusSkills || []);

    // Handlers
    const handleSave = () => {
        // Validação: pesos devem somar 100
        const totalWeight = weights.skills + weights.reading + weights.games;
        if (totalWeight !== 100) {
            alert(`A soma dos pesos das categorias deve ser 100%. Atual: ${totalWeight}%`);
            return;
        }

        // Validação: pesos das focus skills devem somar 100 se houver alguma selecionada
        if (focusSkills.length > 0) {
            const totalSkillWeight = focusSkills.reduce((acc, s) => acc + s.weight, 0);
            if (totalSkillWeight !== 100) {
                alert(`A soma dos pesos das Skills em Foco deve ser 100%. Atual: ${totalSkillWeight}%`);
                return;
            }
        }

        setConfig({
            offensiveGoals: {
                minimumPercentage: minPercentage,
                categoryWeights: weights,
                dailyGameHoursGoal: gameGoal,
                focusSkills: focusSkills
            }
        });
    };

    const toggleFocusSkill = (skillId: string) => {
        const exists = focusSkills.find(s => s.skillId === skillId);
        if (exists) {
            setFocusSkills(prev => prev.filter(s => s.skillId !== skillId));
        } else {
            // Adiciona com peso padrão (distribuição igualitária inicial)
            const remaining = 100 - focusSkills.reduce((acc, s) => acc + s.weight, 0);
            const newWeight = Math.max(0, remaining);
            setFocusSkills(prev => [...prev, { skillId, weight: newWeight }]);
        }
    };

    const updateFocusWeight = (skillId: string, weight: number) => {
        setFocusSkills(prev => prev.map(s => s.skillId === skillId ? { ...s, weight } : s));
    };

    const activeSkillsList = skills.filter(s => !s.visualRoadmap?.nodes); // Excluir se tiver lógica de arquivar, por enquanto mostra todas

    const totalWeight = weights.skills + weights.reading + weights.games;
    const isWeightValid = totalWeight === 100;

    const totalFocusWeight = focusSkills.reduce((acc, s) => acc + s.weight, 0);
    const isFocusWeightValid = focusSkills.length === 0 || totalFocusWeight === 100;

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg mb-6">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Metas de Ofensiva</h3>
                        <p className="text-sm text-slate-400">Personalize os critérios para sua ofensiva diária.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                    Salvar Alterações
                </button>
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
                        onChange={(e) => setMinPercentage(Number(e.target.value))}
                        className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                        Você precisa atingir essa porcentagem média para ativar a ofensiva do dia.
                    </p>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 2. Pesos por Categoria */}
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
                                onChange={(e) => setWeights({ ...weights, skills: Number(e.target.value) })}
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
                                onChange={(e) => setWeights({ ...weights, reading: Number(e.target.value) })}
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
                                onChange={(e) => setWeights({ ...weights, games: Number(e.target.value) })}
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

                {/* 3. Meta de Jogos */}
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
                            onChange={(e) => setGameGoal(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-24 text-white font-mono focus:border-purple-500 outline-none"
                        />
                        <span className="text-sm text-slate-400">horas por dia para atingir 100%</span>
                    </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* 4. Skills em Foco */}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activeSkillsList.map(skill => {
                            const isSelected = focusSkills.some(s => s.skillId === skill.id);
                            const skillConfig = focusSkills.find(s => s.skillId === skill.id);

                            return (
                                <div
                                    key={skill.id}
                                    className={`p-3 rounded-xl border transition-all ${isSelected
                                        ? 'bg-cyan-500/10 border-cyan-500/30'
                                        : 'bg-slate-900/30 border-slate-800 opacity-70'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFocusSkill(skill.id)}
                                            className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-offset-0 focus:ring-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">{skill.name}</div>
                                            {isSelected && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs text-cyan-400 w-12">Peso: {skillConfig?.weight}%</span>
                                                    <input
                                                        type="range"
                                                        min="1" max="100"
                                                        value={skillConfig?.weight || 0}
                                                        onChange={(e) => updateFocusWeight(skill.id, Number(e.target.value))}
                                                        className="flex-1 accent-cyan-500 h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
