import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
    CalendarDays, Clock, Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle2, Circle
} from 'lucide-react';
import { useRestStore } from '../../stores';
import { RestActivity } from '../../types';
import RestActivityItem from './RestActivityItem';
import RestActivityInput from './RestActivityInput';

// Lazy load modals
const NextTwoHoursModal = React.lazy(() => import('./modals/NextTwoHoursModal'));
const EditRestActivityModal = React.lazy(() => import('./modals/EditRestActivityModal'));

const RestView: React.FC = () => {
    // --- STATE & SELECTORS ---
    // Atomic selectors to prevent unnecessary re-renders
    const activities = useRestStore(state => state.activities);
    const nextTwoHoursIds = useRestStore(state => state.nextTwoHoursIds);
    const addActivity = useRestStore(state => state.addActivity);
    const addActivities = useRestStore(state => state.addActivities);

    const updateActivity = useRestStore(state => state.updateActivity);
    const removeActivity = useRestStore(state => state.deleteActivity);
    const toggleActivityComplete = useRestStore(state => state.toggleActivityComplete);
    const setActivities = useRestStore(state => state.reorderActivities);
    const setNextTwoHoursIds = useRestStore(state => state.setNextTwoHoursIds);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isNext2hModalOpen, setIsNext2hModalOpen] = useState(false);
    const [isManualInputOpen, setIsManualInputOpen] = useState(false);
    // Removed local input state

    const [editingActivity, setEditingActivity] = useState<RestActivity | null>(null);

    // --- FILTERING LOGIC ---
    const filteredActivities = useMemo(() => {
        const dayOfWeek = selectedDate.getDay();
        const dateString = selectedDate.toISOString().split('T')[0];

        return activities
            .filter(act => {
                if (act.type === 'DAILY') return true;
                if (act.type === 'WEEKLY') return act.daysOfWeek?.includes(dayOfWeek);
                if (act.type === 'ONCE') return act.specificDate === dateString;
                return false;
            })
            .sort((a, b) => a.order - b.order);
    }, [activities, selectedDate]);

    const nextTwoHoursActivities = useMemo(() => {
        return nextTwoHoursIds
            .map(id => activities.find(a => a.id === id))
            .filter(Boolean) as RestActivity[];
    }, [activities, nextTwoHoursIds]);

    // --- HANDLERS (Memoized) ---


    const toggleComplete = useCallback((id: string) => {
        toggleActivityComplete(id);
    }, [toggleActivityComplete]);

    const deleteActivity = useCallback((id: string) => {
        removeActivity(id);
    }, [removeActivity]);

    const handleEditActivity = useCallback((activity: RestActivity) => {
        setEditingActivity(activity);
    }, []);

    const handleUpdateActivity = useCallback((updatedActivity: RestActivity) => {
        updateActivity(updatedActivity.id, updatedActivity);
        setEditingActivity(null);
    }, [updateActivity]);

    // Manual input is local state mostly, so we can keep it simple or memoize if passed down.
    // It's not passed down, so we keep it as is, but optimize the function to not be recreated if not needed.
    // Updated handler to accept data from child component
    const handleAddManualActivity = useCallback((data: Omit<RestActivity, 'id' | 'order' | 'isCompleted'>) => {
        const newActivity: RestActivity = {
            id: Date.now().toString(),
            title: data.title,
            isCompleted: false,
            type: data.type,
            order: activities.length,
            specificDate: data.specificDate,
            daysOfWeek: data.daysOfWeek
        };

        addActivity(newActivity);
        setIsManualInputOpen(false);
    }, [activities.length, addActivity]);


    // --- DRAG AND DROP ---
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = Number(e.dataTransfer.getData('index'));
        if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        // Note: filteredActivities is a specific view. Reordering here implies reordering the global list?
        // The original code re-calculated orders based on the filtered view and updated the main list.
        // This is complex because 'index' in filtered view != index in main list.
        // We will stick to the original logic which seemed to map filtered changes back to global state.

        // We need `filteredActivities` here.
        const newFiltered = [...filteredActivities];
        const [movedItem] = newFiltered.splice(sourceIndex, 1);
        newFiltered.splice(targetIndex, 0, movedItem);

        const updatesMap = new Map(newFiltered.map((item, idx) => [item.id, idx]));

        const reorderedActivities = activities.map(item =>
            updatesMap.has(item.id) ? { ...item, order: updatesMap.get(item.id)! } : item
        );
        setActivities(reorderedActivities);

    }, [filteredActivities, activities, setActivities]);

    // --- DATE NAVIGATION ---
    const changeDay = useCallback((days: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500 pb-24 relative">

            {/* HEADER: Date Selector */}
            <div className="flex items-center justify-between mb-6 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                <button onClick={() => changeDay(-1)} className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Planejador de Descansos</span>
                    <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-200">
                        <CalendarDays size={24} className="text-cyan-500" />
                        <span className="capitalize">
                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </span>
                        <span className="text-slate-600 font-light">|</span>
                        <span className="text-slate-400 text-lg">
                            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>

                <button onClick={() => changeDay(1)} className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* NEXT 2 HOURS SECTION (Kept inline as it's small and specific view, could be extracted but low priority) */}
            {nextTwoHoursActivities.length > 0 && (
                <div className="mb-6 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} /> Próximas 2 Horas
                        </h3>
                        <button
                            onClick={() => setNextTwoHoursIds([])}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        >
                            Limpar Foco
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {nextTwoHoursActivities.map((activity, index) => (
                            <div key={activity.id} className={`p-3 rounded-xl border flex items-center gap-3 ${activity.isCompleted
                                ? 'bg-cyan-950/30 border-cyan-900/50 opacity-70'
                                : 'bg-gradient-to-br from-cyan-900/20 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-900/10'
                                }`}>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                                    {index + 1}
                                </div>
                                <span className={`flex-1 text-sm font-medium truncate ${activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {activity.title}
                                </span>
                                <button
                                    onClick={() => toggleComplete(activity.id)}
                                    className={`transition-colors ${activity.isCompleted ? 'text-cyan-500' : 'text-slate-600 hover:text-cyan-400'}`}
                                >
                                    {activity.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ACTIONS BAR */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setIsNext2hModalOpen(true)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                    <Clock size={20} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Planejar Próximas 2h</span>
                </button>

                <button
                    onClick={() => setIsManualInputOpen(!isManualInputOpen)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-cyan-900/20"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-medium">Descanso</span>
                </button>
            </div>

            {/* MANUAL INPUT SECTION */}
            {isManualInputOpen && (
                <RestActivityInput
                    selectedDate={selectedDate}
                    onAdd={handleAddManualActivity}
                    onCancel={() => setIsManualInputOpen(false)}
                />
            )}



            {/* LIST AREA */}
            <div className="space-y-3">
                {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <Calendar size={48} className="text-slate-700 mb-4" />
                        <div className="text-slate-500 font-medium">Nenhum descanso planejado para hoje.</div>
                        <div className="text-sm text-slate-600 mt-1">Use o botão acima para adicionar descansos.</div>
                    </div>
                ) : (
                    filteredActivities.map((activity, index) => (
                        <RestActivityItem
                            key={activity.id}
                            activity={activity}
                            index={index}
                            onDragStart={handleDragStart}
                            onDrop={handleDrop}
                            onToggleComplete={toggleComplete}
                            onEdit={handleEditActivity}
                            onDelete={deleteActivity}
                        />
                    ))
                )}
            </div>

            {/* MODALS (Lazy Loaded with Suspense) */}
            <Suspense fallback={null}>
                {editingActivity && (
                    <EditRestActivityModal
                        activity={editingActivity}
                        onClose={() => setEditingActivity(null)}
                        onSave={handleUpdateActivity}
                    />
                )}
                {isNext2hModalOpen && (
                    <NextTwoHoursModal
                        activities={activities}
                        selectedDate={selectedDate}
                        onClose={() => setIsNext2hModalOpen(false)}
                        onSave={(ids) => {
                            setNextTwoHoursIds(ids);
                            setIsNext2hModalOpen(false);
                        }}
                        initialIds={nextTwoHoursIds}
                    />
                )}
            </Suspense>
        </div >
    );
};

export default RestView;