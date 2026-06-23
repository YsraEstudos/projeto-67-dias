import { describe, expect, it } from 'vitest';
import { normalizeAulasMathMarkdown } from '../../utils/aulasMarkdown';

describe('normalizeAulasMathMarkdown', () => {
    it('converts standalone square-bracket formula blocks into display math', () => {
        const markdown = [
            'Porcentagem representa uma fração:',
            '',
            '[',
            'p%=\\frac{p}{100}',
            ']',
            '',
            'Texto seguinte.',
        ].join('\n');

        expect(normalizeAulasMathMarkdown(markdown)).toBe([
            'Porcentagem representa uma fração:',
            '',
            '$$',
            'p%=\\frac{p}{100}',
            '$$',
            '',
            'Texto seguinte.',
        ].join('\n'));
    });

    it('preserves ordinary markdown links and bracketed prose', () => {
        const markdown = 'Consulte [a referência](https://example.com) e mantenha [este texto].';

        expect(normalizeAulasMathMarkdown(markdown)).toBe(markdown);
    });
});
