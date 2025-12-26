/**
 * Site Categories Store - Categories for Links with Firestore-first persistence
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SiteCategory } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_site_categories_store';

// Default categories for backward compatibility (root level = parentId: null)
export const DEFAULT_SITE_CATEGORIES: SiteCategory[] = [
    { id: 'personal', name: 'Meus Sites', color: 'indigo', icon: 'layout', order: 0, isDefault: true, parentId: null },
    { id: 'general', name: 'Sites Gerais', color: 'slate', icon: 'grid', order: 1, isDefault: true, parentId: null },
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

    // Hierarchy helpers
    getCategoryChildren: (parentId: string | null) => SiteCategory[];
    getCategoryPath: (categoryId: string) => SiteCategory[];
    moveCategory: (categoryId: string, newParentId: string | null) => boolean;
    toggleCollapse: (categoryId: string) => void;
    canMoveCategory: (categoryId: string, newParentId: string | null) => boolean;

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
        // Calculate order within the same parent level
        const siblingsInParent = state.categories.filter(c => c.parentId === category.parentId);
        const maxOrder = siblingsInParent.length > 0
            ? Math.max(...siblingsInParent.map(c => c.order))
            : -1;
        const categoryWithOrder = {
            ...category,
            order: maxOrder + 1,
            parentId: category.parentId ?? null // Ensure parentId is set
        };
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

    // Hierarchy helpers
    getCategoryChildren: (parentId) => {
        return get().categories
            .filter(c => c.parentId === parentId)
            .sort((a, b) => a.order - b.order);
    },

    getCategoryPath: (categoryId) => {
        const categories = get().categories;
        const path: SiteCategory[] = [];
        let current = categories.find(c => c.id === categoryId);

        while (current) {
            path.unshift(current);
            current = current.parentId
                ? categories.find(c => c.id === current!.parentId)
                : undefined;
        }
        return path;
    },

    canMoveCategory: (categoryId, newParentId) => {
        if (newParentId === null) return true; // Moving to root is always ok
        if (categoryId === newParentId) return false; // Can't be parent of itself

        // Check if newParentId is a descendant of categoryId (would create loop)
        const categories = get().categories;
        const isDescendant = (parentId: string | null): boolean => {
            if (parentId === null) return false;
            if (parentId === categoryId) return true;
            const parent = categories.find(c => c.id === parentId);
            return parent ? isDescendant(parent.parentId) : false;
        };

        return !isDescendant(newParentId);
    },

    moveCategory: (categoryId, newParentId) => {
        const category = get().categories.find(c => c.id === categoryId);
        if (!category) return false;
        if (category.isDefault) {
            console.warn('Cannot move default category');
            return false;
        }
        if (!get().canMoveCategory(categoryId, newParentId)) {
            console.warn('Invalid move: would create circular reference');
            return false;
        }

        // Calculate new order in target parent
        const siblingsInNewParent = get().categories.filter(c => c.parentId === newParentId);
        const maxOrder = siblingsInNewParent.length > 0
            ? Math.max(...siblingsInNewParent.map(c => c.order))
            : -1;

        set((state) => ({
            categories: state.categories.map(c =>
                c.id === categoryId
                    ? { ...c, parentId: newParentId, order: maxOrder + 1 }
                    : c
            )
        }));
        get()._syncToFirestore();
        return true;
    },

    toggleCollapse: (categoryId) => {
        set((state) => ({
            categories: state.categories.map(c =>
                c.id === categoryId
                    ? { ...c, isCollapsed: !c.isCollapsed }
                    : c
            )
        }));
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
            // Migrate: ensure all categories have parentId (null = root)
            const migratedCategories = data.categories.map((cat: any) => ({
                ...cat,
                parentId: cat.parentId ?? null,
                isCollapsed: cat.isCollapsed ?? false
            }));

            // Always ensure default categories exist by merging them with user data
            const existingIds = new Set(migratedCategories.map((c: SiteCategory) => c.id));

            // Add any missing default categories
            const missingDefaults = DEFAULT_SITE_CATEGORIES.filter(
                dc => !existingIds.has(dc.id)
            );

            const mergedCategories = [...missingDefaults, ...migratedCategories]
                .sort((a, b) => a.order - b.order);

            set({
                categories: deduplicateById(mergedCategories),
                isLoading: false,
                _initialized: true
            });

            // Sync back if we added missing defaults or migrated data
            const needsSync = missingDefaults.length > 0 ||
                data.categories.some((c: any) => c.parentId === undefined);
            if (needsSync) {
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
        getCategoryChildren: state.getCategoryChildren,
        getCategoryPath: state.getCategoryPath,
        moveCategory: state.moveCategory,
        toggleCollapse: state.toggleCollapse,
        canMoveCategory: state.canMoveCategory,
    }))
);
