import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, BarChart3, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Book } from '../../types';
import { calculateReadingDailyPlan, ReadingDailyPlanItem } from '../../utils/readingPrediction';
import { useReadingStore } from '../../stores/readingStore';

interface ReadingDailyPlanModalProps {
    book: Book;
    onClose: () => void;
}

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Modal showing detailed daily reading plan with:
 * - Intensity slider for curve adjustment
 * - Visual bar chart of daily distribution
 * - Phase summary table
 * - Day-by-day list with exclusion toggles
 */
const ReadingDailyPlanModal: React.FC<ReadingDailyPlanModalProps> = ({ book: initialBook, onClose }) => {
    const {
        books,
        setDistributionType,
        toggleExcludedDay,
        setExponentialIntensity,
        setBookDeadline
    } = useReadingStore();

    // Get live book state
    const book = books.find(b => b.id === initialBook.id) || initialBook;

    const [localIntensity, setLocalIntensity] = useState(book.exponentialIntensity ?? 1.0);
    const [localDeadline, setLocalDeadline] = useState(book.deadline || '');

    // Sync local intensity when store changes
    useEffect(() => {
        setLocalIntensity(book.exponentialIntensity ?? 1.0);
    }, [book.exponentialIntensity]);

    // Calculate plan with live settings
    const dailyPlan = useMemo(() => {
        const mockBook = {
            ...book,
            exponentialIntensity: localIntensity,
            deadline: localDeadline || book.deadline
        };
        return calculateReadingDailyPlan(mockBook);
    }, [book, localIntensity, localDeadline]);

    const isExponential = book.distributionType === 'EXPONENTIAL';

    const handleToggleDistribution = () => {
        const newType = isExponential ? 'LINEAR' : 'EXPONENTIAL';
        setDistributionType(book.id, newType);
    };

    const handleToggleDay = (dayOfWeek: number) => {
        toggleExcludedDay(book.id, dayOfWeek);
    };

    const handleIntensityChange = (intensity: number) => {
        setLocalIntensity(intensity);
    };

    const handleIntensityCommit = () => {
        setExponentialIntensity(book.id, localIntensity);
    };

    const handleDeadlineChange = (deadline: string) => {
        setLocalDeadline(deadline);
        setBookDeadline(book.id, deadline || undefined);
    };

    const getIntensityLabel = (intensity: number): string => {
        if (intensity < 0.3) return 'Suave';
        if (intensity < 0.7) return 'Moderado';
        return 'Intenso';
    };

    const getIntensityRange = (intensity: number): string => {
        const min = Math.round((1 - 0.7 * intensity) * 100);
        const max = Math.round((1 + 0.7 * intensity) * 100);
        return `${min}% → ${max}%`;
    };

    const formatPages = (pages: number): string => {
        return `${pages} ${book.unit === 'PAGES' ? 'págs' : book.unit === 'CHAPTERS' ? 'caps' : 'h'}`;
    };

    if (!dailyPlan) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="bg-slate-900 rounded-2xl p-6 max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Plano de Leitura</h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="text-center py-8 text-slate-400">
                        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Defina uma deadline para ver o plano de leitura.</p>
                        <input
                            type="date"
                            value={localDeadline}
                            onChange={(e) => handleDeadlineChange(e.target.value)}
                            className="mt-4 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (dailyPlan.isExpired) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="bg-slate-900 rounded-2xl p-6 max-w-md border border-red-500/50" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                            <AlertTriangle size={24} />
                            Prazo Expirado
                        </h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-slate-400 mb-4">A deadline deste livro já passou. Defina uma nova data:</p>
                    <input
                        type="date"
                        value={localDeadline}
                        onChange={(e) => handleDeadlineChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>
        );
    }

    const maxPages = Math.max(...dailyPlan.items.map(i => i.pages), 1);
    const unitLabel = book.unit === 'PAGES' ? 'páginas' : book.unit === 'CHAPTERS' ? 'capítulos' : 'horas';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-400" />
                            Plano de Leitura Diário
                        </h2>
                        <p className="text-xs text-slate-500 truncate max-w-[280px]" title={book.title}>
                            {book.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto flex-1 p-4 space-y-4">

                    {/* Distribution Toggle + Deadline */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleToggleDistribution}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${isExponential
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            {isExponential ? '📈 Exponencial' : '➡️ Linear'}
                        </button>

                        <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 border border-slate-700">
                            <Calendar size={14} className="text-slate-500" />
                            <input
                                type="date"
                                value={localDeadline}
                                onChange={(e) => handleDeadlineChange(e.target.value)}
                                className="bg-transparent text-sm text-white py-2 outline-none"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    {/* Intensity Slider (only for exponential) */}
                    {isExponential && (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-slate-400">Intensidade da Curva</span>
                                <span className="text-sm font-mono text-indigo-400">
                                    {getIntensityLabel(localIntensity)} ({getIntensityRange(localIntensity)})
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={localIntensity}
                                onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                                onMouseUp={handleIntensityCommit}
                                onTouchEnd={handleIntensityCommit}
                                className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>Linear</span>
                                <span>Suave</span>
                                <span>Intenso</span>
                            </div>
                        </div>
                    )}

                    {/* Week Day Toggles */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-400">Dias de Leitura</span>
                            <span className="text-xs text-slate-600">
                                {dailyPlan.effectiveDays} dias úteis
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {DAY_NAMES_SHORT.map((name, dayOfWeek) => {
                                const isExcluded = book.excludedDays?.includes(dayOfWeek);
                                return (
                                    <button
                                        key={dayOfWeek}
                                        onClick={() => handleToggleDay(dayOfWeek)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${isExcluded
                                                ? 'bg-slate-900 text-slate-600 border border-slate-800'
                                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                            }`}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                            <div className="text-xl font-bold text-indigo-400">
                                {Math.round(dailyPlan.avgPagesPerDay)}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">Média/dia</div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                            <div className="text-xl font-bold text-white">
                                {dailyPlan.remainingPages}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">{unitLabel}</div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                            <div className="text-xl font-bold text-emerald-400">
                                {dailyPlan.effectiveDays}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">Dias</div>
                        </div>
                    </div>

                    {/* Phases Summary */}
                    {dailyPlan.phases.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fases</span>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {dailyPlan.phases.map((phase, idx) => (
                                    <div key={idx} className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{phase.emoji}</span>
                                            <span className="text-sm font-medium text-slate-300">{phase.name}</span>
                                            <span className="text-xs text-slate-600">Dia {phase.startDay}-{phase.endDay}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-indigo-400">{phase.avgPagesPerDay}/dia</div>
                                            <div className="text-[10px] text-slate-500">{phase.percentRange}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Visual Chart */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-end gap-0.5 h-24">
                            {dailyPlan.items.slice(0, 30).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 flex flex-col items-center justify-end"
                                >
                                    <div
                                        className={`w-full rounded-t transition-all ${item.isExcluded
                                                ? 'bg-slate-700/30'
                                                : 'bg-indigo-500'
                                            }`}
                                        style={{
                                            height: `${Math.max(2, (item.pages / maxPages) * 100)}%`,
                                            minHeight: item.isExcluded ? '2px' : '4px'
                                        }}
                                        title={`${item.dayOfWeekName}: ${formatPages(item.pages)}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600 mt-2">
                            <span>Hoje</span>
                            <span>Deadline</span>
                        </div>
                    </div>

                    {/* Day List (first 14 days) */}
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Próximos Dias
                        </div>
                        {dailyPlan.items.slice(0, 14).map((item, idx) => (
                            <DayRow
                                key={idx}
                                item={item}
                                idx={idx}
                                avgPages={dailyPlan.avgPagesPerDay}
                                formatPages={formatPages}
                            />
                        ))}
                        {dailyPlan.items.length > 14 && (
                            <div className="text-center py-2 text-xs text-slate-600">
                                +{dailyPlan.items.length - 14} dias restantes
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component for day rows
interface DayRowProps {
    item: ReadingDailyPlanItem;
    idx: number;
    avgPages: number;
    formatPages: (pages: number) => string;
}

const DayRow: React.FC<DayRowProps> = React.memo(({ item, idx, avgPages, formatPages }) => {
    const isToday = idx === 0;

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg ${item.isExcluded
                ? 'bg-slate-800/30 opacity-50'
                : isToday
                    ? 'bg-indigo-500/10 border border-indigo-500/30'
                    : 'bg-slate-800/50'
            }`}>
            <div className="w-16 text-xs">
                <div className={`font-medium ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {isToday ? 'Hoje' : item.dayOfWeekName.slice(0, 3)}
                </div>
                <div className="text-slate-600">{item.formattedDate}</div>
            </div>

            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${item.isExcluded ? 'bg-slate-600' : 'bg-indigo-500'
                        }`}
                    style={{ width: `${Math.min(100, item.percentOfAverage)}%` }}
                />
            </div>

            <div className="w-20 text-right">
                {item.isExcluded ? (
                    <span className="text-xs text-slate-600">Folga</span>
                ) : (
                    <>
                        <div className="text-sm font-bold text-white">{formatPages(item.pages)}</div>
                        <div className="text-[10px] text-slate-500">{item.percentOfAverage}%</div>
                    </>
                )}
            </div>

            {!item.isExcluded && (
                <CheckCircle2 size={16} className="text-slate-700" />
            )}
        </div>
    );
});

DayRow.displayName = 'DayRow';

export default ReadingDailyPlanModal;
