import React, { useState, Suspense, useCallback, useMemo, useEffect } from 'react';
import { useReadingStore } from '../../stores/readingStore';
import { useShallow } from 'zustand/react/shallow';
import { Book as IBook, Folder as IFolder } from '../../types';
import { Loader2, Plus, LayoutGrid, Zap } from 'lucide-react';

// Shelf Editorial UI Components
import EditorialHeader, { ReadingCategoryFilter } from '../reading/shelf/EditorialHeader';
import ShelfNavigationHUD from '../reading/shelf/ShelfNavigationHUD';
import BookInspectionOverlay from '../reading/shelf/BookInspectionOverlay';
import CompleteShelfScene from '../reading/shelf/CompleteShelfScene';

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

/**
 * Calculates consecutive active reading streak days from book logs
 */
function calculateReadingStreak(books: IBook[]): number {
  const dates = new Set<string>();
  books.forEach((b) => {
    b.logs?.forEach((l) => {
      if (l.pagesRead > 0 && l.date) {
        dates.add(l.date);
      }
    });
  });

  if (dates.size === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayLogged = dates.has(todayStr);
  const yesterdayLogged = dates.has(yesterdayStr);

  if (!todayLogged && !yesterdayLogged) return 0;

  let streak = 0;
  let checkDate = new Date(todayLogged ? todayStr : yesterdayStr);

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export const ReadingView: React.FC = () => {
  // Store Subscription
  const { books, folders } = useReadingStore(
    useShallow((state) => ({ books: state.books, folders: state.folders }))
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
  } = useMemo(() => getReadingActions(), []);

  // Filter & Navigation State
  const [activeCategory, setActiveCategory] = useState<ReadingCategoryFilter>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

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

  // Keep selected index within bounds when filters change
  useEffect(() => {
    if (selectedIndex >= filteredBooks.length && filteredBooks.length > 0) {
      setSelectedIndex(filteredBooks.length - 1);
    }
  }, [filteredBooks.length, selectedIndex]);

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

  const handlePrevBook = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextBook = useCallback(() => {
    setSelectedIndex((prev) => Math.min(filteredBooks.length - 1, prev + 1));
  }, [filteredBooks.length]);

  const handleToggleInspection = useCallback(() => {
    setIsInspecting((prev) => !prev);
  }, []);

  const handleOpenInspection = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsInspecting(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#1A1817] text-[#1A1918] overflow-x-hidden overflow-y-auto scrollbar-thin">
      
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
      />

      {/* Main Experience Body */}
      <main className="flex-1 relative flex flex-col min-h-0 bg-[#1A1817]">
        {is3DMode ? (
          /* 3D Shelf Scene & Floating Overlay Controls */
          <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
            <CompleteShelfScene
              userBooks={filteredBooks}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              onOpenInspection={handleOpenInspection}
              isInspecting={isInspecting}
            />

            {/* Bottom HUD Controller */}
            <ShelfNavigationHUD
              books={filteredBooks}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              isInspecting={isInspecting}
              onToggleInspection={handleToggleInspection}
              onPrevBook={handlePrevBook}
              onNextBook={handleNextBook}
            />

            {/* Inspection Drawer Overlay */}
            <BookInspectionOverlay
              book={currentBook}
              isOpen={isInspecting}
              onClose={() => setIsInspecting(false)}
              onSaveBook={(bookId, updates) => updateBook(bookId, updates)}
              onUpdateProgress={handleUpdateProgress}
            />
          </div>
        ) : (
          /* 2D Library Grid Fallback Mode */
          <div className="p-6 max-w-7xl mx-auto w-full bg-[#FDFBF7] flex-1">
            <DashboardView
              books={filteredBooks}
              viewMode="grid"
              onUpdateProgress={(id, delta) => {
                const b = books.find((x) => x.id === id);
                if (b) updateProgress(id, Math.max(0, Math.min(b.total, b.current + delta)));
              }}
              onUpdateStatus={setBookStatus}
              onEdit={setEditingBook}
              onDelete={removeBook}
              onMove={setMovingBook}
              onSelect={setSelectedBook}
              onPlan={setPlanningBook}
            />
          </div>
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
              updateBook(b.id, b);
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
            onUpdateProgress={(id, delta) => {
              const b = books.find((x) => x.id === id);
              if (b) updateProgress(id, Math.max(0, Math.min(b.total, b.current + delta)));
            }}
            onSetProgress={(id, absVal) => updateProgress(id, absVal)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ReadingView;
