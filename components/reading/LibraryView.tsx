import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Book as IBook, Folder as IFolder } from '../../types';
import DraggableBookCard from './DraggableBookCard';
import { Library, CornerUpLeft, FolderPlus, Trash2, Folder } from 'lucide-react';

const DroppableBreadcrumb: React.FC<{
    id: string;
    label: string;
    isCurrent: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
}> = ({ id, label, isCurrent, onClick, icon }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `breadcrumb-${id}`,
        data: { type: 'folder' as const, folderId: id === 'root' ? null : id }
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onClick}
            className={`hover:text-white flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                isOver ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50' :
                isCurrent ? 'text-white font-bold' : 'text-slate-400 hover:bg-slate-700'
            }`}
        >
            {icon}
            {label}
        </button>
    );
};

const DroppableFolder: React.FC<{
    folder: IFolder;
    onNavigate: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ folder, onNavigate, onDelete }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: 'folder' as const, folderId: folder.id }
    });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onNavigate(folder.id)}
            className={`bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border cursor-pointer group transition-all flex flex-col items-center text-center gap-3 relative animate-in zoom-in-95 ${
                isOver ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 scale-105' : 'border-slate-700 hover:border-indigo-500/50'
            }`}
        >
            <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900"><Trash2 size={12} /></button>
            </div>
            <Folder size={40} className={`fill-indigo-400/10 group-hover:scale-110 transition-transform ${isOver ? 'text-indigo-300 scale-110' : 'text-indigo-400'}`} />
            <span className="text-sm font-medium text-slate-200 truncate w-full">{folder.name}</span>
        </div>
    );
};

interface LibraryViewProps {
    books: IBook[];
    folders: IFolder[];
    currentFolderId: string | null;
    viewMode: 'grid' | 'list';
    onNavigate: (id: string | null) => void;
    onCreateFolder: () => void;
    onDeleteFolder: (id: string) => void;
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
    breadcrumbs: IFolder[];
}

const LibraryView: React.FC<LibraryViewProps> = React.memo(({ books, folders, currentFolderId, viewMode, onNavigate, onCreateFolder, onDeleteFolder, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan, breadcrumbs }) => {

    const currentFolders = folders.filter(f => f.parentId === currentFolderId);
    const currentBooks = books.filter(b => b.folderId === currentFolderId);

    return (
        <div className="space-y-6 min-h-[500px]">
            {/* Navigation Bar */}
            <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm overflow-x-auto scrollbar-thin">
                <DroppableBreadcrumb id="root" label="Biblioteca" isCurrent={currentFolderId === null} onClick={() => onNavigate(null)} icon={<Library size={16} />} />
                {breadcrumbs.map(f => (
                    <React.Fragment key={f.id}>
                        <span className="text-slate-600">/</span>
                        <DroppableBreadcrumb
                            id={f.id}
                            label={f.name}
                            isCurrent={f.id === currentFolderId}
                            onClick={() => onNavigate(f.id)}
                        />
                    </React.Fragment>
                ))}

                <div className="ml-auto flex gap-2 shrink-0">
                    {currentFolderId && (
                        <button
                            onClick={() => onNavigate(breadcrumbs[breadcrumbs.length - 2]?.id || null)}
                            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-700 rounded"
                            title="Voltar nível"
                        >
                            <CornerUpLeft size={16} />
                        </button>
                    )}
                    <button onClick={onCreateFolder} className="text-indigo-400 hover:text-white p-1.5 hover:bg-indigo-600/20 rounded" title="Nova Pasta">
                        <FolderPlus size={16} />
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">

                {/* Folders */}
                {currentFolders.map(folder => (
                    <DroppableFolder
                        key={folder.id}
                        folder={folder}
                        onNavigate={onNavigate}
                        onDelete={onDeleteFolder}
                    />
                ))}

                {/* Books */}
                {currentBooks.map(book => (
                    <div key={book.id} className={viewMode === 'list' ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5' : ''}>
                        <DraggableBookCard
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
                    </div>
                ))}
            </div>

            {currentFolders.length === 0 && currentBooks.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                    <div className="text-slate-600 mb-2">Pasta vazia</div>
                    <div className="text-xs text-slate-500">Arraste livros para cá ou crie novos.</div>
                </div>
            )}
        </div>
    );
});

LibraryView.displayName = 'LibraryView';

export default LibraryView;
