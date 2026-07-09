import React, { useMemo, useState, useRef, useEffect } from "react";
import { useAulasStore } from "../../../stores/aulasStore";
import { useShallow } from "zustand/react/shallow";
import { useDebounce } from "../../../hooks/useDebounce";
import { Plus, BookOpen, FolderPlus, Download, Upload, Trash2, Edit2, ChevronRight, ChevronDown, FolderSymlink, Check, Folder, Search, Grid, Layout, X, Sparkles, BrainCircuit } from "lucide-react";
import { QuestionAttempt, RecentlyStudiedItem } from "../../../types";
import RandomQuestionsModal from "./RandomQuestionsModal";
import { RandomQuestionItem } from "./randomQuestions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AulaBook, AulaChapter } from "../../../types";
import { motion, AnimatePresence } from "motion/react";
import { BookSpine, SortableBookSpine } from "./components/BookSpine3D";
import FolderManager from "./components/FolderManager";
import CollectionSelector from "./components/CollectionSelector";

interface BookshelfProps {
  onSelectBook: (bookId: string) => void;
}

export type BookshelfSearchResults = {
  chapters: { book: AulaBook; chapter: AulaChapter }[];
  comments: { book: AulaBook; chapter: AulaChapter; comment: any }[];
  questions: { book: AulaBook; chapter: AulaChapter; questionNumber: number; category: string }[];
};

type BookshelfChapterSearchEntry = {
  book: AulaBook;
  chapter: AulaChapter;
  text: string;
};

type BookshelfCommentSearchEntry = {
  book: AulaBook;
  chapter: AulaChapter;
  comment: any;
  text: string;
};

type BookshelfQuestionSearchEntry = {
  book: AulaBook;
  chapter: AulaChapter;
  questionNumber: number;
  category: string;
  text: string;
};

export type BookshelfSearchIndex = {
  chapters: BookshelfChapterSearchEntry[];
  comments: BookshelfCommentSearchEntry[];
  questions: BookshelfQuestionSearchEntry[];
};

const EMPTY_SEARCH_RESULTS: BookshelfSearchResults = {
  chapters: [],
  comments: [],
  questions: [],
};

const EMPTY_SEARCH_INDEX: BookshelfSearchIndex = {
  chapters: [],
  comments: [],
  questions: [],
};

const INITIAL_RENDERED_BOOKS = 24;
const RENDERED_BOOKS_INCREMENT = 24;
const LARGE_LIBRARY_THRESHOLD = 48;

const normalizeSearchText = (...parts: Array<string | number | null | undefined>): string =>
  parts
    .filter((part) => part !== null && part !== undefined)
    .map((part) => String(part).toLowerCase())
    .join(' ');

export const buildBookshelfSearchIndex = (books: AulaBook[]): BookshelfSearchIndex => {
  if (books.length === 0) return EMPTY_SEARCH_INDEX;

  const chapters: BookshelfSearchIndex['chapters'] = [];
  const comments: BookshelfSearchIndex['comments'] = [];
  const questions: BookshelfSearchIndex['questions'] = [];

  books.forEach((book) => {
    (book.chapters || []).forEach((chapter) => {
      chapters.push({
        book,
        chapter,
        text: normalizeSearchText(chapter.title, chapter.content),
      });

      (chapter.comments || []).forEach((comment) => {
        comments.push({
          book,
          chapter,
          comment,
          text: normalizeSearchText(comment.body, comment.selectedText),
        });
      });

      const relatedQuestions = chapter.relatedQuestions;
      if (!relatedQuestions) return;

      if (relatedQuestions.observacao) {
        questions.push({
          book,
          chapter,
          questionNumber: 0,
          category: `Observacao: ${relatedQuestions.observacao}`,
          text: normalizeSearchText(relatedQuestions.observacao),
        });
      }

      relatedQuestions.questoes_principais?.forEach((questionNumber) => {
        questions.push({
          book,
          chapter,
          questionNumber,
          category: 'Questao Principal',
          text: normalizeSearchText(questionNumber, 'questao principal'),
        });
      });

      relatedQuestions.questoes_secundarias_que_misturam_com_aulas_futuras?.forEach((questionNumber) => {
        questions.push({
          book,
          chapter,
          questionNumber,
          category: 'Questao Secundaria',
          text: normalizeSearchText(questionNumber, 'questao secundaria'),
        });
      });

      relatedQuestions.por_secao?.forEach((section) => {
        section.questoes?.forEach((questionNumber) => {
          questions.push({
            book,
            chapter,
            questionNumber,
            category: `Secao: ${section.secao}`,
            text: normalizeSearchText(questionNumber, section.secao),
          });
        });
      });
    });
  });

  return { chapters, comments, questions };
};

export const searchBookshelfIndex = (
  index: BookshelfSearchIndex,
  rawQuery: string,
): BookshelfSearchResults => {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return EMPTY_SEARCH_RESULTS;

  return {
    chapters: index.chapters
      .filter((entry) => entry.text.includes(query))
      .slice(0, 15)
      .map(({ book, chapter }) => ({ book, chapter })),
    comments: index.comments
      .filter((entry) => entry.text.includes(query))
      .slice(0, 15)
      .map(({ book, chapter, comment }) => ({ book, chapter, comment })),
    questions: index.questions
      .filter((entry) => entry.text.includes(query))
      .slice(0, 15)
      .map(({ book, chapter, questionNumber, category }) => ({ book, chapter, questionNumber, category })),
  };
};

export const buildBookshelfSearchResults = (
  books: AulaBook[],
  rawQuery: string,
): BookshelfSearchResults => searchBookshelfIndex(buildBookshelfSearchIndex(books), rawQuery);

interface BookCardProps {
  book: AulaBook;
  onSelectBook?: (bookId: string) => void;
  onOpenMoveModal?: (book: AulaBook) => void;
  isDragging?: boolean;
  isPlaceholder?: boolean;
  isSortingDisabled?: boolean;
}

const BookCard = React.memo(function BookCard({
  book,
  onSelectBook,
  onOpenMoveModal,
  isDragging = false,
  isPlaceholder = false,
  isSortingDisabled = false,
}: BookCardProps) {
  return (
    <div
      onClick={() => !isDragging && !isPlaceholder && onSelectBook?.(book.id)}
      className={`bg-slate-900 rounded-lg shadow-xl border-[4px] border-slate-800 overflow-hidden flex flex-col group h-72 relative ${
        isDragging
          ? "cursor-grabbing border-[#D4AF37]"
          : isSortingDisabled
          ? "cursor-pointer hover:scale-[1.02] transition-transform"
          : "cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
      } ${isPlaceholder ? "opacity-25" : ""}`}
    >
      <div className="h-44 bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Sem Capa</span>
          </div>
        )}

        {/* Floating move button - visible on hover or always on touch devices */}
        {!isDragging && !isPlaceholder && onOpenMoveModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMoveModal(book);
            }}
            className="absolute top-3 right-3 bg-slate-950/90 hover:bg-[#D4AF37] text-slate-400 hover:text-slate-950 p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-20 shadow-xl opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 hover:scale-105 active:scale-95 touch-none"
            title="Mover curso"
          >
            <FolderSymlink className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 bg-slate-900 border-t border-slate-850">
        <h3 className="font-serif text-lg leading-tight text-slate-100 line-clamp-2 mb-1">{book.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
          {book.targetDate ? (
            <span className="font-bold underline underline-offset-4 text-[#D4AF37]">
              Meta: {new Date(book.targetDate + "T00:00:00").toLocaleDateString()}
            </span>
          ) : (
            <span className="italic text-slate-500">Sem meta</span>
          )}
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {book.chapters?.length || 0} Aulas
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.book === nextProps.book && prevProps.isDragging === nextProps.isDragging && prevProps.isPlaceholder === nextProps.isPlaceholder);

const SortableBookCard = React.memo(function SortableBookCard({
  book,
  onSelectBook,
  onOpenMoveModal,
  isSortingDisabled,
}: {
  book: AulaBook;
  onSelectBook: (bookId: string) => void;
  onOpenMoveModal: (book: AulaBook) => void;
  isSortingDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
    disabled: isSortingDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookCard 
        book={book} 
        onSelectBook={onSelectBook} 
        onOpenMoveModal={onOpenMoveModal} 
        isPlaceholder={isDragging} 
        isSortingDisabled={isSortingDisabled}
      />
    </div>
  );
}, (prevProps, nextProps) => prevProps.book === nextProps.book && prevProps.isSortingDisabled === nextProps.isSortingDisabled);

export default function Bookshelf({ onSelectBook }: BookshelfProps) {
  const {
    folders,
    books,
    collections,
    recentlyStudied,
    isLoading,
    addFolder,
    updateFolder,
    deleteFolder,
    addCollection,
    deleteCollection,
    updateCollectionBooks,
    addBook,
    updateBook,
    updateChapter,
    reorderBooks,
    importBackupData,
  } = useAulasStore(
    useShallow((state) => ({
      folders: state.folders,
      books: state.books,
      collections: state.collections,
      recentlyStudied: state.recentlyStudied,
      isLoading: state.isLoading,
      addFolder: state.addFolder,
      updateFolder: state.updateFolder,
      deleteFolder: state.deleteFolder,
      addCollection: state.addCollection,
      deleteCollection: state.deleteCollection,
      updateCollectionBooks: state.updateCollectionBooks,
      addBook: state.addBook,
      updateBook: state.updateBook,
      updateChapter: state.updateChapter,
      reorderBooks: state.reorderBooks,
      importBackupData: state.importBackupData,
    }))
  );

  const [activeView, setActiveView] = useState<{ type: "folder" | "collection"; id: string } | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState<{ id: string; name: string } | null>(null);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectionAddBookDialogOpen, setCollectionAddBookDialogOpen] = useState(false);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | undefined>(undefined);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [randomQuestionsOpen, setRandomQuestionsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "folder" | "collection";
    id: string;
    message: string;
  } | null>(null);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [moveBookTarget, setMoveBookTarget] = useState<AulaBook | null>(null);
  const [showMoveSuccess, setShowMoveSuccess] = useState<string | null>(null);

  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, []);

  // Shelf view mode: "grid" | "shelf3d"
  const [shelfViewMode, setShelfViewMode] = useState<"grid" | "shelf3d">("grid");
  const [renderedBookLimit, setRenderedBookLimit] = useState(INITIAL_RENDERED_BOOKS);
  // Global search state
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const debouncedGlobalSearchQuery = useDebounce(globalSearchQuery, 250);
  const globalSearchIndex = useMemo(() => buildBookshelfSearchIndex(books), [books]);

  const setRandomQuestionStatus = (
    question: RandomQuestionItem,
    status: "correct" | "incorrect" | "pending",
  ) => {
    // Read fresh state from store to avoid stale closure when called rapidly
    const { books: currentBooks } = useAulasStore.getState();
    const chapter = currentBooks
      .find((book) => book.id === question.bookId)
      ?.chapters?.find((item) => item.id === question.chapterId);
    if (!chapter) return;

    const correctQuestions = chapter.correctQuestions || [];
    const incorrectQuestions = chapter.incorrectQuestions || [];
    const legacyCompleted = chapter.completedPrincipalQuestions || [];
    const activeCorrect =
      correctQuestions.length === 0 && incorrectQuestions.length === 0 && legacyCompleted.length > 0
        ? [...legacyCompleted]
        : [...correctQuestions];

    let nextCorrect = activeCorrect.filter((number) => number !== question.questionNumber);
    let nextIncorrect = incorrectQuestions.filter((number) => number !== question.questionNumber);
    const nextAttempts = { ...(chapter.questionAttempts || {}) };

    if (status === "correct" || status === "incorrect") {
      if (status === "correct") {
        nextCorrect = [...nextCorrect, question.questionNumber].sort((a, b) => a - b);
      } else {
        nextIncorrect = [...nextIncorrect, question.questionNumber].sort((a, b) => a - b);
      }

      const key = question.questionNumber.toString();
      const currentStats = nextAttempts[key] || { total: 0, correct: 0, incorrect: 0, history: [] };
      const attempt: QuestionAttempt = { timestamp: new Date().toISOString(), status };
      nextAttempts[key] = {
        total: currentStats.total + 1,
        correct: currentStats.correct + (status === "correct" ? 1 : 0),
        incorrect: currentStats.incorrect + (status === "incorrect" ? 1 : 0),
        history: [attempt, ...currentStats.history],
      };
    }

    updateChapter(question.bookId, question.chapterId, {
      correctQuestions: nextCorrect,
      incorrectQuestions: nextIncorrect,
      completedPrincipalQuestions: [...nextCorrect, ...nextIncorrect].sort((a, b) => a - b),
      questionAttempts: nextAttempts,
    });
  };

  const getBookColor = (id: string) => {
    const colors = [
      "from-rose-800 to-rose-950 border-rose-700 text-rose-100",
      "from-emerald-850 to-emerald-950 border-emerald-800 text-emerald-100",
      "from-cyan-850 to-cyan-950 border-cyan-800 text-cyan-100",
      "from-amber-900 to-amber-980 border-amber-800 text-amber-100",
      "from-violet-900 to-violet-980 border-violet-850 text-violet-100",
      "from-slate-800 to-slate-950 border-slate-750 text-slate-100",
      "from-amber-950 to-orange-950 border-amber-900 text-amber-100",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getBookDimensions = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const height = 180 + (Math.abs(hash) % 40); // 180px to 220px
    const width = 45 + (Math.abs(hash + 1) % 20); // 45px to 65px
    return { height, width };
  };

  const globalSearchResults = useMemo(
    () => globalSearchOpen
      ? searchBookshelfIndex(globalSearchIndex, debouncedGlobalSearchQuery)
      : EMPTY_SEARCH_RESULTS,
    [debouncedGlobalSearchQuery, globalSearchIndex, globalSearchOpen],
  );

  // Render shelves view
  const renderShelves = () => {
    const shelfSize = 6;
    const shelvesCount = Math.ceil(visibleBooks.length / shelfSize);
    const shelves = [];
    for (let i = 0; i < shelvesCount; i++) {
      shelves.push(visibleBooks.slice(i * shelfSize, (i + 1) * shelfSize));
    }

    return (
      <div className="space-y-16 py-8">
        {shelves.map((shelfBooks, shelfIdx) => (
          <div key={shelfIdx} className="relative pb-6 border-b-8 border-amber-950 shadow-[0_12px_16px_rgba(0,0,0,0.5)]">
            {/* Shelf Wood Plank Visual (Glow/3D Effect) */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-900 via-amber-950 to-amber-900 border-t border-[#8B5A2B]/40 shadow-inner z-10 animate-in fade-in duration-300" />
            
            {/* Books container */}
            <div className="flex items-end gap-3 px-6 h-60 relative z-0">
              {shelfBooks.map((book) => {
                const { height, width } = getBookDimensions(book.id);
                const colorClasses = getBookColor(book.id);
                
                return (
                  <div key={book.id} className="relative group/spine">
                    <SortableBookSpine 
                      book={book} 
                      height={height}
                      width={width}
                      colorClasses={colorClasses}
                      onSelectBook={onSelectBook}
                      onOpenMoveModal={setMoveBookTarget}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Carregando estante...</div>;
  }

  // Determine active view
  let currentView = activeView;
  if (!currentView) {
    if (folders.length > 0) {
      currentView = { type: "folder", id: folders[0].id };
    } else if (collections?.length > 0) {
      currentView = { type: "collection", id: collections[0].id };
    }
  }

  const isFolderView = currentView?.type === "folder";
  const isCollectionView = currentView?.type === "collection";

  const currentBooks = isFolderView
    ? books.filter((b) => b.folderId === currentView.id).sort((a, b) => a.position - b.position)
    : isCollectionView
    ? books.filter((b) => collections?.find((c) => c.id === currentView.id)?.bookIds.includes(b.id))
    : [];
  const visibleBooks = currentBooks.slice(0, renderedBookLimit);
  const hasMoreBooks = visibleBooks.length < currentBooks.length;
  const isLargeLibraryView = currentBooks.length > LARGE_LIBRARY_THRESHOLD;

  const resetRenderedBookLimit = () => {
    setRenderedBookLimit(INITIAL_RENDERED_BOOKS);
  };

  const loadMoreBooks = () => {
    setRenderedBookLimit((limit) => Math.min(limit + RENDERED_BOOKS_INCREMENT, currentBooks.length));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleMoveBookToFolder = (bookId: string, folderId: string) => {
    setShowMoveSuccess(folderId);
    // Update the store immediately to prevent data loss on unmount
    updateBook(bookId, { folderId });
    // Delay only the UI dismissal to show success animation
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    moveTimeoutRef.current = setTimeout(() => {
      setShowMoveSuccess(null);
      setMoveBookTarget(null);
      moveTimeoutRef.current = null;
    }, 600);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    // Check if dropped over a folder
    if (over.data.current?.type === "folder" && isFolderView) {
      if (currentView.id !== over.data.current.id) {
        updateBook(active.id as string, { folderId: over.data.current.id as string });
        return;
      }
    }

    if (active.id !== over.id && isFolderView) {
      // Use the full books array for index calculation, not the visible subset
      const fullSortedBooks = [...books]
        .filter((b) => b.folderId === currentView.id)
        .sort((a, b) => a.position - b.position);
      const oldIndex = fullSortedBooks.findIndex((b) => b.id === active.id);
      const newIndex = fullSortedBooks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBooks(currentView.id, oldIndex, newIndex);
      }
    }
  };

  const handleCreateBookClick = () => {
    if (!isFolderView) return;
    setInputValue("");
    setBookDialogOpen(true);
  };

  const submitBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isFolderView) {
      addBook(currentView.id, inputValue.trim());
      setBookDialogOpen(false);
    }
  };

  const handleCreateFolderClick = (parentId?: string | React.MouseEvent) => {
    setParentFolderIdForNew(typeof parentId === "string" ? parentId : undefined);
    setInputValue("");
    setFolderDialogOpen(true);
  };

  const submitFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addFolder(inputValue.trim(), parentFolderIdForNew);
      setFolderDialogOpen(false);
    }
  };

  const submitEditFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFolderDialogOpen && inputValue.trim()) {
      updateFolder(editFolderDialogOpen.id, { name: inputValue.trim() });
      setEditFolderDialogOpen(null);
    }
  };

  const handleEditFolderClick = (folder: { id: string; name: string }) => {
    setInputValue(folder.name);
    setEditFolderDialogOpen(folder);
  };

  const handleCreateCollectionClick = () => {
    setInputValue("");
    setCollectionDialogOpen(true);
  };

  const submitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addCollection(inputValue.trim());
      setCollectionDialogOpen(false);
    }
  };

  // Support exporting/importing JSON for simple data migration (no auto backup dependencies)
  const handleExportBackup = () => {
    const backupData = { folders, collections, books };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "estante_aulas_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.folders)) {
          importBackupData(parsed);
          alert("Backup importado com sucesso! (Os dados serão sincronizados com o Firestore)");
        } else {
          alert("Arquivo de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler backup: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif italic tracking-tight text-slate-100 mb-2">Estante de Aulas</h1>
          <p className="text-sm text-slate-400">Organize seus cursos, anexe imagens e acompanhe suas aulas e questões.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="aulas-backup-upload"
            onChange={handleImportBackup}
          />
          <label
            htmlFor="aulas-backup-upload"
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-2 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
            title="Importar Backup JSON"
          >
            <Upload className="w-4 h-4" />
          </label>
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[#D4AF37] hover:text-[#e5c158] px-3 py-2 rounded transition-colors text-xs uppercase tracking-wider mr-2"
            title="Busca Global Indexada"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRandomQuestionsOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#D4AF37] border border-[#D4AF37] hover:bg-[#C2A032] hover:border-[#C2A032] text-slate-950 px-3 py-2 rounded transition-colors text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap"
            title="Sortear 15 questoes aleatorias"
          >
            <Sparkles className="w-4 h-4" />
            Questões aleatórias
          </button>
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-2 rounded transition-colors text-xs uppercase tracking-wider mr-2"
            title="Exportar Backup JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleCreateFolderClick()}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-100 px-4 py-2 rounded font-medium transition-colors text-xs uppercase tracking-wider shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
        </div>
      </header>

      {/* Banner de Destaque para Revisão Inteligente */}
      <section className="mb-8 bg-gradient-to-r from-slate-900/60 via-[#D4AF37]/5 to-slate-900/60 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[#D4AF37]/45 transition-all duration-300">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#bfa032] text-slate-950 flex items-center justify-center shadow-lg shadow-[#D4AF37]/10 shrink-0">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 justify-center md:justify-start">
              Revisão Inteligente Diária
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-black animate-pulse">Recomendado</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              O motor inteligente selecionou revisões focadas para otimizar seu aprendizado hoje. Acelere seu progresso!
            </p>
          </div>
        </div>
        <button
          onClick={() => setRandomQuestionsOpen(true)}
          className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#D4AF37]/10 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          Acessar Central de Revisão
        </button>
      </section>

      {/* Continuar Estudando Carrossel */}
      {recentlyStudied && recentlyStudied.length > 0 && (
        <section className="mb-10 bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-xl p-5 shadow-lg animate-in fade-in duration-300">
          <h2 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>Continuar Estudando</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentlyStudied.map((item) => {
              const book = books.find(b => b.id === item.bookId);
              const chapter = book?.chapters.find(c => c.id === item.chapterId);
              
              return (
                <div
                  key={`${item.bookId}-${item.chapterId}`}
                  onClick={() => onSelectBook(item.bookId)}
                  className="bg-slate-950/50 border border-slate-850 hover:border-[#D4AF37]/55 rounded-lg p-3.5 cursor-pointer hover:scale-[1.02] hover:bg-slate-950 transition-all flex flex-col justify-between h-32 group"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                      {item.bookTitle}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-2 group-hover:text-[#D4AF37] transition-colors leading-snug">
                      {item.chapterTitle}
                    </h3>
                  </div>
                  
                  <div className="mt-4 shrink-0">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                      <span>Status</span>
                      <span className={chapter?.readAt ? "text-emerald-400 font-bold" : "text-slate-400"}>
                        {chapter?.readAt ? "Lido" : "Pendente"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-1 rounded-full ${chapter?.readAt ? "bg-emerald-500" : "bg-[#D4AF37]"}`}
                        style={{ width: chapter?.readAt ? "100%" : "30%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {folders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-lg border-2 border-slate-800 border-dashed">
          <p className="text-slate-500 mb-4 text-sm">Sua estante de aulas está vazia.</p>
          <button
            onClick={() => handleCreateFolderClick()}
            className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            Criar primeira pasta
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 shrink-0 space-y-2">
              <FolderManager
                folders={folders}
                currentView={currentView}
                onSelectFolder={(id) => {
                  setActiveView({ type: "folder", id });
                  resetRenderedBookLimit();
                }}
                onCreateFolder={(parentId) => handleCreateFolderClick(parentId)}
                onRenameFolder={(folder) => handleEditFolderClick(folder)}
                onDeleteFolder={(id) => {
                  setDeleteConfirm({
                    type: "folder",
                    id,
                    message: "Deseja realmente excluir esta pasta e todos os seus cursos?",
                  });
                }}
              />

              <CollectionSelector
                collections={collections}
                currentView={currentView}
                onSelectCollection={(id) => {
                  setActiveView({ type: "collection", id });
                  resetRenderedBookLimit();
                }}
                onCreateCollection={handleCreateCollectionClick}
                onDeleteCollection={(id) => {
                  setDeleteConfirm({
                    type: "collection",
                    id,
                    message: "Deseja realmente excluir esta coleção?",
                  });
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium border-b-2 border-[#D4AF37] pb-1 -mb-[9px] text-slate-100">
                    {isFolderView
                      ? folders.find((f) => f.id === currentView?.id)?.name
                      : collections?.find((c) => c.id === currentView?.id)?.name}
                  </h2>
                  {/* View Mode Toggle */}
                  {currentBooks.length > 0 && (
                    <div className="flex items-center bg-slate-950 border border-slate-850 p-0.5 rounded ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShelfViewMode("grid");
                          resetRenderedBookLimit();
                        }}
                        className={`p-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          shelfViewMode === "grid"
                            ? "bg-[#D4AF37] text-slate-950"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Exibição em Grade"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShelfViewMode("shelf3d");
                          resetRenderedBookLimit();
                        }}
                        className={`p-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          shelfViewMode === "shelf3d"
                            ? "bg-[#D4AF37] text-slate-950"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Exibição em Prateleira 3D"
                      >
                        <Layout className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {isFolderView && (
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <button
                      type="button"
                      onClick={() => handleCreateFolderClick(currentView?.id)}
                      className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Subpasta
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateBookClick}
                      className="flex items-center gap-1.5 bg-[#D4AF37] border border-[#D4AF37] hover:bg-[#C2A032] hover:border-[#C2A032] text-slate-950 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Curso
                    </button>
                  </div>
                )}
                {isCollectionView && (
                  <button
                    type="button"
                    onClick={() => setCollectionAddBookDialogOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-100 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Gerenciar Livros
                  </button>
                )}
              </div>

              {currentBooks.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 rounded-lg border border-slate-800 border-dashed text-slate-500 text-sm italic">
                  {isFolderView
                    ? "Nenhum curso nesta pasta. Clique em 'Novo Curso' para começar."
                    : "Nenhum curso nesta coleção."}
                </div>
              ) : (
                <>
                  <SortableContext items={visibleBooks.map((b) => b.id)} strategy={rectSortingStrategy}>
                    {shelfViewMode === "shelf3d" ? (
                      renderShelves()
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                          {visibleBooks.map((book) => {
                            const card = (
                              <SortableBookCard
                                book={book}
                                onSelectBook={onSelectBook}
                                onOpenMoveModal={setMoveBookTarget}
                                isSortingDisabled={isCollectionView}
                              />
                            );

                            return isLargeLibraryView ? (
                              <div key={book.id}>{card}</div>
                            ) : (
                              <motion.div
                                key={book.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                                transition={{ duration: 0.2 }}
                              >
                                {card}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </SortableContext>
                  {hasMoreBooks && (
                    <div className="flex justify-center pt-8">
                      <button
                        type="button"
                        onClick={loadMoreBooks}
                        className="rounded border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
                      >
                        Carregar mais {Math.min(RENDERED_BOOKS_INCREMENT, currentBooks.length - visibleBooks.length)} cursos
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDragId ? (
              <div className="opacity-90 scale-105 rotate-2 cursor-grabbing pointer-events-none shadow-2xl rounded-lg overflow-hidden ring-2 ring-[#D4AF37]/50">
                {shelfViewMode === "shelf3d" ? (
                  <div style={{ height: "200px", width: "60px" }}>
                    <BookSpine 
                      book={books.find((b) => b.id === activeDragId)!} 
                      height={200}
                      width={60}
                      colorClasses={getBookColor(activeDragId)}
                      isDragging
                    />
                  </div>
                ) : (
                  <BookCard book={books.find((b) => b.id === activeDragId)!} isDragging />
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {globalSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col h-[70vh] relative">
            <button
              onClick={() => {
                setGlobalSearchOpen(false);
                setGlobalSearchQuery("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
              title="Fechar busca"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif italic text-slate-100 mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#D4AF37]" />
              Busca Global Indexada
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Pesquise termos em teorias, comentários e questões de todos os seus cursos.
            </p>

            <div className="relative group w-full mb-6 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" />
              <input
                type="text"
                placeholder="Digite o termo de busca..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm text-slate-100 font-sans w-full transition-all"
                autoFocus
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {globalSearchQuery.trim() ? (
                <>
                  {/* Category: Aulas / Teoria */}
                  {globalSearchResults.chapters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] border-b border-slate-800 pb-1.5">
                        Teoria e Aulas ({globalSearchResults.chapters.length})
                      </h4>
                      <div className="space-y-2">
                        {globalSearchResults.chapters.map(({ book, chapter }) => (
                          <div
                            key={chapter.id}
                            onClick={() => {
                              setGlobalSearchOpen(false);
                              onSelectBook(book.id);
                            }}
                            className="bg-slate-950/40 border border-slate-850 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{book.title}</span>
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">Aula</span>
                            </div>
                            <strong className="text-xs text-slate-200 block">{chapter.title}</strong>
                            {chapter.content && (
                              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 italic font-serif">
                                {chapter.content.replace(/[#*`_]/g, "").substring(0, 150)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Comentários */}
                  {globalSearchResults.comments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-450 border-b border-slate-800 pb-1.5">
                        Anotações e Comentários ({globalSearchResults.comments.length})
                      </h4>
                      <div className="space-y-2">
                        {globalSearchResults.comments.map(({ book, chapter, comment }) => (
                          <div
                            key={comment.id}
                            onClick={() => {
                              setGlobalSearchOpen(false);
                              onSelectBook(book.id);
                            }}
                            className="bg-slate-950/40 border border-slate-850 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {book.title} | {chapter.title}
                              </span>
                              <span className="text-[9px] font-bold text-blue-450 bg-blue-500/10 px-1.5 py-0.5 rounded">Comentário</span>
                            </div>
                            <p className="text-[10px] text-slate-400 border-l-2 border-blue-500 pl-2 mb-2 italic">
                              "{comment.selectedText}"
                            </p>
                            <strong className="text-xs text-slate-200 block font-sans font-normal">
                              {comment.body}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Questões */}
                  {globalSearchResults.questions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-450 border-b border-slate-800 pb-1.5">
                        Questões e Observações ({globalSearchResults.questions.length})
                      </h4>
                      <div className="space-y-2">
                        {globalSearchResults.questions.map(({ book, chapter, questionNumber, category }) => (
                          <div
                            key={`${chapter.id}-q-${questionNumber}`}
                            onClick={() => {
                              setGlobalSearchOpen(false);
                              onSelectBook(book.id);
                            }}
                            className="bg-slate-950/40 border border-slate-850 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {book.title} | {chapter.title}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded">Questão</span>
                            </div>
                            <strong className="text-xs text-slate-200 block">
                              {questionNumber > 0 ? `Questão #${questionNumber}` : "Observação Geral"}
                            </strong>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Grupo/Vínculo: {category}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {globalSearchResults.chapters.length === 0 &&
                    globalSearchResults.comments.length === 0 &&
                    globalSearchResults.questions.length === 0 && (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
                        <p className="text-slate-500 text-xs">Nenhum resultado encontrado para "{globalSearchQuery}"</p>
                      </div>
                    )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  Comece a digitar para pesquisar em toda a sua estante de estudos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {folderDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitFolder} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Nova Pasta</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome da pasta"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFolderDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {randomQuestionsOpen && (
        <RandomQuestionsModal
          books={books}
          onClose={() => setRandomQuestionsOpen(false)}
          onSetQuestionStatus={setRandomQuestionStatus}
        />
      )}

      {editFolderDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitEditFolder} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Renomear Pasta</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Novo nome da pasta"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditFolderDialogOpen(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {bookDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitBook} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Novo Curso</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome do curso"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {collectionDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitCollection} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Nova Coleção</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome da coleção"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCollectionDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {collectionAddBookDialogOpen && isCollectionView && currentView && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl flex flex-col h-[70vh]">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Adicionar à Coleção</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {books.map((b) => {
                const col = collections?.find((c) => c.id === currentView.id);
                const isInCollection = col?.bookIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-850 rounded hover:border-[#D4AF37] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isInCollection}
                      onChange={(e) => {
                        if (!col) return;
                        let newBookIds = [...col.bookIds];
                        if (e.target.checked) newBookIds.push(b.id);
                        else newBookIds = newBookIds.filter((id) => id !== b.id);
                        updateCollectionBooks(col.id, newBookIds);
                      }}
                      className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-100">{b.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {folders.find((f) => f.id === b.folderId)?.name}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCollectionAddBookDialogOpen(false)}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-6 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Confirmar Exclusão</h3>
            <p className="text-slate-400 text-sm mb-6">{deleteConfirm.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "folder") {
                    deleteFolder(deleteConfirm.id);
                    if (currentView?.id === deleteConfirm.id) setActiveView(null);
                  } else if (deleteConfirm.type === "collection") {
                    deleteCollection(deleteConfirm.id);
                    if (currentView?.id === deleteConfirm.id) setActiveView(null);
                  }
                  setDeleteConfirm(null);
                }}
                className="bg-red-500 hover:bg-red-650 text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {moveBookTarget && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] overflow-hidden backdrop-blur-md">
            <div className="mb-4">
              <h3 className="text-xl font-serif italic text-slate-100 flex items-center gap-2">
                <FolderSymlink className="w-5 h-5 text-[#D4AF37]" />
                Mover Curso
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Selecione o destino para: <strong className="text-slate-200">{moveBookTarget.title}</strong>
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 my-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {folders
                .filter((f) => !f.parentId)
                .map((folder) => {
                  const subfolders = folders.filter((sub) => sub.parentId === folder.id);
                  const isCurrent = moveBookTarget.folderId === folder.id;
                  const isMovingSuccess = showMoveSuccess === folder.id;
                  
                  return (
                    <div key={folder.id} className="space-y-1">
                      <button
                        type="button"
                        disabled={isCurrent || !!showMoveSuccess}
                        onClick={() => handleMoveBookToFolder(moveBookTarget.id, folder.id)}
                        className={`w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm rounded transition-all duration-200 group/item ${
                          isCurrent
                            ? "bg-slate-850/50 text-slate-500 cursor-not-allowed border-l-2 border-slate-700"
                            : isMovingSuccess
                            ? "bg-green-950/30 text-green-400 border-l-2 border-green-500 scale-[1.01]"
                            : "hover:bg-slate-850 text-slate-300 hover:text-[#D4AF37] border-l-2 border-transparent hover:border-[#D4AF37] active:scale-[0.99] cursor-pointer"
                        }`}
                      >
                        <Folder className={`w-4 h-4 shrink-0 ${isCurrent ? "text-slate-600" : "text-[#D4AF37] group-hover/item:scale-110 transition-transform"}`} />
                        <span className="flex-1 truncate font-medium">{folder.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold">
                            Atual
                          </span>
                        )}
                        {isMovingSuccess && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-400 bg-green-500/20 p-0.5 rounded-full"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </motion.span>
                        )}
                      </button>

                      {/* Subfolders */}
                      {subfolders.map((subf) => {
                        const isSubCurrent = moveBookTarget.folderId === subf.id;
                        const isSubMovingSuccess = showMoveSuccess === subf.id;
                        return (
                          <button
                            key={subf.id}
                            type="button"
                            disabled={isSubCurrent || !!showMoveSuccess}
                            onClick={() => handleMoveBookToFolder(moveBookTarget.id, subf.id)}
                            className={`w-full flex items-center gap-2 text-left pl-8 pr-3 py-2 text-xs rounded transition-all duration-200 group/item ${
                              isSubCurrent
                                ? "bg-slate-850/50 text-slate-500 cursor-not-allowed border-l-2 border-slate-700"
                                : isSubMovingSuccess
                                ? "bg-green-950/30 text-green-400 border-l-2 border-green-500 scale-[1.01]"
                                : "hover:bg-slate-850 text-slate-400 hover:text-[#D4AF37] border-l-2 border-transparent hover:border-[#D4AF37] active:scale-[0.99] cursor-pointer"
                            }`}
                          >
                            <Folder className={`w-3.5 h-3.5 shrink-0 ${isSubCurrent ? "text-slate-600" : "text-slate-400 group-hover/item:text-[#D4AF37] group-hover/item:scale-110 transition-transform"}`} />
                            <span className="flex-1 truncate font-medium">{subf.name}</span>
                            {isSubCurrent && (
                              <span className="text-[9px] uppercase bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                Atual
                              </span>
                            )}
                            {isSubMovingSuccess && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-green-400 bg-green-500/20 p-0.5 rounded-full"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </motion.span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMoveBookTarget(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
