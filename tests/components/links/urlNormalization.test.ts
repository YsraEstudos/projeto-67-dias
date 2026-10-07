import { describe, it, expect } from 'vitest';
import { normalizeExternalUrl, getUrlHostname } from '../../../components/links/urlNormalization';

describe('normalizeExternalUrl', () => {
    it('adds https:// to bare domains', () => {
        expect(normalizeExternalUrl('google.com')).toBe('https://google.com');
        expect(normalizeExternalUrl('  httpbin.org/get ')).toBe('https://httpbin.org/get');
        expect(normalizeExternalUrl('//cdn.example.com/x')).toBe('https://cdn.example.com/x');
    });

    it('keeps safe schemes untouched', () => {
        expect(normalizeExternalUrl('http://example.com')).toBe('http://example.com');
        expect(normalizeExternalUrl('HTTPS://Example.com/a?b=1')).toBe('HTTPS://Example.com/a?b=1');
        expect(normalizeExternalUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    });

    it('treats host:port as a domain, not a scheme', () => {
        expect(normalizeExternalUrl('localhost:3000')).toBe('https://localhost:3000');
        expect(normalizeExternalUrl('example.com:8080/path')).toBe('https://example.com:8080/path');
    });

    it('blocks dangerous or unknown schemes', () => {
        expect(normalizeExternalUrl('javascript:alert(1)')).toBe('');
        expect(normalizeExternalUrl(' JAVASCRIPT:alert(1)')).toBe('');
        expect(normalizeExternalUrl('java\u0000script:alert(1)')).toBe('');
        expect(normalizeExternalUrl('data:text/html,<b>x</b>')).toBe('');
        expect(normalizeExternalUrl('ftp://files.example.com')).toBe('');
    });

    it('returns empty string for empty input', () => {
        expect(normalizeExternalUrl('')).toBe('');
        expect(normalizeExternalUrl('   ')).toBe('');
        expect(normalizeExternalUrl(undefined)).toBe('');
    });
});

describe('getUrlHostname', () => {
    it('extracts hostname from scheme-less urls', () => {
        expect(getUrlHostname('www.github.com/user')).toBe('www.github.com');
        expect(getUrlHostname('https://docs.google.com/x')).toBe('docs.google.com');
    });

    it('returns empty for invalid/dangerous urls', () => {
        expect(getUrlHostname('javascript:alert(1)')).toBe('');
        expect(getUrlHostname('')).toBe('');
    });
});
