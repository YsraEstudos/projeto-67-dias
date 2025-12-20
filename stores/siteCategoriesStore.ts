/**
 * Site Categories Store - Categories for Links with Firestore-first persistence
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SiteCategory } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_site_categories_store';

// Default categories for backward compatibility
export const DEFAULT_SITE_CATEGORIES: SiteCategory[] = [
    { id: 'personal', name: 'Meus Sites', color: 'indigo', icon: 'layout', order: 0, isDefault: true },
    { id: 'general', name: 'Sites Gerais', color: 'slate', icon: 'grid', order: 1, isDefault: true },
];

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface SiteCategoriesState {
    categories: SiteCategory[];
    isLoading: boolean;
    _initialized: boolean;

    setCategories: (categories: SiteCategory[]) => void;
    addCategory: (category: SiteCategory) => void;
    updateCategory: (id: string, updates: Partial<SiteCategory>) => void;
    deleteCategory: (id: string) => void;
    reorderCategories: (categories: SiteCategory[]) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { categories: SiteCategory[] } | null) => void;
    _reset: () => void;
}

export const useSiteCategoriesStore = create<SiteCategoriesState>()((set, get) => ({
    categories: [],
    isLoading: true,
    _initialized: false,

    setCategories: (categories) => {
        set({ categories: deduplicateById(categories) });
        get()._syncToFirestore();
    },

    addCategory: (category) => {
        const state = get();
        // Auto-calculate order
        const maxOrder = state.categories.length > 0
            ? Math.max(...state.categories.map(c => c.order))
            : -1;
        const categoryWithOrder = { ...category, order: maxOrder + 1 };
        set({ categories: [...state.categories, categoryWithOrder] });
        get()._syncToFirestore();
    },

    updateCategory: (id, updates) => {
        set((state) => ({
            categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        get()._syncToFirestore();
    },

    deleteCategory: (id) => {
        const category = get().categories.find(c => c.id === id);
        // Prevent deleting default categories
        if (category?.isDefault) {
            console.warn('Cannot delete default category');
            return;
        }
        set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        get()._syncToFirestore();
    },

    reorderCategories: (categories) => {
        set({ categories });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { categories, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { categories });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.categories && data.categories.length > 0) {
            // Always ensure default categories exist by merging them with user data
            const userCategories = data.categories;
            const existingIds = new Set(userCategories.map(c => c.id));

            // Add any missing default categories
            const missingDefaults = DEFAULT_SITE_CATEGORIES.filter(
                dc => !existingIds.has(dc.id)
            );

            const mergedCategories = [...missingDefaults, ...userCategories]
                .sort((a, b) => a.order - b.order);

            set({
                categories: deduplicateById(mergedCategories),
                isLoading: false,
                _initialized: true
            });

            // Sync back if we added missing defaults
            if (missingDefaults.length > 0) {
                get()._syncToFirestore();
            }
        } else {
            // Initialize with defaults if empty
            set({
                categories: DEFAULT_SITE_CATEGORIES,
                isLoading: false,
                _initialized: true
            });
            get()._syncToFirestore();
        }
    },

    _reset: () => {
        set({ categories: [], isLoading: true, _initialized: false });
    }
}));

// Atomic Selectors
export const useSiteCategories = () => useSiteCategoriesStore((state) => state.categories);
export const useIsSiteCategoriesLoading = () => useSiteCategoriesStore((state) => state.isLoading);

export const useSiteCategoryActions = () => useSiteCategoriesStore(
    useShallow((state) => ({
        addCategory: state.addCategory,
        updateCategory: state.updateCategory,
        deleteCategory: state.deleteCategory,
        reorderCategories: state.reorderCategories,
        setCategories: state.setCategories,
    }))
);
