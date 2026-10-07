/**
 * Normalizes user-typed URLs for links/sites/conversations.
 * - Adds https:// when the user typed only a domain (e.g. "google.com").
 * - Blocks dangerous schemes (javascript:, data:, vbscript:) by returning ''.
 */
const DANGEROUS_SCHEME = /^(javascript|data|vbscript):/i;
const SAFE_SCHEME = /^(https?|mailto|tel):/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export const normalizeExternalUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    // Remove whitespace and control characters that browsers ignore inside schemes
    const cleaned = url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    if (!cleaned) return '';
    if (DANGEROUS_SCHEME.test(cleaned)) return '';
    if (SAFE_SCHEME.test(cleaned)) return cleaned;
    // "localhost:3000" or "example.com:8080/path" look like schemes but are host:port
    const looksLikeHostPort = /^[^/:]+:\d+(\/|$)/.test(cleaned);
    if (HAS_SCHEME.test(cleaned) && !looksLikeHostPort) return '';
    return `https://${cleaned.replace(/^\/\//, '')}`;
};

/** Returns the hostname of a (possibly scheme-less) URL, or '' when invalid. */
export const getUrlHostname = (url: string | null | undefined): string => {
    const normalized = normalizeExternalUrl(url);
    if (!normalized) return '';
    try {
        return new URL(normalized).hostname;
    } catch {
        return '';
    }
};
