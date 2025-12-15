import React, { useState, useMemo } from 'react';
import { Clock, X, Plus, ArrowRight } from 'lucide-react';
import { useRestStore } from '../../../stores';
import { RestActivity } from '../../../types';

interface NextTwoHoursModalProps {
    activities: RestActivity[];
    selectedDate: Date;
    onClose: () => void;
    onSave: (ids: string[]) => void;
    initialIds: string[];
}

const NextTwoHoursModal: React.FC<NextTwoHoursModalProps> = ({ activities, selectedDate, onClose, onSave, initialIds }) => {
    // Use Zustand store directly
    const { addActivity, updateActivity } = useRestStore();
    const [slots, setSlots] = useState<(string | null)[]>([
        initialIds[0] || null,
        initialIds[1] || null,
        initialIds[2] || null,
        initialIds[3] || null
    ]);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [tab, setTab] = useState<'TODAY' | 'FUTURE' | 'NEW'>('TODAY');
    const [newActivityTitle, setNewActivityTitle] = useState('');

    const todayStr = selectedDate.toISOString().split('T')[0];

    // Filter available activities for selection
    const availableToday = useMemo(() => {
        return activities.filter(a => {
            // Must be for today
            const isToday = a.type === 'DAILY' ||
                (a.type === 'WEEKLY' && a.daysOfWeek?.includes(selectedDate.getDay())) ||
                (a.type === 'ONCE' && a.specificDate === todayStr);
            // Must not be already selected in another slot
            const isSelected = slots.includes(a.id);
            return isToday && !isSelected && !a.isCompleted;
        });
    }, [activities, selectedDate, slots]);

    const availableFuture = useMemo(() => {
        return activities.filter(a => {
            // Must NOT be for today
            const isToday = a.type === 'DAILY' ||
                (a.type === 'WEEKLY' && a.daysOfWeek?.includes(selectedDate.getDay())) ||
                (a.type === 'ONCE' && a.specificDate === todayStr);

            // Simple future check (not exhaustive, just "not today")
            return !isToday && !a.isCompleted;
        });
    }, [activities, selectedDate]);

    const handleSelectActivity = (activity: RestActivity, isFuture: boolean) => {
        if (activeSlot === null) return;

        let finalId = activity.id;

        if (isFuture) {
            // Logic to "Advance" the task
            if (activity.type === 'WEEKLY') {
                // Clone as ONCE for today
                const newActivity: RestActivity = {
                    ...activity,
                    id: Date.now().toString(),
                    type: 'ONCE',
                    specificDate: todayStr,
                    daysOfWeek: undefined,
                    order: activities.length
                };
                addActivity(newActivity);
                finalId = newActivity.id;
            } else if (activity.type === 'ONCE') {
                // Move to today
                updateActivity(activity.id, { specificDate: todayStr });
                // ID stays same
            }
        }

        const newSlots = [...slots];
        newSlots[activeSlot] = finalId;
        setSlots(newSlots);
        setActiveSlot(null);
    };

    const handleCreateNew = () => {
        if (!newActivityTitle.trim() || activeSlot === null) return;

        const newActivity: RestActivity = {
            id: Date.now().toString(),
            title: newActivityTitle,
            isCompleted: false,
            type: 'ONCE',
            specificDate: todayStr,
            order: activities.length
        };

        addActivity(newActivity);

        const newSlots = [...slots];
        newSlots[activeSlot] = newActivity.id;
        setSlots(newSlots);

        setNewActivityTitle('');
        setActiveSlot(null);
    };

    const handleRemoveSlot = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSlots = [...slots];
        newSlots[index] = null;
        setSlots(newSlots);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Clock className="text-cyan-500" /> Planejar Próximas 2 Horas
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Slots Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {slots.map((slotId, index) => {
                            const activity = activities.find(a => a.id === slotId);
                            const isActive = activeSlot === index;

                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveSlot(index)}
                                    className={`relative p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[100px] flex flex-col items-center justify-center text-center gap-2
                                        ${isActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}
                                        ${activity ? 'border-solid bg-slate-800 border-slate-700' : ''}
                                    `}
                                >
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>

                                    {activity ? (
                                        <>
                                            <span className="text-slate-200 font-medium text-sm line-clamp-2">{activity.title}</span>
                                            <button
                                                onClick={(e) => handleRemoveSlot(index, e)}
                                                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Selecionar Atividade</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Selection Area */}
                    {activeSlot !== null && (
                        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4">
                            <div className="flex border-b border-slate-800">
                                <button
                                    onClick={() => setTab('TODAY')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'TODAY' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={() => setTab('FUTURE')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'FUTURE' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Adiantar (Futuro)
                                </button>
                                <button
                                    onClick={() => setTab('NEW')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'NEW' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Novo
                                </button>
                            </div>

                            <div className="p-4 max-h-60 overflow-y-auto scrollbar-thin">
                                {tab === 'TODAY' && (
                                    <div className="space-y-2">
                                        {availableToday.length === 0 ? (
                                            <p className="text-slate-500 text-center text-sm py-4">Nenhuma atividade pendente para hoje.</p>
                                        ) : (
                                            availableToday.map(act => (
                                                <button
                                                    key={act.id}
                                                    onClick={() => handleSelectActivity(act, false)}
                                                    className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                                                >
                                                    <span className="text-slate-300 text-sm">{act.title}</span>
                                                    <Plus size={16} className="text-slate-600 group-hover:text-cyan-400" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {tab === 'FUTURE' && (
                                    <div className="space-y-2">
                                        {availableFuture.length === 0 ? (
                                            <p className="text-slate-500 text-center text-sm py-4">Nenhuma atividade futura encontrada.</p>
                                        ) : (
                                            availableFuture.map(act => (
                                                <button
                                                    key={act.id}
                                                    onClick={() => handleSelectActivity(act, true)}
                                                    className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="text-slate-300 text-sm">{act.title}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {act.type === 'WEEKLY' ? 'Semanal' : act.specificDate ? new Date(act.specificDate).toLocaleDateString('pt-BR') : 'Futuro'}
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={16} className="text-slate-600 group-hover:text-cyan-400" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {tab === 'NEW' && (
                                    <div className="flex gap-2">
                                        <input
                                            value={newActivityTitle}
                                            onChange={(e) => setNewActivityTitle(e.target.value)}
                                            placeholder="Nome da atividade..."
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleCreateNew}
                                            disabled={!newActivityTitle.trim()}
                                            className="bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-cyan-500 transition-colors"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(slots.filter(Boolean) as string[])}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
                    >
                        Confirmar Planejamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NextTwoHoursModal;
