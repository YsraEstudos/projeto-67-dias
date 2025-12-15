import React, { useMemo } from 'react';
import { Book as IBook, ProjectConfig } from '../../types';
import { Target, BookOpen, AlertTriangle, TrendingUp, Clock, Flame, Book } from 'lucide-react';

interface ReadingGoalSidebarProps {
    books: IBook[];
    projectConfig: ProjectConfig;
}

const ReadingGoalSidebar: React.FC<ReadingGoalSidebarProps> = React.memo(({ books, projectConfig }) => {

    const goalStats = useMemo(() => {
        const TOTAL_DAYS = 67;
        const MARGIN_DAYS = 2; // Buffer for missed days
        const EFFECTIVE_DAYS = TOTAL_DAYS - MARGIN_DAYS;

        // Calculate days elapsed
        const startDate = new Date(projectConfig.startDate);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(1, EFFECTIVE_DAYS - daysElapsed);

        // Get books in READING status
        const readingBooks = books.filter(b => b.status === 'READING');

        // Calculate total remaining pages/chapters
        const totalRemaining = readingBooks.reduce((acc, book) => {
            const remaining = Math.max(0, book.total - book.current);
            return acc + remaining;
        }, 0);

        // Calculate pages per day needed
        const pagesPerDay = totalRemaining > 0 ? Math.ceil(totalRemaining / daysRemaining) : 0;

        // Per-book breakdown
        const bookDetails = readingBooks.map(book => {
            const remaining = Math.max(0, book.total - book.current);
            const perDay = remaining > 0 ? Math.ceil(remaining / daysRemaining) : 0;
            const progress = Math.round((book.current / (book.total || 1)) * 100);
            return { ...book, remaining, perDay, progress };
        });

        // Status indicators
        const isOnTrack = daysElapsed < EFFECTIVE_DAYS;
        const urgencyLevel = daysRemaining <= 10 ? 'high' : daysRemaining <= 20 ? 'medium' : 'low';

        return {
            daysElapsed,
            daysRemaining,
            totalRemaining,
            pagesPerDay,
            readingCount: readingBooks.length,
            bookDetails,
            isOnTrack,
            urgencyLevel
        };
    }, [books, projectConfig.startDate]);

    if (goalStats.readingCount === 0) {
        return (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Meta de Leitura</h3>
                        <p className="text-xs text-slate-500">Projeto 67 Dias</p>
                    </div>
                </div>
                <div className="text-center py-6 text-slate-500">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum livro em leitura</p>
                    <p className="text-xs mt-1">Mova um livro para "Lendo" para ver sua meta diária</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden mb-6">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${goalStats.urgencyLevel === 'high' ? 'bg-red-500/10 text-red-400' :
                        goalStats.urgencyLevel === 'medium' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-indigo-500/10 text-indigo-400'
                        }`}>
                        <Target size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Meta de Leitura</h3>
                        <p className="text-xs text-slate-500">{goalStats.daysRemaining} dias restantes</p>
                    </div>
                </div>
            </div>

            {/* Main Stat */}
            <div className="p-5 text-center border-b border-slate-700/50 bg-gradient-to-b from-slate-900/50 to-transparent">
                <div className="text-5xl font-bold text-white mb-1 tracking-tight">
                    <span className={`${goalStats.urgencyLevel === 'high' ? 'text-red-400' :
                        goalStats.urgencyLevel === 'medium' ? 'text-orange-400' :
                            'text-indigo-400'
                        }`}>
                        {goalStats.pagesPerDay}
                    </span>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                    páginas/capítulos por dia
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                    Total restante: {goalStats.totalRemaining}
                </p>
            </div>

            {/* Days Progress */}
            <div className="px-5 py-4 border-b border-slate-700/50">
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Progresso do Projeto
                    </span>
                    <span className="text-slate-300 font-mono">
                        Dia {goalStats.daysElapsed} / 65
                    </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${goalStats.urgencyLevel === 'high' ? 'bg-red-500' :
                            goalStats.urgencyLevel === 'medium' ? 'bg-orange-500' :
                                'bg-indigo-500'
                            }`}
                        style={{ width: `${Math.min(100, (goalStats.daysElapsed / 65) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Per-Book Breakdown */}
            <div className="p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Flame size={12} /> Por Livro
                </h4>
                <div className="space-y-3">
                    {goalStats.bookDetails.map(book => (
                        <div key={book.id} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                            <div className="flex items-start gap-3">
                                {/* Mini Cover */}
                                <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                    {book.coverUrl ? (
                                        <img src={book.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                                            <Book size={16} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-slate-200 truncate" title={book.title}>
                                        {book.title}
                                    </h5>
                                    <p className="text-[10px] text-slate-500 mb-2">
                                        {book.remaining} {book.unit === 'PAGES' ? 'págs' : 'caps'} restantes
                                    </p>

                                    {/* Per-day badge */}
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${book.perDay > 20 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        book.perDay > 10 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        }`}>
                                        <TrendingUp size={10} />
                                        {book.perDay}/dia
                                    </div>
                                </div>

                                {/* Progress Circle */}
                                <div className="text-right">
                                    <span className="text-lg font-bold text-slate-300">{book.progress}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warning if behind schedule */}
            {goalStats.urgencyLevel === 'high' && (
                <div className="p-4 bg-red-500/5 border-t border-red-500/20">
                    <div className="flex items-start gap-2 text-xs text-red-300">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <p>
                            <span className="font-bold">Atenção!</span> Poucos dias restantes.
                            Considere aumentar seu ritmo de leitura.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

ReadingGoalSidebar.displayName = 'ReadingGoalSidebar';

export default ReadingGoalSidebar;
