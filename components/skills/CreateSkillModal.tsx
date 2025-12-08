import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Skill } from '../../types';
import { ThemeKey } from './constants';
import { ThemePicker } from './ThemePicker';

interface CreateSkillModalProps {
    onClose: () => void;
    onCreate: (s: Skill) => void;
}

export const CreateSkillModal: React.FC<CreateSkillModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [level, setLevel] = useState<Skill['level']>('Iniciante');
    const [goalHours, setGoalHours] = useState(20);
    const [theme, setTheme] = useState<ThemeKey>('emerald');

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
                                onChange={e => setLevel(e.target.value as Skill['level'])}
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
                        <ThemePicker selectedTheme={theme} onSelect={setTheme} />
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
