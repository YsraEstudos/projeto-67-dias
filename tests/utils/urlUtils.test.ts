import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from '../../utils/urlUtils';

describe('urlUtils', () => {
    describe('sanitizeUrl', () => {
        it('should allow http: links', () => {
            expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
        });

        it('should allow https: links', () => {
            expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1');
        });

        it('should allow mailto: links', () => {
            expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
        });

        it('should allow tel: links', () => {
            expect(sanitizeUrl('tel:+123456789')).toBe('tel:+123456789');
        });

        it('should allow relative paths', () => {
            expect(sanitizeUrl('/path/to/resource')).toBe('/path/to/resource');
            expect(sanitizeUrl('./path/to/resource')).toBe('./path/to/resource');
            expect(sanitizeUrl('../path/to/resource')).toBe('../path/to/resource');
        });

        it('should allow fragments', () => {
            expect(sanitizeUrl('#section1')).toBe('#section1');
        });

        it('should block javascript: links', () => {
            expect(sanitizeUrl('javascript:alert("XSS")')).toBe('#');
            expect(sanitizeUrl('JAVASCRIPT:alert("XSS")')).toBe('#');
            expect(sanitizeUrl(' javascript:alert("XSS")')).toBe('#');
        });

        it('should block data: links', () => {
            expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
        });

        it('should block vbscript: links', () => {
            expect(sanitizeUrl('vbscript:msgbox("XSS")')).toBe('#');
        });

        it('should block unknown protocols', () => {
            expect(sanitizeUrl('unknown:protocol')).toBe('#');
        });

        it('should handle null, undefined and empty strings', () => {
            expect(sanitizeUrl(null)).toBe('#');
            expect(sanitizeUrl(undefined)).toBe('#');
            expect(sanitizeUrl('')).toBe('#');
        });

        it('should remove control characters and still block dangerous protocols', () => {
            // \u0001 is a control character
            expect(sanitizeUrl('java\u0001script:alert(1)')).toBe('#');
        });
    });
});
