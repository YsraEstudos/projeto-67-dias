/**
 * Prompts Store - Prompts and categories with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt, PromptCategory } from '../types';
import { createFirebaseStorage } from './persistMiddleware';
import { DEFAULT_PROMPTS, DEFAULT_PROMPT_CATEGORIES } from '../constants/defaultData';

interface PromptsState {
    prompts: Prompt[];
    categories: PromptCategory[];
    isLoading: boolean;

    // Prompt Actions
    setPrompts: (prompts: Prompt[]) => void;
    addPrompt: (prompt: Prompt) => void;
    updatePrompt: (id: string, updates: Partial<Prompt>) => void;
    deletePrompt: (id: string) => void;
    incrementCopyCount: (id: string) => void;
    toggleFavorite: (id: string) => void;
    initializeDefaults: () => void;

    // Category Actions
    setCategories: (categories: PromptCategory[]) => void;
    addCategory: (category: PromptCategory) => void;
    updateCategory: (id: string, updates: Partial<PromptCategory>) => void;
    deleteCategory: (id: string) => void;
    reorderCategories: (categories: PromptCategory[]) => void;

    setLoading: (loading: boolean) => void;
}

export const usePromptsStore = create<PromptsState>()(
    persist(
        (set) => ({
            prompts: [],
            categories: [],
            isLoading: true,

            // Prompt Actions
            setPrompts: (prompts) => set({ prompts }),

            addPrompt: (prompt) => set((state) => ({
                prompts: [...state.prompts, prompt]
            })),

            updatePrompt: (id, updates) => set((state) => ({
                prompts: state.prompts.map(p =>
                    p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
                )
            })),

            deletePrompt: (id) => set((state) => ({
                prompts: state.prompts.filter(p => p.id !== id)
            })),

            incrementCopyCount: (id) => set((state) => ({
                prompts: state.prompts.map(p =>
                    p.id === id ? { ...p, copyCount: p.copyCount + 1 } : p
                )
            })),

            toggleFavorite: (id) => set((state) => ({
                prompts: state.prompts.map(p =>
                    p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
                )
            })),

            initializeDefaults: () => set((state) => {
                const hasData = state.prompts.length > 0 || state.categories.length > 0;
                if (hasData) return state; // Don't overwrite if data exists

                return {
                    prompts: DEFAULT_PROMPTS,
                    categories: DEFAULT_PROMPT_CATEGORIES,
                    isLoading: false
                };
            }),

            // Category Actions
            setCategories: (categories) => set({ categories }),

            addCategory: (category) => set((state) => ({
                categories: [...state.categories, category]
            })),

            updateCategory: (id, updates) => set((state) => ({
                categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteCategory: (id) => set((state) => ({
                categories: state.categories.filter(c => c.id !== id)
            })),

            reorderCategories: (categories) => set({ categories }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_prompts_store',
            storage: createFirebaseStorage('p67_prompts_store'),
            partialize: (state) => ({ prompts: state.prompts, categories: state.categories }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate prompts (same id)
                if (state?.prompts?.length) {
                    const seen = new Set<string>();
                    const uniquePrompts = state.prompts.filter(p => {
                        if (seen.has(p.id)) return false;
                        seen.add(p.id);
                        return true;
                    });
                    if (uniquePrompts.length !== state.prompts.length) {
                        state.setPrompts(uniquePrompts);
                    }
                }
                // Clean up any duplicate categories (same id)
                if (state?.categories?.length) {
                    const seen = new Set<string>();
                    const uniqueCategories = state.categories.filter(c => {
                        if (seen.has(c.id)) return false;
                        seen.add(c.id);
                        return true;
                    });
                    if (uniqueCategories.length !== state.categories.length) {
                        state.setCategories(uniqueCategories);
                    }
                }

                // Auto-initialize defaults if empty
                if ((!state?.prompts || state.prompts.length === 0) && (!state?.categories || state.categories.length === 0)) {
                    state?.initializeDefaults();
                }

                state?.setLoading(false);
            },
        }
    )
);
