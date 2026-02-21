/**
 * Prompts Store - Prompts and categories with Firestore-first persistence
 */
import { create } from 'zustand';
import { Prompt, PromptCategory } from '../types';
import { writeToFirestore } from './firestoreSync';
import { DEFAULT_PROMPTS, DEFAULT_PROMPT_CATEGORIES } from '../constants/defaultData';

const STORE_KEY = 'p67_prompts_store';
const PROMPTS_WRITE_DEBOUNCE_MS = 15000;

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface PromptsState {
    prompts: Prompt[];
    categories: PromptCategory[];
    isLoading: boolean;
    _initialized: boolean;

    setPrompts: (prompts: Prompt[]) => void;
    addPrompt: (prompt: Prompt) => void;
    updatePrompt: (id: string, updates: Partial<Prompt>) => void;
    deletePrompt: (id: string) => void;
    incrementCopyCount: (id: string) => void;
    toggleFavorite: (id: string) => void;
    reorderPrompts: (categoryId: string, reorderedPrompts: Prompt[]) => void;
    initializeDefaults: () => void;

    setCategories: (categories: PromptCategory[]) => void;
    addCategory: (category: PromptCategory) => void;
    updateCategory: (id: string, updates: Partial<PromptCategory>) => void;
    deleteCategory: (id: string) => void;
    reorderCategories: (categories: PromptCategory[]) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { prompts: Prompt[]; categories: PromptCategory[] } | null) => void;
    _reset: () => void;
}

export const usePromptsStore = create<PromptsState>()((set, get) => ({
    prompts: [],
    categories: [],
    isLoading: true,
    _initialized: false,

    setPrompts: (prompts) => {
        set({ prompts: deduplicateById(prompts) });
        get()._syncToFirestore();
    },

    addPrompt: (prompt) => {
        const state = get();
        // Auto-calculate order within category
        const categoryPrompts = state.prompts.filter(p => p.category === prompt.category);
        const maxOrder = categoryPrompts.length > 0
            ? Math.max(...categoryPrompts.map(p => p.order ?? 0))
            : -1;
        const promptWithOrder = { ...prompt, order: maxOrder + 1 };
        set({ prompts: [...state.prompts, promptWithOrder] });
        get()._syncToFirestore();
    },

    updatePrompt: (id, updates) => {
        set((state) => ({
            prompts: state.prompts.map(p =>
                p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
            )
        }));
        get()._syncToFirestore();
    },

    deletePrompt: (id) => {
        set((state) => ({ prompts: state.prompts.filter(p => p.id !== id) }));
        get()._syncToFirestore();
    },

    incrementCopyCount: (id) => {
        set((state) => ({
            prompts: state.prompts.map(p =>
                p.id === id ? { ...p, copyCount: p.copyCount + 1 } : p
            )
        }));
        get()._syncToFirestore();
    },

    toggleFavorite: (id) => {
        set((state) => ({
            prompts: state.prompts.map(p =>
                p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
            )
        }));
        get()._syncToFirestore();
    },

    reorderPrompts: (categoryId, reorderedPrompts) => {
        set((state) => {
            // Get IDs of reordered prompts for quick lookup
            const reorderedIds = new Set(reorderedPrompts.map(p => p.id));
            // Keep prompts from other categories unchanged
            const otherPrompts = state.prompts.filter(p => !reorderedIds.has(p.id));
            // Merge with reordered prompts (which have updated order)
            return { prompts: [...otherPrompts, ...reorderedPrompts] };
        });
        get()._syncToFirestore();
    },

    initializeDefaults: () => {
        const state = get();
        if (state.prompts.length > 0 || state.categories.length > 0) return;
        set({
            prompts: DEFAULT_PROMPTS,
            categories: DEFAULT_PROMPT_CATEGORIES,
            isLoading: false
        });
        get()._syncToFirestore();
    },

    setCategories: (categories) => {
        set({ categories: deduplicateById(categories) });
        get()._syncToFirestore();
    },

    addCategory: (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        get()._syncToFirestore();
    },

    updateCategory: (id, updates) => {
        set((state) => ({
            categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        get()._syncToFirestore();
    },

    deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        get()._syncToFirestore();
    },

    reorderCategories: (categories) => {
        set({ categories });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { prompts, categories, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { prompts, categories }, PROMPTS_WRITE_DEBOUNCE_MS);
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            const prompts = deduplicateById(data.prompts || []);
            const categories = deduplicateById(data.categories || []);

            set({
                prompts,
                categories,
                isLoading: false,
                _initialized: true
            });

            // Auto-initialize defaults if empty
            if (prompts.length === 0 && categories.length === 0) {
                get().initializeDefaults();
            }
        } else {
            set({ isLoading: false, _initialized: true });
            get().initializeDefaults();
        }
    },

    _reset: () => {
        set({ prompts: [], categories: [], isLoading: true, _initialized: false });
    }
}));
