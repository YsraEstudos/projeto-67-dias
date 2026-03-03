/**
 * URL Utilities for security and sanitization
 */

/**
 * Sanitizes a URL to prevent XSS attacks through javascript: or other dangerous protocols.
 * Allows only http:, https:, mailto:, and tel: protocols.
 *
 * @param url - The URL string to sanitize
 * @returns The original URL if safe, or '#' if potentially dangerous
 */
export function sanitizeUrl(url: string | undefined | null): string {
    if (!url) return '#';

    // Remove whitespace and control characters
    const sanitized = url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Common dangerous patterns
    const dangerousProtocols = /^(javascript|data|vbscript):/i;

    // Allowed safe protocols
    const safeProtocols = /^(https?|mailto|tel):/i;

    // Check if it starts with a dangerous protocol
    if (dangerousProtocols.test(sanitized)) {
        return '#';
    }

    // If it has a protocol, ensure it's a safe one
    // Also allow relative paths (starting with / or .) and fragments (#)
    if (/^[a-z0-9+.-]+:/i.test(sanitized)) {
        return safeProtocols.test(sanitized) ? sanitized : '#';
    }

    return sanitized;
}
