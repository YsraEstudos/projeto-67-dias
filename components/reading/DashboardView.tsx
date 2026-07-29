import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Book as IBook } from '../../types';
import DraggableBookCard from './DraggableBookCard';
import { BookOpen, Library, PauseCircle, CheckCircle2 } from 'lucide-react';

// Row configuration - defined once, never recreated
const COLUMNS = [
    { title: "Lendo", status: 'READING' as const, Icon: BookOpen, color: "text-indigo-400" },
    { title: "Para Ler", status: 'TO_READ' as const, Icon: Library, color: "text-sky-400" },
    { title: "Pausados", status: 'PAUSED' as const, Icon: PauseCircle, color: "text-orange-400" },
    { title: "Concluídos", status: 'COMPLETED' as const, Icon: CheckCircle2, color: "text-green-400" },
] as const;

const DroppableColumn: React.FC<{
    title: string;
    status: IBook['status'];
    Icon: typeof BookOpen;
    color: string;
    books: IBook[];
    viewMode: 'grid' | 'list';
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
}> = ({ title, status, Icon, color, books: columnBooks, viewMode, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan }) => {
    const isActive = status === 'READING';
    const { setNodeRef, isOver } = useDroppable({
        id: `status-${status}`,
        data: { type: 'status' as const, status }
    });

    return (
        <section
            ref={setNodeRef}
            className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all ${
                isOver ? 'drop-zone-highlight' :
                isActive ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-800/30 border-slate-800/50'
            }`}
        >
            {/* Row Header */}
            <div className={`p-3 sm:p-4 border-b border-slate-700/50 flex items-center gap-2 sm:gap-3 ${color} bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10`}>
                <Icon size={18} className="sm:w-5 sm:h-5" />
                <h3 className="font-bold text-slate-200 text-sm sm:text-base">{title}</h3>
                <span className="ml-auto bg-slate-900/80 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700/50 font-medium">{columnBooks.length}</span>
            </div>

            {/* Row Content */}
            <div className={`p-3 grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : ''} gap-3 content-start`}>
                {columnBooks.length === 0 && (
                    <div className="h-32 col-span-full flex items-center justify-center text-slate-600 text-sm italic border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 m-2">
                        Arraste livros aqui
                    </div>
                )}
                {columnBooks.map(book => (
                    <DraggableBookCard
                        key={book.id}
                        book={book}
                        viewMode={viewMode}
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
        </section>
    );
};

interface DashboardViewProps {
    books: IBook[];
    viewMode: 'grid' | 'list';
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
}

const DashboardView: React.FC<DashboardViewProps> = React.memo(({ books, viewMode, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan }) => {

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

    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {COLUMNS.map(({ title, status, Icon, color }) => (
                <DroppableColumn
                    key={status}
                    title={title}
                    status={status}
                    Icon={Icon}
                    color={color}
                    books={booksByStatus[status]}
                    viewMode={viewMode}
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
    );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
