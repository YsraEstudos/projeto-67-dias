import { describe, it, expect } from 'vitest';
import {
    htmlToMarkdown,
    wrapSelection,
    insertAtCursor,
    insertLink,
    autoPair
} from '../../utils/markdownUtils';

describe('markdownUtils', () => {
    describe('htmlToMarkdown', () => {
        describe('basic elements', () => {
            it('should convert h1 to markdown', () => {
                const html = '<h1>Título Principal</h1>';
                expect(htmlToMarkdown(html)).toBe('# Título Principal');
            });

            it('should convert h2 to markdown', () => {
                const html = '<h2>Subtítulo</h2>';
                expect(htmlToMarkdown(html)).toBe('## Subtítulo');
            });

            it('should convert h3 to markdown', () => {
                const html = '<h3>Seção</h3>';
                expect(htmlToMarkdown(html)).toBe('### Seção');
            });

            it('should convert h4-h6 to markdown', () => {
                expect(htmlToMarkdown('<h4>H4</h4>')).toBe('#### H4');
                expect(htmlToMarkdown('<h5>H5</h5>')).toBe('##### H5');
                expect(htmlToMarkdown('<h6>H6</h6>')).toBe('###### H6');
            });

            it('should convert paragraph to markdown', () => {
                const html = '<p>Este é um parágrafo.</p>';
                expect(htmlToMarkdown(html)).toBe('Este é um parágrafo.');
            });

            it('should convert multiple paragraphs', () => {
                const html = '<p>Primeiro.</p><p>Segundo.</p>';
                expect(htmlToMarkdown(html)).toBe('Primeiro.\n\nSegundo.');
            });
        });

        describe('text formatting', () => {
            it('should convert strong to bold', () => {
                const html = '<strong>negrito</strong>';
                expect(htmlToMarkdown(html)).toBe('**negrito**');
            });

            it('should convert b to bold', () => {
                const html = '<b>negrito</b>';
                expect(htmlToMarkdown(html)).toBe('**negrito**');
            });

            it('should convert em to italic', () => {
                const html = '<em>itálico</em>';
                expect(htmlToMarkdown(html)).toBe('*itálico*');
            });

            it('should convert i to italic', () => {
                const html = '<i>itálico</i>';
                expect(htmlToMarkdown(html)).toBe('*itálico*');
            });

            it('should convert del/s/strike to strikethrough', () => {
                expect(htmlToMarkdown('<del>riscado</del>')).toBe('~~riscado~~');
                expect(htmlToMarkdown('<s>riscado</s>')).toBe('~~riscado~~');
                expect(htmlToMarkdown('<strike>riscado</strike>')).toBe('~~riscado~~');
            });

            it('should handle nested formatting', () => {
                const html = '<p>Texto com <strong>negrito</strong> e <em>itálico</em>.</p>';
                expect(htmlToMarkdown(html)).toBe('Texto com **negrito** e *itálico*.');
            });

            it('should handle inline code', () => {
                const html = '<code>const x = 1;</code>';
                expect(htmlToMarkdown(html)).toBe('`const x = 1;`');
            });
        });

        describe('links and images', () => {
            it('should convert links to markdown', () => {
                const html = '<a href="https://example.com">Exemplo</a>';
                expect(htmlToMarkdown(html)).toBe('[Exemplo](https://example.com)');
            });

            it('should handle links without href', () => {
                const html = '<a>Texto</a>';
                expect(htmlToMarkdown(html)).toBe('Texto');
            });

            it('should skip javascript: links', () => {
                const html = '<a href="javascript:void(0)">Click</a>';
                expect(htmlToMarkdown(html)).toBe('Click');
            });

            it('should convert images', () => {
                const html = '<img src="img.jpg" alt="Descrição">';
                expect(htmlToMarkdown(html)).toBe('![Descrição](img.jpg)');
            });
        });

        describe('lists', () => {
            it('should convert unordered list', () => {
                const html = '<ul><li>Item A</li><li>Item B</li></ul>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('- Item A');
                expect(result).toContain('- Item B');
            });

            it('should convert ordered list', () => {
                const html = '<ol><li>Primeiro</li><li>Segundo</li><li>Terceiro</li></ol>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('1. Primeiro');
                expect(result).toContain('2. Segundo');
                expect(result).toContain('3. Terceiro');
            });

            it('should handle nested lists', () => {
                const html = '<ul><li>Item 1<ul><li>Sub-item</li></ul></li></ul>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('- Item 1');
                expect(result).toContain('- Sub-item');
            });
        });

        describe('code blocks', () => {
            it('should convert pre/code to fenced code block', () => {
                const html = '<pre><code>function hello() {\n  return "world";\n}</code></pre>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('```');
                expect(result).toContain('function hello()');
            });

            it('should extract language from code class', () => {
                const html = '<pre><code class="language-javascript">const x = 1;</code></pre>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('```javascript');
            });

            it('should handle pre without code element', () => {
                const html = '<pre>plain preformatted</pre>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('```');
                expect(result).toContain('plain preformatted');
            });
        });

        describe('blockquotes', () => {
            it('should convert blockquote', () => {
                const html = '<blockquote>Uma citação importante.</blockquote>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('> Uma citação');
            });

            it('should handle multi-line blockquotes', () => {
                const html = '<blockquote><p>Linha 1</p><p>Linha 2</p></blockquote>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('>');
            });
        });

        describe('tables', () => {
            it('should convert simple table', () => {
                const html = `
                    <table>
                        <tr><th>Nome</th><th>Idade</th></tr>
                        <tr><td>João</td><td>25</td></tr>
                    </table>
                `;
                const result = htmlToMarkdown(html);
                expect(result).toContain('| Nome | Idade |');
                expect(result).toContain('| --- |');
                expect(result).toContain('| João | 25 |');
            });
        });

        describe('edge cases', () => {
            it('should handle empty input', () => {
                expect(htmlToMarkdown('')).toBe('');
                expect(htmlToMarkdown(null as any)).toBe('');
                expect(htmlToMarkdown(undefined as any)).toBe('');
            });

            it('should handle plain text', () => {
                expect(htmlToMarkdown('Just plain text')).toBe('Just plain text');
            });

            it('should handle br tags', () => {
                const html = 'Linha 1<br>Linha 2';
                expect(htmlToMarkdown(html)).toBe('Linha 1\nLinha 2');
            });

            it('should handle hr tags', () => {
                const html = '<p>Antes</p><hr><p>Depois</p>';
                const result = htmlToMarkdown(html);
                expect(result).toContain('---');
            });

            it('should skip script and style tags', () => {
                const html = '<script>alert("xss")</script><p>Safe content</p><style>.x{}</style>';
                expect(htmlToMarkdown(html)).toBe('Safe content');
            });

            it('should handle transparent containers (div, span)', () => {
                const html = '<div><span>Nested</span> content</div>';
                expect(htmlToMarkdown(html)).toBe('Nested content');
            });

            it('should clean excessive whitespace', () => {
                const html = '<p>Multiple   spaces</p>\n\n\n<p>And newlines</p>';
                const result = htmlToMarkdown(html);
                expect(result).not.toMatch(/\n{3,}/);
            });
        });

        describe('complex documents', () => {
            it('should convert Gemini-style formatted content', () => {
                const html = `
                    <h2>Como funciona</h2>
                    <p>O sistema utiliza <strong>inteligência artificial</strong> para processar os dados.</p>
                    <ul>
                        <li>Análise de texto</li>
                        <li>Geração de resumos</li>
                    </ul>
                    <pre><code class="language-python">print("Hello, World!")</code></pre>
                `;
                const result = htmlToMarkdown(html);

                expect(result).toContain('## Como funciona');
                expect(result).toContain('**inteligência artificial**');
                expect(result).toContain('- Análise de texto');
                expect(result).toContain('```python');
            });
        });
    });

    describe('wrapSelection', () => {
        it('should wrap selection with bold markers', () => {
            const text = 'Hello world!';
            const result = wrapSelection(text, 6, 11, '**');

            expect(result.text).toBe('Hello **world**!');
            expect(result.newStart).toBe(8);
            expect(result.newEnd).toBe(13);
        });

        it('should wrap selection with italic markers', () => {
            const text = 'Some text here';
            const result = wrapSelection(text, 5, 9, '*');

            expect(result.text).toBe('Some *text* here');
            expect(result.newStart).toBe(6);
            expect(result.newEnd).toBe(10);
        });

        it('should wrap selection with backticks', () => {
            const text = 'Use the function here';
            const result = wrapSelection(text, 8, 16, '`');

            expect(result.text).toBe('Use the `function` here');
        });

        it('should unwrap if already wrapped', () => {
            const text = 'Hello **world**!';
            const result = wrapSelection(text, 8, 13, '**');

            expect(result.text).toBe('Hello world!');
            expect(result.newStart).toBe(6);
            expect(result.newEnd).toBe(11);
        });

        it('should handle empty selection', () => {
            const text = 'Hello world';
            const result = wrapSelection(text, 5, 5, '**');

            expect(result.text).toBe('Hello**** world');
        });
    });

    describe('insertAtCursor', () => {
        it('should insert text at cursor position', () => {
            const text = 'Hello world';
            const result = insertAtCursor(text, 5, ', beautiful');

            expect(result.text).toBe('Hello, beautiful world');
            expect(result.newCursor).toBe(16);
        });

        it('should insert at beginning', () => {
            const text = 'world';
            const result = insertAtCursor(text, 0, 'Hello ');

            expect(result.text).toBe('Hello world');
            expect(result.newCursor).toBe(6);
        });

        it('should insert at end', () => {
            const text = 'Hello';
            const result = insertAtCursor(text, 5, ' world');

            expect(result.text).toBe('Hello world');
            expect(result.newCursor).toBe(11);
        });
    });

    describe('insertLink', () => {
        it('should insert link template when no selection', () => {
            const text = 'Hello world';
            const result = insertLink(text, 5, 5);

            expect(result.text).toBe('Hello[link](url) world');
            expect(result.newStart).toBe(6); // After "["
            expect(result.newEnd).toBe(10); // Before "]"
        });

        it('should wrap selection as link text', () => {
            const text = 'Visit example for more';
            const result = insertLink(text, 6, 13);

            expect(result.text).toBe('Visit [example](url) for more');
            expect(result.newStart).toBe(16); // Start of "url"
            expect(result.newEnd).toBe(19); // End of "url"
        });
    });

    describe('autoPair', () => {
        it('should auto-pair brackets', () => {
            const text = 'Hello world';
            const result = autoPair(text, 5, '[');

            expect(result).not.toBeNull();
            expect(result!.text).toBe('Hello[] world');
            expect(result!.newCursor).toBe(6);
            expect(result!.paired).toBe(true);
        });

        it('should auto-pair parentheses', () => {
            const text = 'Hello world';
            const result = autoPair(text, 5, '(');

            expect(result).not.toBeNull();
            expect(result!.text).toBe('Hello() world');
        });

        it('should auto-pair backticks', () => {
            const text = 'Use  code here';
            const result = autoPair(text, 4, '`');

            expect(result).not.toBeNull();
            expect(result!.text).toBe('Use `` code here');
        });

        it('should not pair if next char is alphanumeric', () => {
            const text = 'Hello world';
            const result = autoPair(text, 0, '[');

            expect(result).toBeNull();
        });

        it('should return null for non-pairing chars', () => {
            const text = 'Hello world';
            const result = autoPair(text, 5, 'x');

            expect(result).toBeNull();
        });

        it('should skip over closing char if already present', () => {
            const text = 'Hello`` world';
            const result = autoPair(text, 6, '`');

            expect(result).not.toBeNull();
            expect(result!.text).toBe(text); // Text unchanged
            expect(result!.newCursor).toBe(7); // Cursor moved past closing char
        });
    });
});
