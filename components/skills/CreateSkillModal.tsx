import React from 'react';
import { X, Plus, CalendarClock } from 'lucide-react';
import { Skill } from '../../types';
import { ThemeKey } from './constants';
import { ThemePicker } from './ThemePicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { skillSchema, SkillFormData } from '../../schemas';

interface CreateSkillModalProps {
    onClose: () => void;
    onCreate: (s: Skill) => void;
}

export const CreateSkillModal: React.FC<CreateSkillModalProps> = ({ onClose, onCreate }) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors }
    } = useForm<SkillFormData>({
        resolver: zodResolver(skillSchema),
        defaultValues: {
            name: '',
            level: 'Iniciante',
            goalHours: 20,
            theme: 'emerald',
            deadline: ''
        }
    });

    const onSubmit = (data: SkillFormData) => {
        const goalMinutes = data.goalHours * 60;
        const newSkill: Skill = {
            id: Date.now().toString(),
            name: data.name,
            level: data.level,
            currentMinutes: 0,
            goalMinutes,
            goalPomodoros: Math.ceil(goalMinutes / 25),
            pomodorosCompleted: 0,
            goalType: 'TIME',
            resources: [],
            roadmap: [],
            logs: [],
            colorTheme: data.theme,
            deadline: data.deadline || undefined,
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-6 space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-500 uppercase font-bold">O que você vai aprender?</label>
                                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                            </div>
                            <input
                                {...register('name')}
                                autoFocus
                                className={`w-full bg-slate-900 border rounded-lg p-3 text-white outline-none ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-emerald-500'
                                    }`}
                                placeholder="Ex: Python, Design, Guitarra..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nível Atual</label>
                                <select
                                    {...register('level')}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                                >
                                    <option>Iniciante</option>
                                    <option>Intermediário</option>
                                    <option>Avançado</option>
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-slate-500 uppercase font-bold">Meta (Horas)</label>
                                    {errors.goalHours && <span className="text-xs text-red-500">{errors.goalHours.message}</span>}
                                </div>
                                <input
                                    type="number"
                                    {...register('goalHours', { valueAsNumber: true })}
                                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white outline-none ${errors.goalHours ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-emerald-500'
                                        }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Cor do Tema</label>
                            <Controller
                                name="theme"
                                control={control}
                                render={({ field }) => (
                                    <ThemePicker selectedTheme={field.value} onSelect={field.onChange} />
                                )}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">
                                <CalendarClock size={12} className="inline mr-1" />
                                Deadline (Opcional)
                            </label>
                            <input
                                type="date"
                                {...register('deadline')}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Define uma data limite para calcular estudo diário necessário.</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                            <Plus size={18} /> Criar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
