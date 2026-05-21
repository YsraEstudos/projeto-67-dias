/**
 * Aulas Store - Courses, chapters, folders, and collections with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AulaBook, AulaChapter, AulaFolder, AulaCollection } from '../types';
import { writeToFirestore, getCurrentUserId, writeItemToSubcollection, deleteItemFromSubcollection } from './firestoreSync';
import { readNamespacedStorage, writeNamespacedStorage } from '../utils/storageUtils';
import { generateUUID } from '../utils/uuid';

const STORE_KEY = 'p67_aulas_config';
const BOOKS_SUBCOLLECTION_KEY = 'p67_aulas_books';
const LOCAL_BACKUP_KEY = `${STORE_KEY}::backup`;

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

const deleteBookFromSubcollection = (bookId: string) => {
    void deleteItemFromSubcollection(BOOKS_SUBCOLLECTION_KEY, bookId);
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

    setLoading: (loading: boolean) => void;

    // Internal Sync
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { folders: AulaFolder[]; collections: AulaCollection[] } | null) => void;
    _hydrateBooksFromSubcollection: (books: AulaBook[]) => void;
    _reset: () => void;
}

const readLocalBackup = (): { folders: AulaFolder[]; collections: AulaCollection[]; books?: AulaBook[] } | null => {
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

const writeLocalBackup = (data: { folders: AulaFolder[]; collections: AulaCollection[]; books?: AulaBook[] }) => {
    const userId = getCurrentUserId();
    try {
        writeNamespacedStorage(LOCAL_BACKUP_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }), userId);
    } catch {
        // ignore
    }
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
        if (updated) syncBookToSubcollection(updated);

        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { folders, collections, books, _initialized } = get();
        const userId = getCurrentUserId();
        const payload = { folders, collections };

        // Keep local backup (folders, collections + offline cache of books)
        writeLocalBackup({ folders, collections, books });

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
                state.isLoading = false;
            });
        } else {
            set((state) => {
                state.folders = deduplicateById(fallback.folders || DEFAULT_FOLDERS);
                state.collections = deduplicateById(fallback.collections || []);
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
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));
