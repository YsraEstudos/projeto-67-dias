import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import { useSitesStore } from '../../stores/sitesStore';
import { useSiteFoldersStore } from '../../stores/siteFoldersStore';
import { useSiteCategoriesStore } from '../../stores/siteCategoriesStore';
import { useLinksStore } from '../../stores/linksStore';
import { usePromptsStore } from '../../stores/promptsStore';
import { Site, SiteFolder, SiteCategory, LinkItem, Prompt } from '../../types';

const site = (id: string): Site => ({ id, name: id, categoryId: 'personal', order: 0, createdAt: 0, updatedAt: 0 });
const folder = (id: string): SiteFolder => ({ id, name: id, siteId: 's1', order: 0, createdAt: 0, updatedAt: 0 });

describe('sitesStore / siteFoldersStore hydration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSitesStore.getState()._reset();
        useSiteFoldersStore.getState()._reset();
    });

    it('applies an empty remote sites list (all sites deleted on another device)', () => {
        useSitesStore.getState()._hydrateFromFirestore({ sites: [site('s1'), site('s2')] });
        expect(useSitesStore.getState().sites).toHaveLength(2);

        useSitesStore.getState()._hydrateFromFirestore({ sites: [] });
        expect(useSitesStore.getState().sites).toEqual([]);
    });

    it('keeps local sites when the remote document is missing', () => {
        useSitesStore.getState()._hydrateFromFirestore({ sites: [site('s1')] });
        useSitesStore.getState()._hydrateFromFirestore(null);
        expect(useSitesStore.getState().sites).toHaveLength(1);
        expect(useSitesStore.getState().isLoading).toBe(false);
    });

    it('applies an empty remote folders list', () => {
        useSiteFoldersStore.getState()._hydrateFromFirestore({ folders: [folder('f1')] });
        useSiteFoldersStore.getState()._hydrateFromFirestore({ folders: [] });
        expect(useSiteFoldersStore.getState().folders).toEqual([]);
    });
});

describe('siteCategoriesStore.deleteCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSiteCategoriesStore.getState()._reset();
    });

    it('re-parents children of the deleted category to its parent', () => {
        const cats: SiteCategory[] = [
            { id: 'personal', name: 'Meus Sites', color: 'indigo', icon: 'layout', order: 0, isDefault: true, parentId: null },
            { id: 'general', name: 'Sites Gerais', color: 'slate', icon: 'grid', order: 1, isDefault: true, parentId: null },
            { id: 'work', name: 'Trabalho', color: 'blue', icon: 'grid', order: 2, parentId: null },
            { id: 'dev', name: 'Dev', color: 'blue', icon: 'grid', order: 0, parentId: 'work' },
            { id: 'frontend', name: 'Frontend', color: 'blue', icon: 'grid', order: 0, parentId: 'dev' },
        ];
        useSiteCategoriesStore.getState()._hydrateFromFirestore({ categories: cats });

        useSiteCategoriesStore.getState().deleteCategory('dev');

        const state = useSiteCategoriesStore.getState().categories;
        expect(state.find(c => c.id === 'dev')).toBeUndefined();
        expect(state.find(c => c.id === 'frontend')!.parentId).toBe('work');
        expect(writeToFirestore).toHaveBeenCalled();
    });

    it('does not delete default categories', () => {
        useSiteCategoriesStore.getState()._hydrateFromFirestore(null);
        useSiteCategoriesStore.getState().deleteCategory('personal');
        expect(useSiteCategoriesStore.getState().categories.some(c => c.id === 'personal')).toBe(true);
    });
});

describe('counters tolerate missing legacy fields', () => {
    beforeEach(() => {
        useLinksStore.getState()._reset();
        usePromptsStore.getState()._reset();
    });

    it('incrementClickCount starts from 0 when clickCount is missing', () => {
        const legacyLink = { id: 'l1', title: 'x', url: 'https://x.com', siteId: 's1', order: 0, promptIds: [] } as unknown as LinkItem;
        useLinksStore.getState()._hydrateFromFirestore({ links: [legacyLink] });
        useLinksStore.getState().incrementClickCount('l1');
        expect(useLinksStore.getState().links[0].clickCount).toBe(1);
    });

    it('incrementCopyCount starts from 0 when copyCount is missing', () => {
        const legacyPrompt = { id: 'p1', title: 'x', content: 'y', category: 'geral', images: [], isFavorite: false, order: 0, createdAt: 0, updatedAt: 0 } as unknown as Prompt;
        usePromptsStore.getState()._hydrateFromFirestore({ prompts: [legacyPrompt], categories: [{ id: 'geral', name: 'Geral', color: 'slate', icon: 'default', order: 0 }] });
        usePromptsStore.getState().incrementCopyCount('p1');
        expect(usePromptsStore.getState().prompts[0].copyCount).toBe(1);
    });
});
