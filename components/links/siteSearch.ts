import { LinkItem, Site } from '../../types';

/**
 * Returns true when the site matches the search query by its name, description,
 * or by the title/URL of any of its links.
 */
export const siteMatchesQuery = (site: Site, siteLinks: LinkItem[], query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    if (site.name.toLowerCase().includes(normalizedQuery)) return true;
    if (site.description?.toLowerCase().includes(normalizedQuery)) return true;

    return siteLinks.some(link =>
        (link.title || '').toLowerCase().includes(normalizedQuery) ||
        (link.url || '').toLowerCase().includes(normalizedQuery)
    );
};

/** Groups links by siteId, sorted by order, for O(1) lookup per site. */
export const groupLinksBySite = (links: LinkItem[]): Map<string, LinkItem[]> => {
    const map = new Map<string, LinkItem[]>();
    for (const link of links) {
        if (!link.siteId) continue;
        const bucket = map.get(link.siteId);
        if (bucket) bucket.push(link);
        else map.set(link.siteId, [link]);
    }
    for (const bucket of map.values()) {
        bucket.sort((a, b) => a.order - b.order);
    }
    return map;
};
