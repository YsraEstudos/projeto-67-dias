import React, { useState, useEffect } from 'react';
import {
  BookOpen, Library, Plus, Search, Star,
  TrendingUp, CheckCircle2, X,
  MoreVertical, Trash2, Book, PauseCircle,
  Folder, FolderPlus, Play, LayoutGrid, List, Edit2, Move,
  CornerUpLeft, Save, ArrowLeft, StickyNote, Calendar
} from 'lucide-react';
import { Book as IBook, Folder as IFolder } from '../types';
import { useStorage } from '../../hooks/useStorage';

// --- MOCK DATA ---

const INITIAL_FOLDERS: IFolder[] = [
  { id: 'f1', name: 'Mangas', parentId: null, createdAt: new Date() },
  { id: 'f2', name: 'Desenvolvimento', parentId: null, createdAt: new Date() },
];

const INITIAL_BOOKS: IBook[] = [
  {
    id: '1',
    title: "Hábitos Atômicos",
    author: "James Clear",
    genre: "Produtividade",
    total: 320,
    current: 145,
    unit: 'PAGES',
    status: 'READING',
    rating: 0,
    notes: "Conceito de empilhamento de hábitos é fundamental. \n\nPreciso aplicar a regra dos 2 minutos para tarefas domésticas.",
    folderId: 'f2',
    addedAt: new Date(),
    coverUrl: "https://m.media-amazon.com/images/I/81kibw9y6bL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    id: '2',
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Tecnologia",
    total: 464,
    current: 464,
    unit: 'PAGES',
    status: 'COMPLETED',
    rating: 5,
    notes: "Leitura obrigatória. A parte sobre nomes significativos mudou minha forma de codar.",
    folderId: 'f2',
    addedAt: new Date()
  },
  {
    id: '3',
    title: "One Piece",
    author: "Eiichiro Oda",
    genre: "Manga",
    total: 1100,
    current: 1050,
    unit: 'CHAPTERS',
    status: 'READING',
    rating: 5,
    notes: "",
    folderId: 'f1',
    addedAt: new Date(),
    coverUrl: "https://upload.wikimedia.org/wikipedia/pt/8/80/One_Piece_Vol._1.jpg"
  }
];

// --- HELPER COMPONENTS ---

const ProgressBar: React.FC<{ current: number; total: number; colorClass?: string }> = ({ current, total, colorClass = "bg-indigo-500" }) => {
  const percentage = Math.min(100, Math.round((current / (total || 1)) * 100));
  return (
    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
      <div className={`${colorClass} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
    </div>
  );
};

// --- DETAILS MODAL ---

const BookDetailsModal: React.FC<{
  book: IBook;
  onClose: () => void;
  onEdit: () => void;
}> = ({ book, onClose, onEdit }) => {
  const percentage = Math.round((book.current / (book.total || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER WITH BLURRED BACKDROP */}
        <div className="relative h-48 sm:h-56 bg-slate-800 flex-shrink-0">
          {/* Backdrop Image */}
          {book.coverUrl && (
            <div className="absolute inset-0 overflow-hidden">
              <img src={book.coverUrl} alt="" className="w-full h-full object-cover opacity-30 blur-xl scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="absolute -bottom-12 left-6 sm:left-8 flex items-end gap-6 w-full pr-6">
            {/* Cover Card */}
            <div className="w-32 h-48 sm:w-40 sm:h-60 bg-slate-800 rounded-lg shadow-2xl shadow-black/50 border-4 border-slate-900 overflow-hidden flex-shrink-0 relative z-10">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800"><Book size={48} /></div>
              )}
            </div>

            {/* Title Info (Desktop) */}
            <div className="hidden sm:block pb-14 text-shadow-sm flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                  {book.genre || 'Geral'}
                </span>
                {book.status === 'COMPLETED' && <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">Lido</span>}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight truncate" title={book.title}>{book.title}</h2>
              <p className="text-slate-300 font-medium">{book.author}</p>
            </div>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto pt-16 px-6 sm:px-8 pb-8 scrollbar-thin">
          {/* Title Info (Mobile) */}
          <div className="block sm:hidden mb-6">
            <h2 className="text-xl font-bold text-white leading-tight">{book.title}</h2>
            <p className="text-slate-400">{book.author}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Stats & Details */}
            <div className="space-y-6">
              {/* Progress Section */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Progresso Atual</span>
                    <div className="text-2xl font-bold text-white mt-0.5">
                      {percentage}% <span className="text-sm text-slate-500 font-normal">concluído</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-indigo-400 font-mono">{book.current}</span>
                    <span className="text-xs text-slate-600"> / {book.total}</span>
                  </div>
                </div>
                <ProgressBar current={book.current} total={book.total} />
                <div className="mt-3 flex gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"><BookOpen size={12} /> {book.unit === 'PAGES' ? 'Páginas' : 'Capítulos'}</span>
                  {book.addedAt && (
                    <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"><Calendar size={12} /> Adicionado em {new Date(book.addedAt).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>

              {/* Rating if exists */}
              {book.rating > 0 && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= book.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                    />
                  ))}
                  <span className="text-sm text-slate-500 ml-2">Avaliação Pessoal</span>
                </div>
              )}
            </div>

            {/* Right Column: Notes */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <StickyNote size={16} /> Minhas Anotações
              </h3>
              <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 relative group min-h-[150px]">
                {book.notes ? (
                  <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                    {book.notes}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-sm">
                    <StickyNote size={24} className="mb-2 opacity-50" />
                    Nenhuma anotação ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
          >
            <Edit2 size={18} /> Editar / Adicionar Notas
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-900/20"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

// --- MAIN VIEW ---

const ReadingView: React.FC = () => {
  // State with Hooks
  const [books, setBooks] = useStorage<IBook[]>('p67_books', INITIAL_BOOKS);
  const [folders, setFolders] = useStorage<IFolder[]>('p67_folders', INITIAL_FOLDERS);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'library'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [movingBook, setMovingBook] = useState<IBook | null>(null);

  // --- ACTIONS ---

  const handleDragStart = (e: React.DragEvent, bookId: string) => {
    e.dataTransfer.setData('bookId', bookId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnStatus = (e: React.DragEvent, newStatus: IBook['status']) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: newStatus } : b));
    }
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, folderId: targetFolderId } : b));
    }
  };

  const updateProgress = (id: string, delta: number) => {
    setBooks(prev => prev.map(book => {
      if (book.id !== id) return book;
      const newCurrent = Math.max(0, Math.min(book.total, book.current + delta));

      // Auto-complete check
      let newStatus = book.status;
      if (newCurrent >= book.total && book.status === 'READING') newStatus = 'COMPLETED';

      return { ...book, current: newCurrent, status: newStatus };
    }));
  };

  const updateStatus = (id: string, newStatus: IBook['status']) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const deleteBook = (id: string) => {
    if (confirm('Tem certeza que deseja remover este livro?')) {
      setBooks(prev => prev.filter(b => b.id !== id));
      if (selectedBook?.id === id) setSelectedBook(null);
    }
  };

  const saveBook = (book: IBook) => {
    if (books.some(b => b.id === book.id)) {
      setBooks(prev => prev.map(b => b.id === book.id ? book : b));
      if (selectedBook?.id === book.id) setSelectedBook(book);
    } else {
      setBooks(prev => [...prev, book]);
    }
    setEditingBook(null);
    setIsAddModalOpen(false);
  };

  const createFolder = () => {
    const name = prompt("Nome da nova pasta:");
    if (!name) return;

    const newFolder: IFolder = {
      id: Date.now().toString(),
      name,
      parentId: currentFolderId,
      createdAt: new Date()
    };
    setFolders([...folders, newFolder]);
  };

  const deleteFolder = (id: string) => {
    if (!confirm('Excluir pasta? Os livros dentro dela serão movidos para o nível superior.')) return;

    const folderToDelete = folders.find(f => f.id === id);
    if (!folderToDelete) return;

    const parentId = folderToDelete.parentId;
    setBooks(prev => prev.map(b => b.folderId === id ? { ...b, folderId: parentId } : b));
    setFolders(prev => prev.map(f => f.parentId === id ? { ...f, parentId: parentId } : f).filter(f => f.id !== id));
  };

  const getBreadcrumbs = () => {
    const path = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current.parentId);
    }
    return path;
  };

  const moveBookDirectly = (bookId: string, folderId: string | null) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, folderId } : b));
    setMovingBook(null);
  };

  return (
    <div className="pb-20 animate-in fade-in duration-500 relative">

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">

        {/* TABS */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={18} /> Objetivos
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Library size={18} /> Biblioteca
          </button>
        </div>

        {/* VIEW OPTIONS */}
        <div className="flex items-center gap-3 ml-auto w-full lg:w-auto justify-end">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Visualização Grade"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Visualização Lista"
            >
              <List size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo Livro</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === 'dashboard' ? (
        <DashboardView
          books={books}
          viewMode={viewMode}
          onDragStart={handleDragStart}
          onDropOnStatus={handleDropOnStatus}
          onUpdateProgress={updateProgress}
          onUpdateStatus={updateStatus}
          onEdit={(b) => setEditingBook(b)}
          onDelete={deleteBook}
          onMove={(b) => setMovingBook(b)}
          onSelect={(b) => setSelectedBook(b)}
        />
      ) : (
        <LibraryView
          books={books}
          folders={folders}
          currentFolderId={currentFolderId}
          viewMode={viewMode}
          onNavigate={setCurrentFolderId}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onDragStart={handleDragStart}
          onDropOnFolder={handleDropOnFolder}
          onUpdateProgress={updateProgress}
          onUpdateStatus={updateStatus}
          onEdit={(b) => setEditingBook(b)}
          onDelete={deleteBook}
          onMove={(b) => setMovingBook(b)}
          onSelect={(b) => setSelectedBook(b)}
          breadcrumbs={getBreadcrumbs()}
        />
      )}

      {/* MODALS */}
      {isAddModalOpen && (
        <AddBookModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={saveBook}
          currentFolderId={currentFolderId}
        />
      )}

      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={saveBook}
        />
      )}

      {movingBook && (
        <MoveBookModal
          book={movingBook}
          folders={folders}
          onClose={() => setMovingBook(null)}
          onMove={moveBookDirectly}
        />
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={() => {
            setSelectedBook(null);
            setEditingBook(selectedBook);
          }}
        />
      )}
    </div>
  );
};

// --- DASHBOARD: KANBAN STATUS ---

const DashboardView: React.FC<{
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
}> = ({ books, viewMode, onDragStart, onDropOnStatus, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect }) => {

  const renderColumn = (title: string, status: IBook['status'], icon: any, color: string) => {
    const columnBooks = books.filter(b => b.status === status);

    return (
      <div
        className="flex flex-col h-full min-h-[400px] bg-slate-800/30 rounded-2xl border border-slate-800/50 overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDropOnStatus(e, status)}
      >
        {/* Column Header */}
        <div className={`p-4 border-b border-slate-700/50 flex items-center gap-3 ${color} bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10`}>
          {icon}
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
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full">
      {renderColumn("Lendo", 'READING', <BookOpen size={20} />, "text-indigo-400")}
      {renderColumn("Para Ler", 'TO_READ', <Library size={20} />, "text-sky-400")}
      {renderColumn("Pausados", 'PAUSED', <PauseCircle size={20} />, "text-orange-400")}
      {renderColumn("Concluídos", 'COMPLETED', <CheckCircle2 size={20} />, "text-green-400")}
    </div>
  );
};

// --- LIBRARY: FOLDERS & FILES ---

const LibraryView: React.FC<{
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
  breadcrumbs: IFolder[];
}> = ({ books, folders, currentFolderId, viewMode, onNavigate, onCreateFolder, onDeleteFolder, onDragStart, onDropOnFolder, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, breadcrumbs }) => {

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

        {/* Folders */}
        {currentFolders.map(folder => (
          <div
            key={folder.id}
            onClick={() => onNavigate(folder.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropOnFolder(e, folder.id)}
            className="bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border border-slate-700 cursor-pointer group hover:border-indigo-500/50 transition-all flex flex-col items-center text-center gap-3 relative animate-in zoom-in-95"
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
};

// --- DRAGGABLE CARD ---

const DraggableBookCard: React.FC<{
  book: IBook;
  viewMode: 'grid' | 'list';
  onDragStart: (e: React.DragEvent, id: string) => void;
  onUpdateProgress: (id: string, d: number) => void;
  onUpdateStatus: (id: string, s: IBook['status']) => void;
  onEdit: (b: IBook) => void;
  onDelete: (id: string) => void;
  onMove: (b: IBook) => void;
  onSelect: (b: IBook) => void;
}> = ({ book, viewMode, onDragStart, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect }) => {

  const isGrid = viewMode === 'grid';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, book.id)}
      onClick={() => onSelect(book)}
      className={`group relative bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl overflow-hidden shadow-md transition-all hover:-translate-y-1 cursor-pointer active:cursor-grabbing flex ${isGrid ? 'flex-col' : 'flex-row h-32 items-center'}`}
    >
      {/* Cover */}
      <div className={`bg-slate-900 flex-shrink-0 overflow-hidden relative ${isGrid ? 'aspect-[2/3] w-full border-b border-slate-700/50' : 'h-full aspect-[2/3] border-r border-slate-700/50'}`}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800"><Book size={isGrid ? 32 : 24} /></div>
        )}

        {/* Status Badge */}
        <div className="absolute top-1 left-1">
          {book.status === 'READING' && <div className="bg-indigo-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-indigo-400/20">LENDO</div>}
          {book.status === 'PAUSED' && <div className="bg-orange-500/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-orange-400/20">PAUSA</div>}
          {book.status === 'COMPLETED' && <div className="bg-emerald-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-emerald-400/20">LIDO</div>}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-3 flex flex-col min-w-0 ${isGrid ? '' : 'h-full justify-between'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className={`font-bold text-slate-200 leading-tight truncate mb-0.5 ${isGrid ? 'text-sm' : 'text-base'}`} title={book.title}>{book.title}</h4>
            <p className="text-xs text-slate-500 truncate">{book.author}</p>
          </div>

          {/* 3 Dots Menu */}
          <div className="relative group/menu shrink-0" onClick={e => e.stopPropagation()}>
            <button className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700"><MoreVertical size={16} /></button>
            <div className="absolute right-0 top-full w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1 hidden group-hover/menu:block z-20">
              <button onClick={() => onEdit(book)} className="w-full text-left px-2 py-2 text-xs hover:bg-slate-800 text-slate-300 flex items-center gap-2 rounded"><Edit2 size={12} /> Editar</button>
              <button onClick={() => onMove(book)} className="w-full text-left px-2 py-2 text-xs hover:bg-slate-800 text-slate-300 flex items-center gap-2 rounded"><Move size={12} /> Mover</button>
              <div className="h-px bg-slate-800 my-1"></div>
              <button onClick={() => onDelete(book.id)} className="w-full text-left px-2 py-2 text-xs hover:bg-red-900/20 text-red-400 flex items-center gap-2 rounded"><Trash2 size={12} /> Remover</button>
            </div>
          </div>
        </div>

        {/* Front Controls */}
        <div className={`mt-auto ${isGrid ? 'pt-3' : 'w-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5">
            <span>{book.current} / {book.total} {book.unit === 'PAGES' ? 'pág' : 'cap'}</span>
            <span>{Math.round((book.current / (book.total || 1)) * 100)}%</span>
          </div>
          <ProgressBar current={book.current} total={book.total} />

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3">
            {book.status === 'TO_READ' && (
              <button
                onClick={() => onUpdateStatus(book.id, 'READING')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs font-medium flex justify-center items-center gap-1 transition-colors"
              >
                <Play size={12} fill="currentColor" /> Ler Agora
              </button>
            )}

            {(book.status === 'READING' || book.status === 'PAUSED') && (
              <>
                {book.status === 'READING' ? (
                  <button onClick={() => onUpdateStatus(book.id, 'PAUSED')} className="p-1.5 bg-slate-700 hover:bg-orange-500/20 text-slate-300 hover:text-orange-500 rounded transition-colors" title="Pausar">
                    <PauseCircle size={16} />
                  </button>
                ) : (
                  <button onClick={() => onUpdateStatus(book.id, 'READING')} className="p-1.5 bg-slate-700 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded transition-colors" title="Retomar">
                    <Play size={16} />
                  </button>
                )}

                {/* Stepper */}
                <div className="flex-1 flex items-center bg-slate-900 rounded border border-slate-700/50 h-7 overflow-hidden">
                  <button onClick={() => onUpdateProgress(book.id, -1)} className="px-2 h-full hover:bg-slate-700 text-slate-400 hover:text-white border-r border-slate-800 text-xs">-</button>
                  <input
                    type="number"
                    className="w-full bg-transparent text-center text-xs text-white focus:outline-none appearance-none"
                    value={book.current}
                    onChange={(e) => onUpdateProgress(book.id, Number(e.target.value) - book.current)}
                  />
                  <button onClick={() => onUpdateProgress(book.id, 1)} className="px-2 h-full hover:bg-slate-700 text-slate-400 hover:text-white border-l border-slate-800 text-xs">+</button>
                </div>

                <button onClick={() => onUpdateStatus(book.id, 'COMPLETED')} className="p-1.5 bg-slate-700 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded transition-colors" title="Concluir">
                  <CheckCircle2 size={16} />
                </button>
              </>
            )}

            {book.status === 'COMPLETED' && (
              <button onClick={() => onUpdateStatus(book.id, 'READING')} className="w-full py-1.5 text-xs text-slate-500 hover:text-indigo-400 font-medium flex items-center justify-center gap-1 bg-slate-900 rounded hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all">
                Ler Novamente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MOVE MODAL ---
const MoveBookModal: React.FC<{
  book: IBook;
  folders: IFolder[];
  onClose: () => void;
  onMove: (bookId: string, folderId: string | null) => void;
}> = ({ book, folders, onClose, onMove }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white">Mover "{book.title}"</h3>
        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
      </div>
      <div className="p-2 max-h-[60vh] overflow-y-auto">
        <button
          onClick={() => onMove(book.id, null)}
          className="w-full text-left p-3 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-200 transition-colors"
        >
          <Library size={16} /> Raiz (Biblioteca)
        </button>
        {folders.map(f => (
          <button
            key={f.id}
            onClick={() => onMove(book.id, f.id)}
            className="w-full text-left p-3 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-200 transition-colors"
          >
            <Folder size={16} className="text-indigo-400" /> {f.name}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// --- EDIT / ADD FORM COMPONENT (REUSABLE) ---

const BookForm: React.FC<{
  initialData: Partial<IBook>;
  onSave: (data: any) => void;
  onCancel: () => void;
  saveLabel?: string;
}> = ({ initialData, onSave, onCancel, saveLabel = "Salvar" }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    author: initialData.author || '',
    genre: initialData.genre || '',
    total: initialData.total || 0,
    current: initialData.current || 0,
    unit: initialData.unit || 'PAGES',
    coverUrl: initialData.coverUrl || '',
    notes: initialData.notes || ''
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
        <div>
          <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Título</label>
          <input
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
            placeholder="Ex: O Hobbit"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Autor</label>
            <input
              value={formData.author}
              onChange={e => setFormData({ ...formData, author: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              placeholder="J.R.R. Tolkien"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Gênero</label>
            <input
              value={formData.genre}
              onChange={e => setFormData({ ...formData, genre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              placeholder="Fantasia"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
          <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2"><TrendingUp size={16} /> Progresso</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Unidade</label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
              >
                <option value="PAGES">Páginas</option>
                <option value="CHAPTERS">Capítulos</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Atual</label>
              <input
                type="number"
                value={formData.current}
                onChange={e => setFormData({ ...formData, current: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Total</label>
              <input
                type="number"
                value={formData.total}
                onChange={e => setFormData({ ...formData, total: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase font-bold mb-1">URL da Capa</label>
          <div className="flex gap-2">
            <input
              value={formData.coverUrl || ''}
              onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
              placeholder="https://..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none text-sm"
            />
            {formData.coverUrl && <img src={formData.coverUrl} alt="Preview" className="h-10 w-10 object-cover rounded border border-slate-600" />}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Notas</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm h-24 resize-none"
            placeholder="Suas anotações..."
          />
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
        <button onClick={() => onSave(formData)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
          <Save size={18} /> {saveLabel}
        </button>
      </div>
    </div>
  );
}

// --- EDIT MODAL ---

const EditBookModal: React.FC<{
  book: IBook;
  onClose: () => void;
  onSave: (b: IBook) => void;
}> = ({ book, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-indigo-400" /> Editar Informações</h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>
        <BookForm
          initialData={book}
          onCancel={onClose}
          onSave={(data) => onSave({ ...book, ...data })}
        />
      </div>
    </div>
  );
}

// --- ADD MODAL ---

const AddBookModal: React.FC<{
  onClose: () => void;
  onAdd: (b: IBook) => void;
  currentFolderId: string | null;
}> = ({ onClose, onAdd, currentFolderId }) => {
  const [mode, setMode] = useState<'MANUAL' | 'GOOGLE' | 'JIKAN'>('MANUAL');
  const [step, setStep] = useState<'SEARCH' | 'EDIT'>('SEARCH');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tempData, setTempData] = useState<Partial<IBook>>({});

  // Reset step when mode changes
  useEffect(() => {
    setStep(mode === 'MANUAL' ? 'EDIT' : 'SEARCH');
    setResults([]);
    setQuery('');
    setTempData({});
  }, [mode]);

  const searchApi = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const url = mode === 'GOOGLE'
        ? `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
        : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();
      setResults(mode === 'GOOGLE' ? (data.items || []) : (data.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSelect = (item: any) => {
    const isGoogle = mode === 'GOOGLE';

    const mappedData: Partial<IBook> = {
      title: isGoogle ? item.volumeInfo.title : item.title,
      author: isGoogle ? (item.volumeInfo.authors?.[0] || 'Desconhecido') : (item.authors?.[0]?.name || 'Mangaká'),
      genre: isGoogle ? (item.volumeInfo.categories?.[0] || 'Geral') : 'Manga',
      total: isGoogle ? (item.volumeInfo.pageCount || 0) : (item.chapters || 0),
      unit: isGoogle ? 'PAGES' : 'CHAPTERS',
      coverUrl: isGoogle ? item.volumeInfo.imageLinks?.thumbnail : item.images?.jpg?.image_url,
      current: 0,
    };

    setTempData(mappedData);
    setStep('EDIT'); // Move to edit step
  };

  const handleFinalSave = (data: any) => {
    onAdd({
      id: Date.now().toString(),
      ...data,
      status: 'TO_READ',
      rating: 0,
      notes: data.notes || '',
      folderId: currentFolderId,
      addedAt: new Date()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {step === 'EDIT' && mode !== 'MANUAL' && (
              <button onClick={() => setStep('SEARCH')} className="text-slate-400 hover:text-white p-1 -ml-2 rounded-full hover:bg-slate-700">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-white">Adicionar Novo Livro</h2>
          </div>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Mode Switcher - Only visible in search step */}
        {step === 'SEARCH' && (
          <div className="flex p-2 gap-2 bg-slate-900/50">
            {['MANUAL', 'GOOGLE', 'JIKAN'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {m === 'JIKAN' ? 'MANGA (Jikan)' : m === 'GOOGLE' ? 'LIVRO (Google)' : 'MANUAL'}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'SEARCH' ? (
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500" placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchApi()} />
                <button onClick={searchApi} className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-500"><Search /></button>
              </div>
              {loading && <div className="text-center text-slate-500 py-4">Buscando...</div>}
              <div className="space-y-2">
                {results.map((item, i) => {
                  const img = mode === 'GOOGLE' ? item.volumeInfo?.imageLinks?.smallThumbnail : item.images?.jpg?.image_url;
                  const title = mode === 'GOOGLE' ? item.volumeInfo.title : item.title;
                  const total = mode === 'GOOGLE' ? (item.volumeInfo.pageCount) : (item.chapters);
                  return (
                    <div key={i} onClick={() => handleSelect(item)} className="flex gap-3 p-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500 cursor-pointer hover:bg-slate-750 transition-colors">
                      <div className="w-12 h-16 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                        {img ? <img src={img} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Book size={16} className="text-slate-600" /></div>}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white line-clamp-1">{title}</div>
                        <div className="text-xs text-slate-500">{mode === 'GOOGLE' ? item.volumeInfo?.authors?.[0] : item.authors?.[0]?.name}</div>
                        <div className="text-xs text-indigo-400 mt-1">{total ? `${total} ${mode === 'JIKAN' ? 'capítulos' : 'páginas'}` : 'Total desconhecido'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <BookForm
              initialData={tempData}
              onSave={handleFinalSave}
              onCancel={onClose}
              saveLabel="Adicionar à Biblioteca"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingView;