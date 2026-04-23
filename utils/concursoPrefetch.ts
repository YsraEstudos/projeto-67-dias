const CONCURSO_ENTRY_PATH = '/concurso/';
const PREFETCH_LINK_DATA_ATTR = 'data-concurso-prefetch';

let concursoPrefetchPromise: Promise<void> | null = null;
const prefetchedHrefs = new Set<string>();

const buildAbsoluteHref = (href: string): string => new URL(href, window.location.origin).toString();

const inferAsValue = (href: string): HTMLLinkElement['as'] | undefined => {
  if (href.endsWith('.css')) {
    return 'style';
  }

  if (href.endsWith('.js') || href.endsWith('.mjs')) {
    return 'script';
  }

  if (href.endsWith('/')) {
    return 'document';
  }

  return undefined;
};

const appendPrefetchHint = (href: string): void => {
  const absoluteHref = buildAbsoluteHref(href);

  if (prefetchedHrefs.has(absoluteHref)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = absoluteHref;
  link.dataset.concursoPrefetch = 'true';

  const asValue = inferAsValue(href);
  if (asValue) {
    link.as = asValue;
  }

  document.head.append(link);
  prefetchedHrefs.add(absoluteHref);
};

const extractConcursoAssets = (html: string): string[] => {
  const matches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)];
  return [
    ...new Set(
      matches
        .map(([, value]) => value)
        .filter(
          (value) =>
            value.startsWith(CONCURSO_ENTRY_PATH) &&
            /\.(?:css|js|mjs)(?:\?|$)/.test(value),
        ),
    ),
  ];
};

export const clearConcursoPrefetchCache = (): void => {
  concursoPrefetchPromise = null;
  prefetchedHrefs.clear();
  document.querySelectorAll(`link[${PREFETCH_LINK_DATA_ATTR}="true"]`).forEach((link) => link.remove());
};

export const warmConcursoEntryPoint = (): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (concursoPrefetchPromise) {
    return concursoPrefetchPromise;
  }

  concursoPrefetchPromise = (async () => {
    appendPrefetchHint(CONCURSO_ENTRY_PATH);

    try {
      const response = await fetch(CONCURSO_ENTRY_PATH, { credentials: 'same-origin' });
      if (!response.ok) {
        return;
      }

      const html = await response.text();
      extractConcursoAssets(html).forEach(appendPrefetchHint);
    } catch {
      // Prefetch is best-effort only.
    }
  })();

  return concursoPrefetchPromise;
};
