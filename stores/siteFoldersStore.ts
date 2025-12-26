/**
 * Site Folders Store - Folders within Sites for organizing Links
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SiteFolder } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_site_folders_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface SiteFoldersState {
    folders: SiteFolder[];
    isLoading: boolean;
    _initialized: boolean;

    // CRUD
    setFolders: (folders: SiteFolder[]) => void;
    addFolder: (folder: SiteFolder) => void;
    updateFolder: (id: string, updates: Partial<SiteFolder>) => void;
    deleteFolder: (id: string) => void;

    // Helpers
    getFoldersBySite: (siteId: string) => SiteFolder[];
    moveFolder: (folderId: string, newSiteId: string) => void;
    reorderFolders: (folders: SiteFolder[]) => void;
    toggleCollapse: (folderId: string) => void;

    // Internals
    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { folders: SiteFolder[] } | null) => void;
    _reset: () => void;
}

export const useSiteFoldersStore = create<SiteFoldersState>()((set, get) => ({
    folders: [],
    isLoading: true,
    _initialized: false,

    setFolders: (folders) => {
        set({ folders: deduplicateById(folders) });
        get()._syncToFirestore();
    },

    addFolder: (folder) => {
        const state = get();
        // Auto-calculate order within site
        const foldersInSite = state.folders.filter(f => f.siteId === folder.siteId);
        const maxOrder = foldersInSite.length > 0
            ? Math.max(...foldersInSite.map(f => f.order))
            : -1;
        const folderWithOrder = { ...folder, order: maxOrder + 1 };
        set({ folders: [...state.folders, folderWithOrder] });
        get()._syncToFirestore();
    },

    updateFolder: (id, updates) => {
        set((state) => ({
            folders: state.folders.map(f => f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f)
        }));
        get()._syncToFirestore();
    },

    deleteFolder: (id) => {
        set((state) => ({ folders: state.folders.filter(f => f.id !== id) }));
        get()._syncToFirestore();
    },

    getFoldersBySite: (siteId) => {
        return get().folders
            .filter(f => f.siteId === siteId)
            .sort((a, b) => a.order - b.order);
    },

    moveFolder: (folderId, newSiteId) => {
        set((state) => {
            const foldersInNewSite = state.folders.filter(f => f.siteId === newSiteId);
            const maxOrder = foldersInNewSite.length > 0
                ? Math.max(...foldersInNewSite.map(f => f.order))
                : -1;

            return {
                folders: state.folders.map(f =>
                    f.id === folderId
                        ? { ...f, siteId: newSiteId, order: maxOrder + 1, updatedAt: Date.now() }
                        : f
                )
            };
        });
        get()._syncToFirestore();
    },

    reorderFolders: (folders) => {
        set({ folders });
        get()._syncToFirestore();
    },

    toggleCollapse: (folderId) => {
        set((state) => ({
            folders: state.folders.map(f =>
                f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f
            )
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { folders, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { folders });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.folders && data.folders.length > 0) {
            set({
                folders: deduplicateById(data.folders),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ folders: [], isLoading: true, _initialized: false });
    }
}));

// Atomic Selectors
export const useSiteFolders = () => useSiteFoldersStore((state) => state.folders);
export const useIsSiteFoldersLoading = () => useSiteFoldersStore((state) => state.isLoading);

export const useSiteFolderActions = () => useSiteFoldersStore(
    useShallow((state) => ({
        addFolder: state.addFolder,
        updateFolder: state.updateFolder,
        deleteFolder: state.deleteFolder,
        moveFolder: state.moveFolder,
        reorderFolders: state.reorderFolders,
        setFolders: state.setFolders,
        getFoldersBySite: state.getFoldersBySite,
        toggleCollapse: state.toggleCollapse,
    }))
);
