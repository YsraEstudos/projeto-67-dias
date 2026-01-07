import React from 'react';
import { Book as IBook, Folder as IFolder } from '../../types';
import DraggableBookCard from './DraggableBookCard';
import { Library, CornerUpLeft, FolderPlus, Trash2, Folder } from 'lucide-react';

interface LibraryViewProps {
    books: IBook[];
    folders: IFolder[];
    currentFolderId: string | null;
    viewMode: 'grid' | 'list';
    onNavigate: (id: string | null) => void;
    onCreateFolder: () => void;
    onDeleteFolder: (id: string) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDropOnFolder: (e: React.DragEvent, folderId: string | null) => void;
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
    breadcrumbs: IFolder[];
}

const LibraryView: React.FC<LibraryViewProps> = React.memo(({ books, folders, currentFolderId, viewMode, onNavigate, onCreateFolder, onDeleteFolder, onDragStart, onDropOnFolder, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan, breadcrumbs }) => {

    const currentFolders = folders.filter(f => f.parentId === currentFolderId);
    const currentBooks = books.filter(b => b.folderId === currentFolderId);

    return (
        <div className="space-y-6 min-h-[500px]">
            {/* Navigation Bar */}
            <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm overflow-x-auto scrollbar-thin">
                <button
                    onClick={() => onNavigate(null)}
                    className={`hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition-colors ${currentFolderId === null ? 'text-white font-bold' : 'text-slate-400'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropOnFolder(e, null)}
                >
                    <Library size={16} /> Biblioteca
                </button>
                {breadcrumbs.map(f => (
                    <React.Fragment key={f.id}>
                        <span className="text-slate-600">/</span>
                        <button
                            onClick={() => onNavigate(f.id)}
                            className={`hover:text-white whitespace-nowrap px-2 py-1 rounded hover:bg-slate-700 transition-colors ${f.id === currentFolderId ? 'text-white font-bold' : 'text-slate-400'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDropOnFolder(e, f.id)}
                        >
                            {f.name}
                        </button>
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
                    <div
                        key={folder.id}
                        onClick={() => onNavigate(folder.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOnFolder(e, folder.id)}
                        className="bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border border-slate-700 cursor-pointer group hover:border-indigo-500/50 transition-all flex flex-col items-center text-center gap-3 relative animate-in zoom-in-95"
                    >
                        <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900"><Trash2 size={12} /></button>
                        </div>
                        <Folder size={40} className="text-indigo-400 fill-indigo-400/10 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-slate-200 truncate w-full">{folder.name}</span>
                    </div>
                ))}

                {/* Books */}
                {currentBooks.map(book => (
                    <div key={book.id} className={viewMode === 'list' ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5' : ''}>
                        <DraggableBookCard
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
