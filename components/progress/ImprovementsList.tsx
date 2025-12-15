import React, { useState, useMemo } from 'react';
import {
    AlertTriangle, CheckCircle, Flame, GraduationCap,
    BookOpen, CheckSquare, PenLine, Filter, ChevronDown
} from 'lucide-react';
import { ImprovementPoint } from '../../types';

interface ImprovementsListProps {
    improvements: ImprovementPoint[];
    onToggleAddressed: (id: string) => void;
}

const getCategoryIcon = (category: ImprovementPoint['category']) => {
    switch (category) {
        case 'HABITS': return <Flame size={14} className="text-orange-400" />;
        case 'SKILLS': return <GraduationCap size={14} className="text-emerald-400" />;
        case 'READING': return <BookOpen size={14} className="text-yellow-400" />;
        case 'TASKS': return <CheckSquare size={14} className="text-blue-400" />;
        case 'JOURNAL': return <PenLine size={14} className="text-purple-400" />;
    }
};

const getCategoryLabel = (category: ImprovementPoint['category']) => {
    const labels: Record<ImprovementPoint['category'], string> = {
        HABITS: 'Hábitos',
        SKILLS: 'Skills',
        READING: 'Leitura',
        TASKS: 'Tarefas',
        JOURNAL: 'Diário'
    };
    return labels[category];
};

const getPriorityBadge = (priority: ImprovementPoint['priority']) => {
    const styles = {
        HIGH: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    const labels = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' };

    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${styles[priority]}`}>
            {labels[priority]}
        </span>
    );
};

export const ImprovementsList: React.FC<ImprovementsListProps> = React.memo(({
    improvements,
    onToggleAddressed
}) => {
    const [showAddressed, setShowAddressed] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ImprovementPoint['category'] | 'ALL'>('ALL');

    // Filtrar melhorias (memoized)
    const filteredImprovements = useMemo(() =>
        improvements.filter(imp => {
            if (!showAddressed && imp.isAddressed) return false;
            if (selectedCategory !== 'ALL' && imp.category !== selectedCategory) return false;
            return true;
        }), [improvements, showAddressed, selectedCategory]);

    // Agrupar por categoria (memoized)
    const groupedByCategory = useMemo(() =>
        filteredImprovements.reduce((acc, imp) => {
            if (!acc[imp.category]) acc[imp.category] = [];
            acc[imp.category].push(imp);
            return acc;
        }, {} as Record<ImprovementPoint['category'], ImprovementPoint[]>), [filteredImprovements]);

    // Contadores (memoized)
    const { pendingCount, addressedCount } = useMemo(() => ({
        pendingCount: improvements.filter(i => !i.isAddressed).length,
        addressedCount: improvements.filter(i => i.isAddressed).length
    }), [improvements]);

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Pontos de Melhoria</h3>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as ImprovementPoint['category'] | 'ALL')}
                            className="appearance-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-300 focus:border-cyan-500 outline-none cursor-pointer"
                        >
                            <option value="ALL">Todas</option>
                            <option value="HABITS">Hábitos</option>
                            <option value="SKILLS">Skills</option>
                            <option value="READING">Leitura</option>
                            <option value="TASKS">Tarefas</option>
                            <option value="JOURNAL">Diário</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Show Addressed Toggle */}
                    <button
                        onClick={() => setShowAddressed(!showAddressed)}
                        className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${showAddressed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                            }
            `}
                    >
                        <CheckCircle size={12} className="inline mr-1" />
                        Resolvidos ({addressedCount})
                    </button>
                </div>
            </div>

            {filteredImprovements.length === 0 ? (
                <div className="text-center py-8">
                    <CheckCircle size={48} className="mx-auto text-emerald-500/50 mb-3" />
                    <p className="text-slate-400">
                        {improvements.length === 0
                            ? 'Nenhum ponto de melhoria identificado ainda'
                            : 'Todos os pontos foram endereçados! 🎉'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {(Object.entries(groupedByCategory) as [ImprovementPoint['category'], ImprovementPoint[]][]).map(([category, items]) => (
                        <div key={category}>
                            {/* Category Header */}
                            <div className="flex items-center gap-2 mb-2">
                                {getCategoryIcon(category as ImprovementPoint['category'])}
                                <span className="text-sm font-medium text-slate-300">
                                    {getCategoryLabel(category as ImprovementPoint['category'])}
                                </span>
                                <span className="text-xs text-slate-500">({items.length})</span>
                            </div>

                            {/* Items */}
                            <div className="space-y-2 ml-5">
                                {items.map(improvement => (
                                    <div
                                        key={improvement.id}
                                        className={`
                      p-3 rounded-xl border transition-all
                      ${improvement.isAddressed
                                                ? 'bg-slate-900/30 border-slate-700/50 opacity-60'
                                                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                            }
                    `}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`text-sm font-medium ${improvement.isAddressed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                                        {improvement.title}
                                                    </h4>
                                                    {getPriorityBadge(improvement.priority)}
                                                </div>
                                                <p className="text-xs text-slate-500">{improvement.description}</p>
                                                <p className="text-[10px] text-slate-600 mt-1">Semana {improvement.weekIdentified}</p>
                                            </div>

                                            {/* Toggle Button */}
                                            <button
                                                onClick={() => onToggleAddressed(improvement.id)}
                                                className={`
                          p-2 rounded-lg transition-colors
                          ${improvement.isAddressed
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-800 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                                                    }
                        `}
                                                title={improvement.isAddressed ? 'Marcar como pendente' : 'Marcar como resolvido'}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default ImprovementsList;
