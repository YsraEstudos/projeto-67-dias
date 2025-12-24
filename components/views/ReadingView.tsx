import React, { useState, Suspense, useCallback, useMemo } from 'react';
import { useReadingStore } from '../../stores/readingStore';
import { useConfigStore } from '../../stores/configStore';
import { useShallow } from 'zustand/react/shallow';
import { Book as IBook, Folder as IFolder } from '../../types';
import { LayoutGrid, List as ListIcon, Loader2, Plus } from 'lucide-react';

// Components
import ReadingGoalSidebar from '../reading/ReadingGoalSidebar';
import DashboardView from '../reading/DashboardView';
import LibraryView from '../reading/LibraryView';
import { LoadingSimple as Loading } from '../shared/Loading';
import { ModuleOffensiveBar } from '../shared/ModuleOffensiveBar';
import { calculateReadingProgress } from '../../utils/dailyOffensiveUtils';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';

// Lazy Modals
const BookDetailsModal = React.lazy(() => import('../reading/modals/BookDetailsModal'));
const AddBookModal = React.lazy(() => import('../reading/modals/AddBookModal'));
const AIAddBookModal = React.lazy(() => import('../reading/modals/AIAddBookModal'));
const EditBookModal = React.lazy(() => import('../reading/modals/EditBookModal'));
const MoveBookModal = React.lazy(() => import('../reading/modals/MoveBookModal'));
const ReadingDailyPlanModal = React.lazy(() => import('../reading/ReadingDailyPlanModal'));

// Actions são estáveis - obtidas fora do componente para evitar subscriptions desnecessárias
const getReadingActions = () => useReadingStore.getState();

const ReadingView: React.FC = () => {
  // Dados reactivos com shallow comparison (1 subscription em vez de 10)
  const { books, folders } = useReadingStore(
    useShallow((state) => ({ books: state.books, folders: state.folders }))
  );

  // Actions estáveis - referenciadas diretamente
  const { addBook, updateBook, deleteBook: removeBook, addFolder, deleteFolder: removeFolder,
    updateProgress, setBookStatus, moveBookToFolder } = useMemo(() => getReadingActions(), []);

  const config = useConfigStore((state) => state.config);
  const offensiveConfig = config.offensiveGoals || DEFAULT_OFFENSIVE_GOALS;

  // Cálculo de progresso de ofensiva para Leitura
  const readingProgress = useMemo(() => calculateReadingProgress(books), [books]);
  const readingOffensive = readingProgress >= offensiveConfig.minimumPercentage;
  const showReadingOffensiveBar = offensiveConfig.enabledModules?.reading ?? true;

  // Local State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Modals State
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [movingBook, setMovingBook] = useState<IBook | null>(null);
  const [planningBook, setPlanningBook] = useState<IBook | null>(null);

  // Handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('bookId', id);
  }, []);

  const handleDropOnStatus = useCallback((e: React.DragEvent, status: IBook['status']) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) setBookStatus(bookId, status);
  }, [setBookStatus]);

  const handleDropOnFolder = useCallback((e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) moveBookToFolder(bookId, folderId);
  }, [moveBookToFolder]);

  // Handler que converte delta -> valor absoluto para o store
  const handleUpdateProgress = useCallback((id: string, delta: number) => {
    const book = books.find(b => b.id === id);
    if (book) {
      const newProgress = Math.max(0, Math.min(book.total, book.current + delta));
      updateProgress(id, newProgress);
    }
  }, [books, updateProgress]);

  // Folder Logic
  const handleCreateFolder = useCallback(() => {
    const name = prompt("Nome da nova pasta:");
    if (name) addFolder({ id: Date.now().toString(), name, parentId: currentFolderId, createdAt: new Date() });
  }, [addFolder, currentFolderId]);

  const handleDeleteFolder = useCallback((id: string) => {
    if (confirm('Tem certeza? Livros dentro da pasta serão movidos para o nível superior.')) {
      removeFolder(id);
    }
  }, [removeFolder]);

  // Breadcrumbs
  const getBreadcrumbs = useCallback((folderId: string | null): IFolder[] => {
    if (!folderId) return [];
    const folder = folders.find(f => f.id === folderId);
    return folder ? [...getBreadcrumbs(folder.parentId || null), folder] : [];
  }, [folders]);

  const breadcrumbs = getBreadcrumbs(currentFolderId);

  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-y-auto scrollbar-thin">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Leitura & Estudos</h1>
          <p className="text-slate-400">Gerencie seus livros, acompanhe o progresso e atinja metas.</p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Biblioteca
          </button>
        </div>
      </div>

      <ReadingGoalSidebar books={books} projectConfig={config} />

      {/* Barra de Ofensiva de Leitura */}
      {showReadingOffensiveBar && (
        <ModuleOffensiveBar
          progress={readingProgress}
          isOffensive={readingOffensive}
          label="Ofensiva de Leitura"
          accentColor="yellow"
        />
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <LayoutGrid size={20} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <ListIcon size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAIModalOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2">
            ✨ IA
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2">
            <Plus size={20} /> Novo Livro
          </button>
        </div>
      </div>

      {/* Helper para renderizar modais com Suspense */}
      <Suspense fallback={<div className="fixed bottom-4 right-4 bg-slate-800 p-2 rounded-full shadow-lg"><Loader2 className="animate-spin text-white" /></div>}>
        {selectedBook && (
          <BookDetailsModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onEdit={() => { setSelectedBook(null); setEditingBook(selectedBook); }}
          />
        )}
        {isAddModalOpen && (
          <AddBookModal
            onClose={() => setIsAddModalOpen(false)}
            onAdd={addBook}
            currentFolderId={currentFolderId}
          />
        )}
        {isAIModalOpen && (
          <AIAddBookModal
            onClose={() => setIsAIModalOpen(false)}
            onAdd={addBook}
            currentFolderId={currentFolderId}
          />
        )}
        {editingBook && (
          <EditBookModal
            book={editingBook}
            onClose={() => setEditingBook(null)}
            onSave={(b) => { updateBook(b.id, b); setEditingBook(null); }}
          />
        )}
        {movingBook && (
          <MoveBookModal
            book={movingBook}
            folders={folders}
            onClose={() => setMovingBook(null)}
            onMove={(bookId, folderId) => { moveBookToFolder(bookId, folderId); setMovingBook(null); }}
          />
        )}
        {planningBook && (
          <ReadingDailyPlanModal
            book={planningBook}
            onClose={() => setPlanningBook(null)}
          />
        )}
      </Suspense>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'dashboard' ? (
          <DashboardView
            books={books}
            viewMode={viewMode}
            onDragStart={handleDragStart}
            onDropOnStatus={handleDropOnStatus}
            onUpdateProgress={handleUpdateProgress}
            onUpdateStatus={setBookStatus}
            onEdit={setEditingBook}
            onDelete={removeBook}
            onMove={setMovingBook}
            onSelect={setSelectedBook}
            onPlan={setPlanningBook}
          />
        ) : (
          <LibraryView
            books={books}
            folders={folders}
            currentFolderId={currentFolderId}
            viewMode={viewMode}
            breadcrumbs={breadcrumbs}
            onNavigate={setCurrentFolderId}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onDragStart={handleDragStart}
            onDropOnFolder={handleDropOnFolder}
            onUpdateProgress={handleUpdateProgress}
            onUpdateStatus={setBookStatus}
            onEdit={setEditingBook}
            onDelete={removeBook}
            onMove={setMovingBook}
            onSelect={setSelectedBook}
            onPlan={setPlanningBook}
          />
        )}
      </div>

    </div>
  );
};

export default ReadingView;