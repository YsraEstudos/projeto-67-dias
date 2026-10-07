import { describe, it, expect } from 'vitest';
import { siteMatchesQuery, groupLinksBySite } from '../../../components/links/siteSearch';
import { LinkItem, Site } from '../../../types';

const site: Site = { id: 's1', name: 'Google', description: 'Ferramentas de escritório', categoryId: 'personal', order: 0, createdAt: 0, updatedAt: 0 };
const makeLink = (id: string, siteId: string, order: number, title = 'Link', url = 'https://x.com'): LinkItem => ({
    id, siteId, order, title, url, clickCount: 0, promptIds: [],
});

describe('siteMatchesQuery', () => {
    const links = [makeLink('l1', 's1', 0, 'Drive', 'https://drive.google.com'), makeLink('l2', 's1', 1, 'Agenda', 'https://calendar.google.com')];

    it('matches everything when query is empty', () => {
        expect(siteMatchesQuery(site, [], '   ')).toBe(true);
    });

    it('matches by site name and description (case-insensitive)', () => {
        expect(siteMatchesQuery(site, [], 'goo')).toBe(true);
        expect(siteMatchesQuery(site, [], 'ESCRITÓRIO')).toBe(true);
    });

    it('matches by link title or url', () => {
        expect(siteMatchesQuery(site, links, 'agenda')).toBe(true);
        expect(siteMatchesQuery(site, links, 'drive.google')).toBe(true);
    });

    it('does not match unrelated text', () => {
        expect(siteMatchesQuery(site, links, 'netflix')).toBe(false);
    });
});

describe('groupLinksBySite', () => {
    it('groups by siteId, sorts by order and skips links without site', () => {
        const map = groupLinksBySite([
            makeLink('b', 's1', 2),
            makeLink('a', 's1', 0),
            makeLink('c', 's2', 0),
            makeLink('orphan', '', 0),
        ]);
        expect(map.get('s1')!.map(l => l.id)).toEqual(['a', 'b']);
        expect(map.get('s2')!.map(l => l.id)).toEqual(['c']);
        expect(map.has('')).toBe(false);
    });
});
