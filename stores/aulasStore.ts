/**
 * Aulas Store - Courses, chapters, folders, and collections with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    AulaBook,
    AulaChapter,
    AulaFolder,
    AulaCollection,
    RecentlyStudiedItem,
    SmartReviewAnswer,
    SmartReviewSession,
} from '../types';
import { writeToFirestore, getCurrentUserId, writeItemToSubcollection, deleteItemFromSubcollection } from './firestoreSync';
import { readNamespacedStorage, writeNamespacedStorage } from '../utils/storageUtils';
import { generateUUID } from '../utils/uuid';

const STORE_KEY = 'p67_aulas_config';
const BOOKS_SUBCOLLECTION_KEY = 'p67_aulas_books';
const LOCAL_BACKUP_KEY = `${STORE_KEY}::backup`;
const BOOK_SYNC_DEBOUNCE_MS = 900;
const LOCAL_BACKUP_DEBOUNCE_MS = 1200;
const REVIEW_SESSION_SYNC_DEBOUNCE_MS = 1200;

const pendingBookSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
let pendingLocalBackupTimer: ReturnType<typeof setTimeout> | null = null;
let pendingReviewSessionSyncTimer: ReturnType<typeof setTimeout> | null = null;

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const mergeBooksByRecency = (baseBooks: AulaBook[], incomingBooks: AulaBook[]): AulaBook[] => {
    const merged = new Map<string, AulaBook>();
    baseBooks.forEach(b => merged.set(b.id, b));
    
    // In this simple strategy, we take the incoming book as whole since chapters are complex arrays
    incomingBooks.forEach(b => {
        merged.set(b.id, b);
    });
    return Array.from(merged.values());
};

const syncBookToSubcollection = (book?: AulaBook) => {
    if (!book) return;
    void writeItemToSubcollection(BOOKS_SUBCOLLECTION_KEY, book.id, book);
};

const syncBookToSubcollectionDebounced = (book?: AulaBook) => {
    if (!book) return;

    const existingTimer = pendingBookSyncTimers.get(book.id);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
        pendingBookSyncTimers.delete(book.id);
        syncBookToSubcollection(book);
    }, BOOK_SYNC_DEBOUNCE_MS);

    pendingBookSyncTimers.set(book.id, timer);
};

const deleteBookFromSubcollection = (bookId: string) => {
    void deleteItemFromSubcollection(BOOKS_SUBCOLLECTION_KEY, bookId);
};

const writeRootStateDebounced = (
    payload: {
        folders: AulaFolder[];
        collections: AulaCollection[];
        recentlyStudied: RecentlyStudiedItem[];
        activeReviewSession: SmartReviewSession | null;
        reviewSessions: SmartReviewSession[];
    },
    shouldWriteRemote: boolean,
) => {
    if (pendingReviewSessionSyncTimer) {
        clearTimeout(pendingReviewSessionSyncTimer);
    }

    pendingReviewSessionSyncTimer = setTimeout(() => {
        pendingReviewSessionSyncTimer = null;
        if (shouldWriteRemote) {
            writeToFirestore(STORE_KEY, payload);
        }
    }, REVIEW_SESSION_SYNC_DEBOUNCE_MS);
};

const flattenChapterJson = (chaptersJson: any[]) => {
  if (chaptersJson.length === 1 && Array.isArray(chaptersJson[0])) {
    return chaptersJson[0];
  }
  return chaptersJson;
};

const sectionsToMarkdown = (item: any, title: string) => {
  if (!Array.isArray(item.secoes)) return "";

  const lines = [`# ${title}`, ""];

  item.secoes.forEach((section: any) => {
    if (!section || typeof section !== "object") return;

    if (section.titulo) {
      lines.push(`## ${section.titulo}`, "");
    }

    if (Array.isArray(section.conteudo)) {
      section.conteudo.forEach((contentItem: any) => {
        lines.push(`- ${String(contentItem)}`);
      });
      lines.push("");
    } else if (typeof section.conteudo === "string") {
      lines.push(section.conteudo, "");
    }
  });

  if (item.importancia) {
    lines.push(`**Importancia:** ${item.importancia}`, "");
  }

  return lines.join("\n").trim();
};

interface AulasState {
    folders: AulaFolder[];
    books: AulaBook[];
    collections: AulaCollection[];
    recentlyStudied: RecentlyStudiedItem[];
    activeReviewSession: SmartReviewSession | null;
    reviewSessions: SmartReviewSession[];
    isLoading: boolean;
    _initialized: boolean;

    // Folder Actions
    addFolder: (name: string, parentId?: string) => void;
    deleteFolder: (folderId: string) => void;
    updateFolder: (folderId: string, updates: Partial<AulaFolder>) => void;

    // Collection Actions
    addCollection: (name: string) => void;
    deleteCollection: (collectionId: string) => void;
    updateCollectionBooks: (collectionId: string, bookIds: string[]) => void;

    // Book Actions
    addBook: (folderId: string, title: string) => void;
    updateBook: (bookId: string, updates: Partial<AulaBook>) => void;
    deleteBook: (bookId: string) => void;
    reorderBooks: (folderId: string, oldIndex: number, newIndex: number) => void;

    // Chapter Actions
    addChaptersJson: (bookId: string, chaptersJson: any[]) => void;
    updateChapter: (bookId: string, chapterId: string, updates: Partial<AulaChapter>) => void;
    reorderChapters: (bookId: string, oldIndex: number, newIndex: number) => void;
    moveChapter: (sourceBookId: string, targetBookId: string, chapterId: string, newPosition?: number) => void;

    addRecentlyStudied: (bookId: string, chapterId: string) => void;
    setChapterConfidence: (bookId: string, chapterId: string, confidence: 'easy' | 'medium' | 'hard') => void;
    updateChapterStudyTime: (bookId: string, chapterId: string, seconds: number) => void;
    saveActiveReviewSession: (session: SmartReviewSession | null) => void;
    setReviewAnswer: (questionId: string, answer: SmartReviewAnswer) => void;
    setReviewAnswers: (questionIds: string[], answer: SmartReviewAnswer) => void;
    completeReviewSession: (session: SmartReviewSession) => void;

    importBackupData: (backupData: { folders: any[]; books?: any[]; collections?: any[]; recentlyStudied?: any[] }) => void;

    setLoading: (loading: boolean) => void;

    // Internal Sync
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: {
        folders: AulaFolder[];
        collections: AulaCollection[];
        books?: AulaBook[];
        recentlyStudied?: RecentlyStudiedItem[];
        activeReviewSession?: SmartReviewSession | null;
        reviewSessions?: SmartReviewSession[];
    } | null) => void;
    _hydrateBooksFromSubcollection: (books: AulaBook[]) => void;
    _reset: () => void;
}

const readLocalBackup = (): {
    folders: AulaFolder[];
    collections: AulaCollection[];
    books?: AulaBook[];
    recentlyStudied?: RecentlyStudiedItem[];
    activeReviewSession?: SmartReviewSession | null;
    reviewSessions?: SmartReviewSession[];
} | null => {
    const userId = getCurrentUserId();
    const raw = readNamespacedStorage(LOCAL_BACKUP_KEY, userId);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.folders && parsed?.collections) {
            return parsed;
        }
    } catch {
        // ignore
    }
    return null;
};

const writeLocalBackup = (data: {
    folders: AulaFolder[];
    collections: AulaCollection[];
    books?: AulaBook[];
    recentlyStudied?: RecentlyStudiedItem[];
    activeReviewSession?: SmartReviewSession | null;
    reviewSessions?: SmartReviewSession[];
}) => {
    const userId = getCurrentUserId();
    try {
        const existingRaw = readNamespacedStorage(LOCAL_BACKUP_KEY, userId);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        writeNamespacedStorage(LOCAL_BACKUP_KEY, JSON.stringify({ ...existing, ...data, updatedAt: Date.now() }), userId);
    } catch {
        // ignore
    }
};

const writeLocalBackupDebounced = (data: {
    folders: AulaFolder[];
    collections: AulaCollection[];
    books?: AulaBook[];
    recentlyStudied?: RecentlyStudiedItem[];
    activeReviewSession?: SmartReviewSession | null;
    reviewSessions?: SmartReviewSession[];
}) => {
    if (pendingLocalBackupTimer) {
        clearTimeout(pendingLocalBackupTimer);
    }

    pendingLocalBackupTimer = setTimeout(() => {
        pendingLocalBackupTimer = null;
        writeLocalBackup(data);
    }, LOCAL_BACKUP_DEBOUNCE_MS);
};

const DEFAULT_FOLDERS: AulaFolder[] = [
    { id: 'f-1', name: 'Estudo Ativo', position: 0 },
    { id: 'f-2', name: 'Lista de Desejos', position: 1 },
    { id: 'f-3', name: 'Concluídos', position: 2 },
];

export const useAulasStore = create<AulasState>()(immer((set, get) => ({
    folders: [],
    books: [],
    collections: [],
    recentlyStudied: [],
    activeReviewSession: null,
    reviewSessions: [],
    isLoading: true,
    _initialized: false,

    // Folder Actions
    addFolder: (name, parentId) => {
        set((state) => {
            state.folders.push({
                id: generateUUID(),
                name,
                position: state.folders.length,
                parentId
            });
        });
        get()._syncToFirestore();
    },

    updateFolder: (folderId, updates) => {
        set((state) => {
            const folder = state.folders.find(f => f.id === folderId);
            if (folder) {
                Object.assign(folder, updates);
            }
        });
        get()._syncToFirestore();
    },

    deleteFolder: (folderId) => {
        const booksToDelete: string[] = [];
        set((state) => {
            const foldersToDelete = [folderId];
            let added = true;
            while (added) {
                added = false;
                state.folders.forEach(f => {
                    if (f.parentId && foldersToDelete.includes(f.parentId) && !foldersToDelete.includes(f.id)) {
                        foldersToDelete.push(f.id);
                        added = true;
                    }
                });
            }

            // Find all books under folders being deleted
            state.books.forEach(b => {
                if (foldersToDelete.includes(b.folderId)) {
                    booksToDelete.push(b.id);
                }
            });

            state.folders = state.folders.filter(f => !foldersToDelete.includes(f.id));
            state.books = state.books.filter(b => !foldersToDelete.includes(b.folderId));
        });

        // Trigger deletes in subcollection
        booksToDelete.forEach(deleteBookFromSubcollection);
        get()._syncToFirestore();
    },

    // Collection Actions
    addCollection: (name) => {
        set((state) => {
            state.collections.push({
                id: generateUUID(),
                name,
                position: state.collections.length,
                bookIds: []
            });
        });
        get()._syncToFirestore();
    },

    deleteCollection: (collectionId) => {
        set((state) => {
            state.collections = state.collections.filter(c => c.id !== collectionId);
        });
        get()._syncToFirestore();
    },

    updateCollectionBooks: (collectionId, bookIds) => {
        set((state) => {
            const col = state.collections.find(c => c.id === collectionId);
            if (col) {
                col.bookIds = bookIds;
            }
        });
        get()._syncToFirestore();
    },

    // Book Actions
    addBook: (folderId, title) => {
        const bookId = generateUUID();
        let newBook: AulaBook | null = null;

        set((state) => {
            const booksInFolder = state.books.filter(b => b.folderId === folderId);
            newBook = {
                id: bookId,
                folderId,
                title,
                coverImage: null,
                targetDate: null,
                position: booksInFolder.length,
                chapters: [],
            };
            state.books.push(newBook);
        });

        if (newBook) {
            syncBookToSubcollection(newBook);
        }
        get()._syncToFirestore();
    },

    updateBook: (bookId, updates) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            if (book) {
                Object.assign(book, updates);
            }
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollection(updated);

        get()._syncToFirestore();
    },

    deleteBook: (bookId) => {
        set((state) => {
            state.books = state.books.filter(b => b.id !== bookId);
            // Also remove references from collections
            state.collections.forEach(col => {
                col.bookIds = col.bookIds.filter(id => id !== bookId);
            });
        });

        deleteBookFromSubcollection(bookId);
        get()._syncToFirestore();
    },

    reorderBooks: (folderId, oldIndex, newIndex) => {
        set((state) => {
            const folderBooks = state.books.filter(b => b.folderId === folderId).sort((a, b) => a.position - b.position);
            const otherBooks = state.books.filter(b => b.folderId !== folderId);

            const [moved] = folderBooks.splice(oldIndex, 1);
            folderBooks.splice(newIndex, 0, moved);

            const reorderedFolderBooks = folderBooks.map((b, idx) => ({ ...b, position: idx }));
            state.books = [...otherBooks, ...reorderedFolderBooks];
        });

        // Sync reordered books to subcollection
        const folderBooks = get().books.filter(b => b.folderId === folderId);
        folderBooks.forEach(syncBookToSubcollection);

        get()._syncToFirestore();
    },

    // Chapter Actions
    addChaptersJson: (bookId, chaptersJson) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            if (!book) return;

            const basePosition = book.chapters.length;
            const normalizedChaptersJson = flattenChapterJson(chaptersJson)
                .filter((item: any) => !(item && typeof item === "object" && "total_aulas" in item));

            const newChapters: AulaChapter[] = normalizedChaptersJson.map((item: any, idx: number) => {
                let title = "Capítulo sem título";
                let content = "";
                if (typeof item === "string") {
                    title = item;
                } else if (typeof item === "object" && item !== null) {
                    title = item.title || item.titulo || title;
                    content = item.content || sectionsToMarkdown(item, title) || content;
                }

                return {
                    id: generateUUID(),
                    title,
                    content,
                    attachments: {},
                    relatedQuestions: undefined,
                    position: basePosition + idx,
                };
            });

            book.chapters = [...book.chapters, ...newChapters];
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollection(updated);

        get()._syncToFirestore();
    },

    updateChapter: (bookId, chapterId, updates) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            if (!book) return;

            const ch = book.chapters.find(c => c.id === chapterId);
            if (ch) {
                Object.assign(ch, updates);
            }
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollectionDebounced(updated);

        const { folders, collections, books, recentlyStudied } = get();
        writeLocalBackupDebounced({ folders, collections, books, recentlyStudied } as any);
    },

    reorderChapters: (bookId, oldIndex, newIndex) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            if (!book) return;

            // Sort by position first to be safe
            book.chapters.sort((a, b) => a.position - b.position);

            const [moved] = book.chapters.splice(oldIndex, 1);
            book.chapters.splice(newIndex, 0, moved);

            // Re-assign positions
            book.chapters.forEach((ch, idx) => {
                ch.position = idx;
            });
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollection(updated);

        get()._syncToFirestore();
    },

    moveChapter: (sourceBookId, targetBookId, chapterId, newPosition) => {
        set((state) => {
            const sourceBook = state.books.find(b => b.id === sourceBookId);
            const targetBook = state.books.find(b => b.id === targetBookId);
            if (!sourceBook || !targetBook) return;

            const chapterIndex = sourceBook.chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex === -1) return;

            const [movedChapter] = sourceBook.chapters.splice(chapterIndex, 1);

            // Re-assign positions for source
            sourceBook.chapters.sort((a, b) => a.position - b.position).forEach((ch, idx) => {
                ch.position = idx;
            });

            // Insert into target
            targetBook.chapters.sort((a, b) => a.position - b.position);
            if (typeof newPosition === "number") {
                targetBook.chapters.splice(newPosition, 0, movedChapter);
            } else {
                targetBook.chapters.push(movedChapter);
            }

            // Re-assign positions for target
            targetBook.chapters.forEach((ch, idx) => {
                ch.position = idx;
            });
        });

        const updatedSource = get().books.find(b => b.id === sourceBookId);
        const updatedTarget = get().books.find(b => b.id === targetBookId);
        if (updatedSource) syncBookToSubcollection(updatedSource);
        if (updatedTarget) syncBookToSubcollection(updatedTarget);

        get()._syncToFirestore();
    },

    addRecentlyStudied: (bookId, chapterId) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            const chapter = book?.chapters.find(c => c.id === chapterId);
            if (!book || !chapter) return;

            // Remove if already exists to move to top
            state.recentlyStudied = state.recentlyStudied.filter(
                item => !(item.bookId === bookId && item.chapterId === chapterId)
            );

            // Add at the beginning
            state.recentlyStudied.unshift({
                bookId,
                chapterId,
                bookTitle: book.title,
                chapterTitle: chapter.title,
                accessedAt: new Date().toISOString()
            });

            // Keep only latest 5
            if (state.recentlyStudied.length > 5) {
                state.recentlyStudied = state.recentlyStudied.slice(0, 5);
            }
        });
        get()._syncToFirestore();
    },

    setChapterConfidence: (bookId, chapterId, confidence) => {
        const daysMap = {
            easy: 7,
            medium: 3,
            hard: 1
        };

        const days = daysMap[confidence];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        const nextReviewDate = nextDate.toISOString().split('T')[0];

        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            const ch = book?.chapters.find(c => c.id === chapterId);
            if (ch) {
                ch.confidence = confidence;
                ch.nextReviewDate = nextReviewDate;
            }
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollectionDebounced(updated);

        const { folders, collections, books, recentlyStudied } = get();
        writeLocalBackupDebounced({ folders, collections, books, recentlyStudied } as any);
    },

    updateChapterStudyTime: (bookId, chapterId, seconds) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            const ch = book?.chapters.find(c => c.id === chapterId);
            if (ch) {
                ch.studyTimeSeconds = (ch.studyTimeSeconds || 0) + seconds;
            }
        });

        const updated = get().books.find(b => b.id === bookId);
        if (updated) syncBookToSubcollectionDebounced(updated);

        const { folders, collections, books, recentlyStudied } = get();
        writeLocalBackupDebounced({ folders, collections, books, recentlyStudied } as any);
    },

    saveActiveReviewSession: (session) => {
        set((state) => {
            state.activeReviewSession = session;
        });
        get()._syncToFirestore();
    },

    setReviewAnswer: (questionId, answer) => {
        set((state) => {
            if (!state.activeReviewSession) return;
            state.activeReviewSession.answers[questionId] = answer;
            state.activeReviewSession.updatedAt = new Date().toISOString();
        });
        const { folders, collections, books, recentlyStudied, activeReviewSession, reviewSessions, _initialized } = get();
        const payload = { folders, collections, recentlyStudied, activeReviewSession, reviewSessions };
        writeLocalBackupDebounced({ folders, collections, books, recentlyStudied, activeReviewSession, reviewSessions });
        writeRootStateDebounced(payload, Boolean(getCurrentUserId() && _initialized));
    },

    setReviewAnswers: (questionIds, answer) => {
        set((state) => {
            if (!state.activeReviewSession) return;
            questionIds.forEach((questionId) => {
                state.activeReviewSession!.answers[questionId] = answer;
            });
            state.activeReviewSession.updatedAt = new Date().toISOString();
        });
        const { folders, collections, books, recentlyStudied, activeReviewSession, reviewSessions, _initialized } = get();
        const payload = { folders, collections, recentlyStudied, activeReviewSession, reviewSessions };
        writeLocalBackupDebounced({ folders, collections, books, recentlyStudied, activeReviewSession, reviewSessions });
        writeRootStateDebounced(payload, Boolean(getCurrentUserId() && _initialized));
    },

    completeReviewSession: (session) => {
        const completedAt = session.completedAt || new Date().toISOString();
        const affectedBookIds = new Set<string>();

        set((state) => {
            session.questions.forEach((question) => {
                const answer = session.answers[question.id];
                if (answer !== 'correct' && answer !== 'incorrect') return;

                const book = state.books.find((item) => item.id === question.bookId);
                const chapter = book?.chapters.find((item) => item.id === question.chapterId);
                if (!book || !chapter) return;

                affectedBookIds.add(book.id);
                const key = String(question.questionNumber);
                const attempts = chapter.questionAttempts || {};
                const currentStats = attempts[key] || { total: 0, correct: 0, incorrect: 0, history: [] };
                const alreadyRecorded = currentStats.history.some((attempt) => attempt.sessionId === session.id);
                if (alreadyRecorded) return;

                const nextHistory = [{
                    timestamp: completedAt,
                    status: answer,
                    sessionId: session.id,
                    source: 'smart-review' as const,
                    submatters: question.submatters,
                }, ...currentStats.history];

                chapter.questionAttempts = {
                    ...attempts,
                    [key]: {
                        total: currentStats.total + 1,
                        correct: currentStats.correct + (answer === 'correct' ? 1 : 0),
                        incorrect: currentStats.incorrect + (answer === 'incorrect' ? 1 : 0),
                        history: nextHistory,
                    },
                };

                const correctQuestions = (chapter.correctQuestions || []).filter((number) => number !== question.questionNumber);
                const incorrectQuestions = (chapter.incorrectQuestions || []).filter((number) => number !== question.questionNumber);
                if (answer === 'correct') correctQuestions.push(question.questionNumber);
                if (answer === 'incorrect') incorrectQuestions.push(question.questionNumber);
                chapter.correctQuestions = correctQuestions.sort((a, b) => a - b);
                chapter.incorrectQuestions = incorrectQuestions.sort((a, b) => a - b);
                chapter.completedPrincipalQuestions = [...chapter.correctQuestions, ...chapter.incorrectQuestions].sort((a, b) => a - b);
            });

            const completedSession: SmartReviewSession = {
                ...session,
                status: 'completed',
                completedAt,
                updatedAt: completedAt,
            };
            state.reviewSessions = [
                completedSession,
                ...state.reviewSessions.filter((item) => item.id !== session.id),
            ].slice(0, 100);
            state.activeReviewSession = null;
        });

        const books = get().books;
        affectedBookIds.forEach((bookId) => syncBookToSubcollection(books.find((book) => book.id === bookId)));
        get()._syncToFirestore();
    },

    importBackupData: (backupData) => {
        const newBookIds: string[] = [];
        set((state) => {
            const { folders: incomingFolders, books: incomingBooks, collections: incomingCollections, recentlyStudied: incomingRecentlyStudied } = backupData as any;
            
            if (!Array.isArray(incomingFolders)) return;

            const folderIdMap = new Map<string, string>();
            folderIdMap.set('f-1', 'f-1');
            folderIdMap.set('f-2', 'f-2');
            folderIdMap.set('f-3', 'f-3');

            incomingFolders.forEach((f: any) => {
                if (f.id !== 'f-1' && f.id !== 'f-2' && f.id !== 'f-3') {
                    folderIdMap.set(f.id, generateUUID());
                }
            });

            incomingFolders.forEach((f: any) => {
                const mappedId = folderIdMap.get(f.id);
                if (!mappedId) return;

                if (f.id === 'f-1' || f.id === 'f-2' || f.id === 'f-3') {
                    const existing = state.folders.find(sf => sf.id === f.id);
                    if (existing) {
                        existing.name = f.name;
                        return;
                    }
                }

                const mappedParentId = f.parentId ? (folderIdMap.get(f.parentId) || f.parentId) : undefined;
                state.folders.push({
                    id: mappedId,
                    name: f.name,
                    position: f.position ?? state.folders.length,
                    parentId: mappedParentId
                });
            });

            const bookIdMap = new Map<string, string>();
            if (Array.isArray(incomingBooks)) {
                incomingBooks.forEach((b: any) => {
                    const newBookId = generateUUID();
                    bookIdMap.set(b.id, newBookId);
                    newBookIds.push(newBookId);

                    const mappedFolderId = folderIdMap.get(b.folderId) || b.folderId;

                    state.books.push({
                        id: newBookId,
                        folderId: mappedFolderId,
                        title: b.title,
                        coverImage: b.coverImage || null,
                        targetDate: b.targetDate || null,
                        position: b.position ?? 0,
                        chapters: b.chapters || []
                    });
                });
            }

            if (Array.isArray(incomingCollections)) {
                incomingCollections.forEach((c: any) => {
                    const newColId = generateUUID();
                    const mappedBookIds = (c.bookIds || [])
                        .map((bid: string) => bookIdMap.get(bid))
                        .filter(Boolean) as string[];

                    state.collections.push({
                        id: newColId,
                        name: c.name,
                        position: c.position ?? state.collections.length,
                        bookIds: mappedBookIds
                    });
                });
            }
            if (Array.isArray(incomingRecentlyStudied)) {
                state.recentlyStudied = incomingRecentlyStudied.map((item: any) => {
                    const mappedBookId = bookIdMap.get(item.bookId);
                    if (!mappedBookId) return null;
                    const book = state.books.find(b => b.id === mappedBookId);
                    const chapter = book?.chapters.find(c => c.title === item.chapterTitle);
                    if (!book || !chapter) return null;
                    return {
                        bookId: mappedBookId,
                        chapterId: chapter.id,
                        bookTitle: book.title,
                        chapterTitle: chapter.title,
                        accessedAt: item.accessedAt
                    };
                }).filter(Boolean) as RecentlyStudiedItem[];
            }
        });

        // Sync new books to Firestore subcollection
        const stateBooks = get().books;
        newBookIds.forEach((id) => {
            const book = stateBooks.find(b => b.id === id);
            if (book) {
                syncBookToSubcollection(book);
            }
        });

        // Sync folders and collections to Firestore
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const {
            folders,
            collections,
            books,
            recentlyStudied,
            activeReviewSession,
            reviewSessions,
            _initialized,
        } = get();
        const userId = getCurrentUserId();
        const payload = { folders, collections, recentlyStudied, activeReviewSession, reviewSessions };

        // Keep local backup (folders, collections + offline cache of books)
        writeLocalBackup({ folders, collections, books, recentlyStudied, activeReviewSession, reviewSessions });

        if (!userId) return;

        if (_initialized) {
            writeToFirestore(STORE_KEY, payload);
        }
    },

    _hydrateFromFirestore: (data) => {
        const fallback = data || readLocalBackup();
        const { _initialized } = get();

        if (!fallback) {
            set((state) => {
                state.folders = DEFAULT_FOLDERS;
                state.recentlyStudied = [];
                state.isLoading = false;
                state._initialized = true;
            });
            get()._syncToFirestore();
            return;
        }

        if (_initialized) {
            set((state) => {
                state.folders = deduplicateById(fallback.folders || []);
                state.collections = deduplicateById(fallback.collections || []);
                if (fallback && 'recentlyStudied' in fallback) {
                    state.recentlyStudied = (fallback as any).recentlyStudied || [];
                }
                state.activeReviewSession = fallback.activeReviewSession || null;
                state.reviewSessions = fallback.reviewSessions || [];
                state.isLoading = false;
            });
        } else {
            set((state) => {
                state.folders = deduplicateById(fallback.folders || DEFAULT_FOLDERS);
                state.collections = deduplicateById(fallback.collections || []);
                state.recentlyStudied = (fallback as any).recentlyStudied || [];
                state.activeReviewSession = fallback.activeReviewSession || null;
                state.reviewSessions = fallback.reviewSessions || [];
                if (fallback.books && state.books.length === 0) {
                    state.books = deduplicateById(fallback.books || []);
                }
                state.isLoading = false;
                state._initialized = true;
            });

            // Hydrate offline-saved books to subcollection if necessary
            if (fallback.books && fallback.books.length > 0) {
                fallback.books.forEach(syncBookToSubcollection);
            }
        }
    },

    _hydrateBooksFromSubcollection: (remoteBooks: AulaBook[]) => {
        set((state) => {
            if (remoteBooks.length === 0) return;
            state.books = deduplicateById(mergeBooksByRecency(state.books, remoteBooks));
        });
    },

    _reset: () => {
        set((state) => {
            state.folders = [];
            state.books = [];
            state.collections = [];
            state.recentlyStudied = [];
            state.activeReviewSession = null;
            state.reviewSessions = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));
