import React, { useMemo } from 'react';
import { Book as IBook } from '../../types';
import DraggableBookCard from './DraggableBookCard';
import { BookOpen, Library, PauseCircle, CheckCircle2 } from 'lucide-react';

// Column configuration - defined once, never recreated
const COLUMNS = [
    { title: "Lendo", status: 'READING' as const, Icon: BookOpen, color: "text-indigo-400" },
    { title: "Para Ler", status: 'TO_READ' as const, Icon: Library, color: "text-sky-400" },
    { title: "Pausados", status: 'PAUSED' as const, Icon: PauseCircle, color: "text-orange-400" },
    { title: "Concluídos", status: 'COMPLETED' as const, Icon: CheckCircle2, color: "text-green-400" },
] as const;

interface DashboardViewProps {
    books: IBook[];
    viewMode: 'grid' | 'list';
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDropOnStatus: (e: React.DragEvent, status: IBook['status']) => void;
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
}

const DashboardView: React.FC<DashboardViewProps> = React.memo(({ books, viewMode, onDragStart, onDropOnStatus, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan }) => {

    // Memoize books by status to avoid O(4n) filter on every render
    const booksByStatus = useMemo(() => {
        const map: Record<IBook['status'], IBook[]> = {
            'READING': [],
            'TO_READ': [],
            'PAUSED': [],
            'COMPLETED': [],
            'ABANDONED': [],
        };
        for (const book of books) {
            map[book.status].push(book);
        }
        return map;
    }, [books]);

    const renderColumn = (title: string, status: IBook['status'], Icon: typeof BookOpen, color: string) => {
        const columnBooks = booksByStatus[status];

        return (
            <div
                className="flex flex-col h-full min-h-[400px] bg-slate-800/30 rounded-2xl border border-slate-800/50 overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropOnStatus(e, status)}
            >
                {/* Column Header */}
                <div className={`p-4 border-b border-slate-700/50 flex items-center gap-3 ${color} bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10`}>
                    <Icon size={20} />
                    <h3 className="font-bold text-slate-200">{title}</h3>
                    <span className="ml-auto bg-slate-900 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">{columnBooks.length}</span>
                </div>

                {/* Column Content */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
                    {columnBooks.length === 0 && (
                        <div className="h-32 flex items-center justify-center text-slate-600 text-sm italic border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 m-2">
                            Arraste livros aqui
                        </div>
                    )}
                    {columnBooks.map(book => (
                        <DraggableBookCard
                            key={book.id}
                            book={book}
                            viewMode={viewMode}
                            onDragStart={onDragStart}
                            onUpdateProgress={onUpdateProgress}
                            onUpdateStatus={onUpdateStatus}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMove={onMove}
                            onSelect={onSelect}
                            onPlan={onPlan}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full">
            {COLUMNS.map(({ title, status, Icon, color }) => (
                <React.Fragment key={status}>
                    {renderColumn(title, status, Icon, color)}
                </React.Fragment>
            ))}
        </div>
    );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
