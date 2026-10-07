import React, { useState, Suspense, useCallback, useMemo, useEffect } from 'react';
import { useReadingStore } from '../../stores/readingStore';
import { useShallow } from 'zustand/react/shallow';
import { Book as IBook, Folder as IFolder } from '../../types';
import { Loader2, Zap } from 'lucide-react';

// Shelf Editorial UI Components
import EditorialHeader, { ReadingCategoryFilter } from '../reading/shelf/EditorialHeader';
import ShelfNavigationHUD from '../reading/shelf/ShelfNavigationHUD';
import BookInspectionOverlay from '../reading/shelf/BookInspectionOverlay';
import CompleteShelfScene from '../reading/shelf/CompleteShelfScene';
import ShelfLevelRail from '../reading/shelf/ShelfLevelRail';
import { MINT_BOOK_MANIFEST } from '../reading/shelf/mintManifest';
import { buildShelfLayout, countBooksByShelfLevel } from '../../utils/readingShelfLayout';
import { getBookDimensions } from '../../utils/bookDimensions';
import { calculateReadingStreak, clampProgress } from '../reading/readingStats';

// Shared & Library View fallback
import LibraryView from '../reading/LibraryView';
import DashboardView from '../reading/DashboardView';

// Lazy Modals
const BookDetailsModal = React.lazy(() => import('../reading/modals/BookDetailsModal'));
const AddBookModal = React.lazy(() => import('../reading/modals/AddBookModal'));
const EditBookModal = React.lazy(() => import('../reading/modals/EditBookModal'));
const MoveBookModal = React.lazy(() => import('../reading/modals/MoveBookModal'));
const ReadingDailyPlanModal = React.lazy(() => import('../reading/ReadingDailyPlanModal'));
const QuickLogBottomSheet = React.lazy(() => import('../reading/modals/QuickLogBottomSheet'));

const getReadingActions = () => useReadingStore.getState();

interface ReadingViewProps {
  onExit?: () => void;
}

export function calculateBookDimensions(pages: number) {
  const dims = getBookDimensions(pages);
  return { pages, ...dims };
}

export const ReadingView: React.FC<ReadingViewProps> = ({ onExit }) => {
  // Store Subscription
  const { books, folders, shelfLevels } = useReadingStore(
    useShallow((state) => ({ books: state.books, folders: state.folders, shelfLevels: state.shelfLevels }))
  );

  const {
    addBook,
    updateBook,
    deleteBook: removeBook,
    addFolder,
    deleteFolder: removeFolder,
    updateProgress,
    setBookStatus,
    moveBookToFolder,
    addShelfLevel,
    updateShelfLevel,
    deleteShelfLevel,
    moveBookToShelfLevel,
  } = useMemo(() => getReadingActions(), []);

  // Filter & Navigation State
  const [activeCategory, setActiveCategory] = useState<ReadingCategoryFilter>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [activeShelfLevelId, setActiveShelfLevelId] = useState<string | null>(null);
  const [draggingBookId, setDraggingBookId] = useState<string | null>(null);
  const [dragTargetLevelId, setDragTargetLevelId] = useState<string | null>(null);

  // Modals State
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [movingBook, setMovingBook] = useState<IBook | null>(null);
  const [planningBook, setPlanningBook] = useState<IBook | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // 2D Library Folder State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Filtered Books List
  const filteredBooks = useMemo(() => {
    if (activeCategory === 'ALL') return books;
    return books.filter((b) => b.status === activeCategory);
  }, [books, activeCategory]);

  const shelfBookSignature = filteredBooks
    .map((book) => [book.id, book.title, book.author, book.coverUrl ?? '', book.total, book.genre, book.customColor ?? '', book.notes ?? ''].join('~'))
    .join('|');
  const shelfAssignmentSignature = filteredBooks
    .map((book) => [book.id, book.shelfLevelId ?? '', book.shelfPosition ?? ''].join('~'))
    .join('|');
  const shelfLevelLayoutSignature = shelfLevels.map((level) => `${level.id}:${level.position}`).join('|');

  const shelfItems = useMemo(() => {
    if (filteredBooks.length === 0) return MINT_BOOK_MANIFEST;
    return filteredBooks.map((book, index) => {
      const manifestTemplate = MINT_BOOK_MANIFEST[index % MINT_BOOK_MANIFEST.length];
      const pageCount = book.total || manifestTemplate.pages;
      const dims = calculateBookDimensions(pageCount);
      return {
        ...manifestTemplate,
        id: book.id,
        title: book.title || manifestTemplate.title,
        author: book.author || manifestTemplate.author,
        coverUrl: book.coverUrl || undefined,
        pages: dims.pages,
        height: dims.height,
        width: dims.width,
        thickness: dims.thickness,
        genre: book.genre || manifestTemplate.genre,
        customColor: book.customColor || undefined,
        notes: book.notes || '',
      };
    });
  }, [shelfBookSignature]);

  const shelfLayout = useMemo(() => {
    const booksById = new Map(filteredBooks.map((book) => [book.id, book]));
    const layoutBooks = shelfItems.map((item) => {
      const book = booksById.get(item.id);
      return {
        id: item.id,
        shelfLevelId: book?.shelfLevelId,
        shelfPosition: book?.shelfPosition,
        width: item.width,
        thickness: item.thickness,
        height: item.height,
      };
    });
    return buildShelfLayout(layoutBooks, shelfLevels);
  }, [shelfAssignmentSignature, shelfBookSignature, shelfItems, shelfLevelLayoutSignature, shelfLevels]);

  const shelfBookCounts = useMemo(() => countBooksByShelfLevel(filteredBooks, shelfLevels), [filteredBooks, shelfLevels]);

  // Keep selected index within bounds when filters change
  useEffect(() => {
    if (selectedIndex >= filteredBooks.length && filteredBooks.length > 0) {
      setSelectedIndex(filteredBooks.length - 1);
    }
  }, [filteredBooks.length, selectedIndex]);

  useEffect(() => {
    if (shelfLevels.length === 0) {
      setActiveShelfLevelId(null);
      return;
    }
    if (!activeShelfLevelId || !shelfLevels.some((level) => level.id === activeShelfLevelId)) {
      setActiveShelfLevelId(shelfLevels[0].id);
    }
  }, [activeShelfLevelId, shelfLevels]);

  const currentBook = useMemo(() => {
    if (filteredBooks.length === 0 || selectedIndex < 0 || selectedIndex >= filteredBooks.length) {
      return null;
    }
    return filteredBooks[selectedIndex];
  }, [filteredBooks, selectedIndex]);

  const readingStreakDays = useMemo(() => calculateReadingStreak(books), [books]);

  // Handlers
  const handleUpdateProgress = useCallback(
    (id: string, newCurrent: number) => {
      updateProgress(id, newCurrent);
    },
    [updateProgress]
  );

  const handleRelativeProgress = useCallback(
    (id: string, delta: number) => {
      const book = useReadingStore.getState().books.find((candidate) => candidate.id === id);
      if (book) updateProgress(id, clampProgress(book, delta));
    },
    [updateProgress]
  );

  // Edits that change `current` must go through updateProgress so the daily
  // log (streak/history) and auto-completion stay consistent.
  const handleSaveEditedBook = useCallback(
    (bookId: string, updates: Partial<IBook>) => {
      const existing = useReadingStore.getState().books.find((candidate) => candidate.id === bookId);
      const { current, ...rest } = updates;
      updateBook(bookId, rest);
      if (existing && typeof current === 'number' && current !== existing.current) {
        updateProgress(bookId, current);
      }
    },
    [updateBook, updateProgress]
  );

  const handlePrevBook = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextBook = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, Math.min(filteredBooks.length - 1, prev + 1)));
  }, [filteredBooks.length]);

  const handleToggleInspection = useCallback(() => {
    setIsInspecting((prev) => !prev);
  }, []);

  const handleOpenInspection = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsInspecting(true);
  }, []);

  const handleDragStateChange = useCallback((bookId: string | null, levelId: string | null) => {
    setDraggingBookId(bookId);
    setDragTargetLevelId(levelId);
  }, []);

  const handleMoveBookToShelfLevel = useCallback((bookId: string, levelId: string, position?: number) => {
    moveBookToShelfLevel(bookId, levelId, position);
  }, [moveBookToShelfLevel]);

  const updateShelfLevelName = useCallback((levelId: string, name: string) => {
    updateShelfLevel(levelId, { name });
  }, [updateShelfLevel]);

  const handleAddShelfLevel = useCallback(() => {
    const newLevelId = addShelfLevel();
    setActiveShelfLevelId(newLevelId);
  }, [addShelfLevel]);

  const handleDeleteShelfLevel = useCallback((levelId: string) => {
    deleteShelfLevel(levelId);
    if (activeShelfLevelId === levelId) {
      setActiveShelfLevelId(shelfLevels.find((level) => level.id !== levelId)?.id ?? null);
    }
  }, [activeShelfLevelId, deleteShelfLevel, shelfLevels]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#080B10] text-slate-100">
      
      {/* Editorial Top Bar */}
      <EditorialHeader
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSelectedIndex(0);
        }}
        totalBooksCount={books.length}
        readingStreakDays={readingStreakDays}
        onOpenAddBook={() => setIsAddModalOpen(true)}
        is3DMode={is3DMode}
        onToggleViewMode={() => setIs3DMode(!is3DMode)}
        onExit={onExit}
      />

      {/* Main Experience Body */}
      <main className="relative flex min-h-0 flex-1 flex-col bg-[#080B10]">
        {is3DMode ? (
          /* 3D Shelf Scene & Floating Overlay Controls */
          <div className="relative flex min-h-0 w-full flex-1 flex-col">
            <CompleteShelfScene
              shelfItems={shelfItems}
              shelfLevels={shelfLevels}
              shelfLayout={shelfLayout}
              activeLevelId={activeShelfLevelId}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              onOpenInspection={handleOpenInspection}
              onCloseInspection={() => setIsInspecting(false)}
              onMoveBookToShelfLevel={handleMoveBookToShelfLevel}
              onDragStateChange={handleDragStateChange}
              onNavigateLevel={setActiveShelfLevelId}
              isInspecting={isInspecting}
            />

            {/* Hide shelf chrome while inspecting so the 3D book stays unobstructed */}
            {!isInspecting && (
              <ShelfLevelRail
                levels={shelfLevels}
                bookCounts={shelfBookCounts}
                activeLevelId={activeShelfLevelId}
                draggingBookId={draggingBookId}
                dragTargetLevelId={dragTargetLevelId}
                onSelectLevel={setActiveShelfLevelId}
                onRenameLevel={updateShelfLevelName}
                onAddLevel={handleAddShelfLevel}
                onDeleteLevel={handleDeleteShelfLevel}
                onMoveBookToShelfLevel={handleMoveBookToShelfLevel}
              />
            )}

            {/* Bottom HUD Controller */}
            {!isInspecting && (
              <ShelfNavigationHUD
                books={filteredBooks}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                isInspecting={isInspecting}
                onToggleInspection={handleToggleInspection}
                onPrevBook={handlePrevBook}
                onNextBook={handleNextBook}
                activeCategory={activeCategory}
                onSelectCategory={(cat) => {
                  setActiveCategory(cat);
                  setSelectedIndex(0);
                }}
              />
            )}

            {/* Inspection Drawer Overlay */}
            <BookInspectionOverlay
              book={currentBook}
              isOpen={isInspecting}
              onClose={() => setIsInspecting(false)}
              onSaveBook={handleSaveEditedBook}
              onUpdateProgress={handleUpdateProgress}
            />
          </div>
        ) : (
          /* 2D Library Grid Fallback Mode */
          <div className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto bg-[#080B10] p-4 sm:p-6 pb-20">
            <DashboardView
              books={filteredBooks}
              viewMode="grid"
              onUpdateProgress={handleRelativeProgress}
              onUpdateStatus={setBookStatus}
              onEdit={setEditingBook}
              onDelete={removeBook}
              onMove={setMovingBook}
              onSelect={setSelectedBook}
              onPlan={setPlanningBook}
            />
          </div>
        )}
        {/* Quick log entry point (mobile) — the sheet itself is mobile-only */}
        {!isInspecting && !isQuickLogOpen && (
          <button
            type="button"
            onClick={() => setIsQuickLogOpen(true)}
            aria-label="Abrir registro rápido de leitura"
            className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] right-4 z-30 flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#3A2317] text-[#F3D274] shadow-lg transition active:scale-95 hover:bg-[#4A2D1E] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 md:hidden"
          >
            <Zap className="h-5 w-5" />
          </button>
        )}
      </main>

      {/* Lazy Loaded Modals */}
      <Suspense
        fallback={
          <div className="fixed bottom-4 right-4 bg-[#3A2317] p-2 rounded-full shadow-lg z-50">
            <Loader2 className="animate-spin text-[#F3D274]" />
          </div>
        }
      >
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
        {isAddModalOpen && (
          <AddBookModal
            onClose={() => setIsAddModalOpen(false)}
            onAdd={addBook}
            currentFolderId={currentFolderId}
          />
        )}
        {editingBook && (
          <EditBookModal
            book={editingBook}
            onClose={() => setEditingBook(null)}
            onSave={(b) => {
              handleSaveEditedBook(b.id, b);
              setEditingBook(null);
            }}
          />
        )}
        {movingBook && (
          <MoveBookModal
            book={movingBook}
            folders={folders}
            onClose={() => setMovingBook(null)}
            onMove={(bookId, folderId) => {
              moveBookToFolder(bookId, folderId);
              setMovingBook(null);
            }}
          />
        )}
        {planningBook && (
          <ReadingDailyPlanModal
            book={planningBook}
            onClose={() => setPlanningBook(null)}
          />
        )}
        {isQuickLogOpen && (
          <QuickLogBottomSheet
            isOpen={isQuickLogOpen}
            onClose={() => setIsQuickLogOpen(false)}
            books={books}
            onUpdateProgress={handleRelativeProgress}
            onSetProgress={(id, absVal) => updateProgress(id, absVal)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ReadingView;
