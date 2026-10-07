import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
    subscribeToDocument: vi.fn(() => vi.fn()),
    getCurrentUserId: vi.fn(() => 'test-user'),
}));

import LinksView from '../../../components/views/LinksView';
import { useLinksStore } from '../../../stores/linksStore';
import { useSitesStore } from '../../../stores/sitesStore';
import { useSiteFoldersStore } from '../../../stores/siteFoldersStore';
import { useSiteCategoriesStore, DEFAULT_SITE_CATEGORIES } from '../../../stores/siteCategoriesStore';
import { usePromptsStore } from '../../../stores/promptsStore';
import { LinkItem, Site, SiteCategory } from '../../../types';

const sites: Site[] = [
    { id: 's1', name: 'Google', categoryId: 'personal', order: 0, createdAt: 0, updatedAt: 0 },
    { id: 's2', name: 'GitHub', categoryId: 'personal', order: 1, createdAt: 0, updatedAt: 0 },
];
const links: LinkItem[] = [
    { id: 'l1', title: 'Drive', url: 'https://drive.google.com', siteId: 's1', order: 0, clickCount: 0, promptIds: [] },
    { id: 'l2', title: 'Agenda', url: 'calendar.google.com', siteId: 's1', order: 1, clickCount: 0, promptIds: [] },
    { id: 'l3', title: 'Repos', url: 'https://github.com', siteId: 's2', order: 0, clickCount: 0, promptIds: [] },
];

const seedStores = (categories: SiteCategory[] = DEFAULT_SITE_CATEGORIES) => {
    useSiteCategoriesStore.getState()._hydrateFromFirestore({ categories });
    useSitesStore.getState()._hydrateFromFirestore({ sites });
    useSiteFoldersStore.getState()._hydrateFromFirestore({
        folders: [{ id: 'f1', name: 'Docs', siteId: 's1', order: 0, createdAt: 0, updatedAt: 0 }],
    });
    useLinksStore.getState()._hydrateFromFirestore({ links });
    usePromptsStore.getState()._hydrateFromFirestore({ prompts: [], categories: [] });
};

const getSiteCard = (name: string) => screen.getByRole('heading', { name }).closest('div.group') as HTMLElement;

describe('LinksView', () => {
    beforeEach(() => {
        [useLinksStore, useSitesStore, useSiteFoldersStore, useSiteCategoriesStore, usePromptsStore]
            .forEach(store => store.getState()._reset());
        seedStores();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('search matches link titles inside sites', () => {
        render(<LinksView />);
        fireEvent.change(screen.getByPlaceholderText('Buscar sites e links...'), { target: { value: 'agenda' } });
        expect(screen.getByRole('heading', { name: 'Google' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'GitHub' })).not.toBeInTheDocument();
    });

    it('deleting a site also removes its links and folders', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<LinksView />);
        const card = getSiteCard('Google');
        fireEvent.click(within(card).getByRole('button', { name: 'Opções do site Google' }));
        fireEvent.click(within(card).getByText('Excluir Site'));

        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Os 2 links dentro dele também serão excluídos.'));
        expect(useSitesStore.getState().sites.map(s => s.id)).toEqual(['s2']);
        expect(useLinksStore.getState().links.map(l => l.id)).toEqual(['l3']);
        expect(useSiteFoldersStore.getState().folders).toEqual([]);
    });

    it('opens scheme-less links with https and noopener', () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        render(<LinksView />);
        fireEvent.click(screen.getByText('Agenda'));
        expect(openSpy).toHaveBeenCalledWith('https://calendar.google.com', '_blank', 'noopener,noreferrer');
        expect(useLinksStore.getState().links.find(l => l.id === 'l2')!.clickCount).toBe(1);
    });

    it('link rows are keyboard accessible', () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        render(<LinksView />);
        fireEvent.keyDown(screen.getByText('Repos').closest('[role="link"]')!, { key: 'Enter' });
        expect(openSpy).toHaveBeenCalledWith('https://github.com', '_blank', 'noopener,noreferrer');
    });

    it('saves new links with a normalized URL', async () => {
        render(<LinksView />);
        const card = getSiteCard('GitHub');
        fireEvent.click(within(card).getAllByText('Adicionar Link').at(-1)!);
        fireEvent.change(await screen.findByLabelText('Título do Site'), { target: { value: 'Gists' } });
        fireEvent.change(screen.getByLabelText('URL (Endereço)'), { target: { value: 'gist.github.com' } });
        fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

        const saved = useLinksStore.getState().links.find(l => l.title === 'Gists')!;
        expect(saved.url).toBe('https://gist.github.com');
        expect(saved.siteId).toBe('s2');
        expect(saved.order).toBe(1);
    });

    it('deleting a category moves its sites to a fallback category', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        [useSitesStore, useSiteCategoriesStore].forEach(store => store.getState()._reset());
        useSiteCategoriesStore.getState()._hydrateFromFirestore({
            categories: [...DEFAULT_SITE_CATEGORIES, { id: 'work', name: 'Trabalho', color: 'blue', icon: 'grid', order: 2, parentId: null }],
        });
        useSitesStore.getState()._hydrateFromFirestore({ sites: [{ ...sites[0], categoryId: 'work' }] });

        render(<LinksView />);
        const workTab = screen.getByRole('button', { name: /Trabalho/ }).parentElement!;
        fireEvent.click(within(workTab).getByTitle('Opções'));
        fireEvent.click(within(workTab).getByText('Excluir'));

        expect(useSiteCategoriesStore.getState().categories.some(c => c.id === 'work')).toBe(false);
        expect(useSitesStore.getState().sites[0].categoryId).toBe('personal');
    });
});
