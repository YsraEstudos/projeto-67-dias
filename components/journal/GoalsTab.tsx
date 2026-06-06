import React, { useState, useMemo, useCallback } from 'react';
import { Target, Plus } from 'lucide-react';
import { useGoalsStore } from '../../stores/goalsStore';
import { YearlyGoal, GoalStatus } from '../../types';
import { GoalCard, STATUS_CONFIG } from './GoalCard';
import { GoalModal } from './GoalModal';

const GoalsTab: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, setGoalStatus, isLoading } = useGoalsStore();

    // Current year as default filter
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<YearlyGoal | null>(null);

    // Available years from goals + current
    const availableYears = useMemo(() => {
        const years = new Set(goals.map(g => g.year));
        years.add(currentYear);
        years.add(currentYear + 1);
        return Array.from(years).sort((a, b) => b - a);
    }, [goals, currentYear]);

    // Filtered goals
    const filteredGoals = useMemo(() => {
        return goals
            .filter(g => g.year === selectedYear)
            .filter(g => selectedStatus === 'ALL' || g.status === selectedStatus)
            .sort((a, b) => {
                // Active first, then by priority
                if (a.status !== b.status) {
                    if (a.status === 'ACTIVE') return -1;
                    if (b.status === 'ACTIVE') return 1;
                }
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }, [goals, selectedYear, selectedStatus]);

    // Stats
    const stats = useMemo(() => ({
        total: filteredGoals.length,
        active: filteredGoals.filter(g => g.status === 'ACTIVE').length,
        achieved: filteredGoals.filter(g => g.status === 'ACHIEVED').length,
    }), [filteredGoals]);

    // Handlers
    const handleCreateGoal = useCallback(() => {
        setEditingGoal(null);
        setIsModalOpen(true);
    }, []);

    const handleEditGoal = useCallback((goal: YearlyGoal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    }, []);

    const handleDeleteGoal = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            deleteGoal(id);
        }
    }, [deleteGoal]);

    const handleSaveGoal = useCallback((goalData: Partial<YearlyGoal>) => {
        if (editingGoal) {
            updateGoal(editingGoal.id, goalData);
        } else {
            const newGoal: YearlyGoal = {
                id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: goalData.title || 'Nova Meta',
                description: goalData.description,
                category: goalData.category,
                year: goalData.year || currentYear,
                priority: goalData.priority || 'MEDIUM',
                status: 'ACTIVE',
                links: goalData.links || [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            addGoal(newGoal);
        }
        setIsModalOpen(false);
        setEditingGoal(null);
    }, [editingGoal, addGoal, updateGoal, currentYear]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-purple-400" size={24} />
                        Metas do Ano
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {stats.achieved}/{stats.total} alcançadas • {stats.active} ativas
                    </p>
                </div>

                <button
                    onClick={handleCreateGoal}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
                >
                    <Plus size={18} /> Nova Meta
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {/* Year Filter */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === year
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setSelectedStatus('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedStatus === 'ALL'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todas
                    </button>
                    {(Object.keys(STATUS_CONFIG) as GoalStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${selectedStatus === status
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {STATUS_CONFIG[status].icon}
                            {STATUS_CONFIG[status].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-slate-500">
                    <Target size={48} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhuma meta encontrada</h3>
                    <p className="text-sm text-center max-w-xs mb-4">
                        {selectedStatus !== 'ALL'
                            ? `Não há metas com status "${STATUS_CONFIG[selectedStatus].label}" em ${selectedYear}.`
                            : `Comece a definir suas metas para ${selectedYear}!`
                        }
                    </p>
                    <button
                        onClick={handleCreateGoal}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Criar primeira meta
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={handleEditGoal}
                            onDelete={handleDeleteGoal}
                            onStatusChange={setGoalStatus}
                        />
                    ))}
                </div>
            )}

            {/* Goal Modal */}
            {isModalOpen && (
                <GoalModal
                    goal={editingGoal}
                    defaultYear={selectedYear}
                    onClose={() => { setIsModalOpen(false); setEditingGoal(null); }}
                    onSave={handleSaveGoal}
                />
            )}
        </div>
    );
};

export default GoalsTab;
