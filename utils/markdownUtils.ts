/**
/**
 * Markdown Utilities
 * 
 * Funções utilitárias para conversão HTML→Markdown e manipulação de texto.
 * Usa apenas APIs nativas do browser (DOMParser).
 */

// Maximum HTML size to prevent performance issues (100KB)
const MAX_HTML_SIZE = 100 * 1024;

export interface MarkdownClasses {
    pre?: string;
    inlineCode?: string;
    h1?: string;
    h2?: string;
    h3?: string;
    h4?: string;
    h5?: string;
    h6?: string;
    blockquote?: string;
    hr?: string;
    strong?: string;
    em?: string;
    del?: string;
    a?: string;
    img?: string;
    checklistUl?: string;
    checklistLi?: string;
    checkbox?: string;
    label?: string;
    labelChecked?: string;
    li?: string;
    ul?: string;
    p?: string;
}

export const DEFAULT_MARKDOWN_CLASSES: MarkdownClasses = {
    pre: 'bg-slate-900 border border-slate-700 rounded-lg p-4 mb-3 overflow-x-auto text-sm font-mono text-slate-300',
    inlineCode: 'bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono',
    h1: 'text-2xl font-bold text-white mb-3 mt-4 border-b border-slate-700 pb-2',
    h2: 'text-xl font-bold text-white mb-2 mt-4',
    h3: 'text-lg font-semibold text-white mb-2 mt-3',
    h4: 'text-base font-semibold text-slate-200 mb-2 mt-2',
    h5: 'text-sm font-semibold text-slate-200 mb-2',
    h6: 'text-sm font-semibold text-slate-200 mb-2',
    blockquote: 'border-l-4 border-purple-500 pl-4 py-1 my-3 bg-purple-500/5 rounded-r-lg italic text-slate-400',
    hr: 'border-slate-700 my-4',
    strong: 'font-bold text-white',
    em: 'italic text-slate-200',
    del: 'line-through text-slate-500',
    a: 'text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors',
    img: 'max-w-full rounded-lg my-3 border border-slate-700',
    checklistUl: 'space-y-2 mb-3 pl-0',
    checklistLi: 'flex items-start gap-2 text-slate-300 leading-relaxed list-none',
    checkbox: 'mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 accent-purple-500 cursor-pointer shrink-0',
    label: 'cursor-pointer text-slate-300',
    labelChecked: 'cursor-pointer line-through text-slate-500',
    li: 'text-slate-300 leading-relaxed',
    ul: 'list-disc list-inside space-y-1 mb-3 text-slate-300 ml-2',
    p: 'text-slate-300 leading-relaxed mb-3',
};

/**
 * Converts HTML content to Markdown format.
 * 
 * Supports: h1-h6, p, strong/b, em/i, ul/ol/li, a, code, pre, blockquote, br, hr, del
 * 
 * @param html - The HTML string to convert
 * @returns The converted Markdown string
 */
export function htmlToMarkdown(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Limit HTML size for performance
    if (html.length > MAX_HTML_SIZE) {
        console.warn('HTML too large, using plain text fallback');
        return extractPlainText(html);
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Process the body content
        const result = processNode(doc.body);

        // Clean up excessive whitespace and normalize checklist artifacts
        return normalizeMarkdownForStorage(cleanMarkdown(result));
    } catch (error) {
        console.error('Error parsing HTML:', error);
        return extractPlainText(html);
    }
}

/**
 * Extracts plain text from HTML as a fallback.
 */
function extractPlainText(html: string): string {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    } catch {
        // Last resort: strip tags with regex
        return html.replace(/<[^>]*>/g, '');
    }
}

/**
 * Recursively processes DOM nodes and converts them to Markdown.
 */
function processNode(node: Node, context: ProcessContext = {}): string {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // Preserve whitespace in preformatted blocks
        if (context.inPre) {
            return text;
        }
        // Normalize whitespace for other text
        return text.replace(/\s+/g, ' ');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
        case 'h1':
            return `# ${processChildren(element, context)}\n\n`;
        case 'h2':
            return `## ${processChildren(element, context)}\n\n`;
        case 'h3':
            return `### ${processChildren(element, context)}\n\n`;
        case 'h4':
            return `#### ${processChildren(element, context)}\n\n`;
        case 'h5':
            return `##### ${processChildren(element, context)}\n\n`;
        case 'h6':
            return `###### ${processChildren(element, context)}\n\n`;

        case 'p':
            return `${processChildren(element, context)}\n\n`;

        case 'br':
            return '\n';

        case 'hr':
            return '\n---\n\n';

        case 'strong':
        case 'b':
            return `**${processChildren(element, context).trim()}**`;

        case 'em':
        case 'i':
            return `*${processChildren(element, context).trim()}*`;

        case 'del':
        case 's':
        case 'strike':
            return `~~${processChildren(element, context).trim()}~~`;

        case 'a': {
            const href = element.getAttribute('href') || '';
            const text = processChildren(element, context).trim();
            if (!href || href.startsWith('javascript:')) {
                return text;
            }
            return `[${text}](${href})`;
        }

        case 'code': {
            // Check if inside a pre tag (block code)
            if (context.inPre) {
                return processChildren(element, { ...context, inPre: true });
            }
            // Inline code
            const codeText = element.textContent || '';
            return `\`${codeText}\``;
        }

        case 'pre': {
            const codeElement = element.querySelector('code');
            let codeText: string;
            let language = '';

            if (codeElement) {
                codeText = codeElement.textContent || '';
                // Try to extract language from class
                const classAttr = codeElement.getAttribute('class') || '';
                const langMatch = classAttr.match(/language-(\w+)/);
                if (langMatch) {
                    language = langMatch[1];
                }
            } else {
                codeText = element.textContent || '';
            }

            return `\n\`\`\`${language}\n${codeText.trim()}\n\`\`\`\n\n`;
        }

        case 'blockquote': {
            const content = processChildren(element, context).trim();
            const lines = content.split('\n');
            return lines.map(line => `> ${line}`).join('\n') + '\n\n';
        }

        case 'ul':
            return processListItems(element, context, '-') + '\n';

        case 'ol':
            return processListItems(element, context, 'numbered') + '\n';

        case 'li': {
            // Preserve rendered GFM task-list items when saving rich editor HTML.
            const checklistItem = processChecklistListItem(element, context);
            if (checklistItem) return checklistItem;

            const content = processChildren(element, context).trim();
            // li elements are handled by processListItems
            return content;
        }

        case 'table':
            return processTable(element, context);

        case 'img': {
            const src = element.getAttribute('src') || '';
            const alt = element.getAttribute('alt') || '';
            return `![${alt}](${src})`;
        }

        case 'div':
        case 'span':
        case 'section':
        case 'article':
        case 'main':
        case 'header':
        case 'footer':
        case 'nav':
        case 'aside':
            // Transparent containers - just process children
            return processChildren(element, context);

        case 'script':
        case 'style':
        case 'noscript':
            // Skip these elements entirely
            return '';

        default:
            // For unknown elements, process children
            return processChildren(element, context);
    }
}

interface ProcessContext {
    inPre?: boolean;
    listDepth?: number;
}

/**
 * Processes all child nodes of an element.
 */
function processChildren(element: Element, context: ProcessContext): string {
    let result = '';
    for (const child of Array.from(element.childNodes)) {
        result += processNode(child, context);
    }
    return result;
}

/**
 * Processes list items (ul/ol).
 */
function processListItems(element: Element, context: ProcessContext, marker: string | 'numbered'): string {
    const items = element.querySelectorAll(':scope > li');
    const depth = context.listDepth || 0;
    const indent = '  '.repeat(depth);

    let result = '';
    let itemNumber = 1;

    for (const item of Array.from(items)) {
        const checklistItem = processChecklistListItem(item as Element, context);
        if (checklistItem) {
            result += `${indent}${checklistItem}\n`;
            itemNumber++;
            continue;
        }

        const content = processChildren(item as Element, { ...context, listDepth: depth + 1 }).trim();
        const prefix = marker === 'numbered' ? `${itemNumber}.` : marker;

        // Handle multi-line content
        const lines = content.split('\n');
        result += `${indent}${prefix} ${lines[0]}\n`;

        // Indent continuation lines
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                result += `${indent}  ${lines[i]}\n`;
            }
        }

        itemNumber++;
    }

    return result;
}

function processChecklistListItem(element: Element, context: ProcessContext): string | null {
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (!checkbox) return null;

    const input = checkbox as HTMLInputElement;
    const isChecked = input.checked || input.hasAttribute('checked');
    const label = element.querySelector('label');
    const content = label
        ? processChildren(label, context).trim()
        : getChecklistFallbackContent(element, context);

    return `${isChecked ? '- [x]' : '- [ ]'} ${content}`.trimEnd();
}

function getChecklistFallbackContent(element: Element, context: ProcessContext): string {
    const clone = element.cloneNode(true) as Element;
    clone.querySelectorAll('input[type="checkbox"]').forEach(input => input.remove());
    return processChildren(clone, context).trim();
}

/**
 * Processes HTML tables to Markdown tables.
 */
function processTable(element: Element, context: ProcessContext): string {
    const rows = element.querySelectorAll('tr');
    if (rows.length === 0) return '';

    let result = '\n';
    let isHeader = true;

    for (const row of Array.from(rows)) {
        const cells = row.querySelectorAll('th, td');
        const cellContents = Array.from(cells).map(cell =>
            processChildren(cell as Element, context).trim().replace(/\|/g, '\\|')
        );

        result += `| ${cellContents.join(' | ')} |\n`;

        // Add separator after header row
        if (isHeader && cells.length > 0) {
            result += `|${' --- |'.repeat(cells.length)}\n`;
            isHeader = row.querySelector('th') !== null;
        }
    }

    return result + '\n';
}

/**
 * Cleans up the generated Markdown.
 */
function cleanMarkdown(markdown: string): string {
    return markdown
        // Remove more than 2 consecutive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace on each line (except in code blocks)
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        // Remove leading/trailing whitespace from the whole string
        .trim();
}

/**
 * Wraps selected text with formatting characters.
 * 
 * @param text - The full text content
 * @param start - Selection start position
 * @param end - Selection end position
 * @param wrapper - The wrapper characters (e.g., '**' for bold)
 * @returns Object with new text and cursor position
 */
export function wrapSelection(
    text: string,
    start: number,
    end: number,
    wrapper: string
): { text: string; newStart: number; newEnd: number } {
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    // Check if already wrapped - if so, unwrap
    const wrappedStart = before.endsWith(wrapper);
    const wrappedEnd = after.startsWith(wrapper);

    if (wrappedStart && wrappedEnd) {
        // Unwrap
        const newText = before.slice(0, -wrapper.length) + selected + after.slice(wrapper.length);
        return {
            text: newText,
            newStart: start - wrapper.length,
            newEnd: end - wrapper.length
        };
    }

    // Wrap the selection
    const newText = before + wrapper + selected + wrapper + after;
    return {
        text: newText,
        newStart: start + wrapper.length,
        newEnd: end + wrapper.length
    };
}

/**
 * Inserts text at the cursor position.
 * 
 * @param text - The full text content
 * @param cursorPos - Current cursor position
 * @param insert - Text to insert
 * @returns Object with new text and cursor position
 */
export function insertAtCursor(
    text: string,
    cursorPos: number,
    insert: string
): { text: string; newCursor: number } {
    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);

    return {
        text: before + insert + after,
        newCursor: cursorPos + insert.length
    };
}

/**
 * Inserts a link template at the cursor or wraps selection.
 * 
 * @param text - The full text content
 * @param start - Selection start position
 * @param end - Selection end position
 * @returns Object with new text and cursor position (positioned at URL placeholder)
 */
export function insertLink(
    text: string,
    start: number,
    end: number
): { text: string; newStart: number; newEnd: number } {
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    if (selected) {
        // Wrap selection as link text
        const newText = before + `[${selected}](url)` + after;
        // Position cursor to select "url"
        return {
            text: newText,
            newStart: start + selected.length + 3, // After "[text]("
            newEnd: start + selected.length + 6 // Before ")"
        };
    } else {
        // Insert link template
        const newText = before + '[link](url)' + after;
        // Position cursor to select "link"
        return {
            text: newText,
            newStart: start + 1, // After "["
            newEnd: start + 5 // Before "]"
        };
    }
}

/**
 * Auto-pairs characters like brackets and quotes.
 * 
 * @param text - The full text content
 * @param cursorPos - Current cursor position
 * @param char - The opening character typed
 * @returns Object with new text, cursor position, and whether pairing occurred
 */
export function autoPair(
    text: string,
    cursorPos: number,
    char: string
): { text: string; newCursor: number; paired: boolean } | null {
    const pairs: Record<string, string> = {
        '[': ']',
        '(': ')',
        '{': '}',
        '`': '`',
        '"': '"',
        "'": "'"
    };

    const closingChar = pairs[char];
    if (!closingChar) {
        return null;
    }

    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);

    // Don't auto-pair if next char is alphanumeric
    if (after.length > 0 && /\w/.test(after[0])) {
        return null;
    }

    // For quotes and backticks, check if we're closing an existing pair
    if (char === closingChar && after.startsWith(char)) {
        return {
            text: text,
            newCursor: cursorPos + 1,
            paired: true
        };
    }

    return {
        text: before + char + closingChar + after,
        newCursor: cursorPos + 1,
        paired: true
    };
}

/**
 * Converts Markdown content to HTML format.
 * 
 * Simple converter for use in contentEditable areas.
 * Supports: headings, bold, italic, links, lists, code, blockquotes
 * 
 * @param markdown - The Markdown string to convert
 * @param customClasses - Optional custom CSS classes
 * @returns The converted HTML string
 */
export function markdownToHtml(markdown: string, customClasses?: MarkdownClasses): string {
    if (!markdown || typeof markdown !== 'string') {
        return '';
    }

    const classes = { ...DEFAULT_MARKDOWN_CLASSES, ...customClasses };
    let html = normalizeMarkdownForStorage(markdown);

    // Escape HTML entities first
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 1. Protect fenced code blocks using placeholders
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const key = `@@@BLOCKCODE_${codeBlocks.length}@@@`;
        const cssPre = classes.pre || '';
        const langClass = lang ? `language-${lang}` : '';
        codeBlocks.push(`<pre class="${cssPre}"><code class="${langClass}">${code.trim()}</code></pre>`);
        return key;
    });

    // 2. Protect inline code using placeholders
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (_, code) => {
        const key = `@@@INLINECODE_${inlineCodes.length}@@@`;
        const cssCode = classes.inlineCode || '';
        inlineCodes.push(`<code class="${cssCode}">${code}</code>`);
        return key;
    });

    // 3. Block elements
    // Blockquotes
    if (classes.blockquote) {
        html = html.replace(/^> (.+)$/gm, `<blockquote class="${classes.blockquote}">$1</blockquote>`);
    } else {
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    }

    // Headings
    html = html.replace(/^###### (.+)$/gm, (_, content) => `<h6 class="${classes.h6 || ''}">${content}</h6>`);
    html = html.replace(/^##### (.+)$/gm, (_, content) => `<h5 class="${classes.h5 || ''}">${content}</h5>`);
    html = html.replace(/^#### (.+)$/gm, (_, content) => `<h4 class="${classes.h4 || ''}">${content}</h4>`);
    html = html.replace(/^### (.+)$/gm, (_, content) => `<h3 class="${classes.h3 || ''}">${content}</h3>`);
    html = html.replace(/^## (.+)$/gm, (_, content) => `<h2 class="${classes.h2 || ''}">${content}</h2>`);
    html = html.replace(/^# (.+)$/gm, (_, content) => `<h1 class="${classes.h1 || ''}">${content}</h1>`);

    // Horizontal rule
    html = html.replace(/^---$/gm, `<hr class="${classes.hr || ''}" />`);

    // 4. Inline elements
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, (_, content) => `<strong class="${classes.strong || ''}">${content}</strong>`);

    // Italic
    html = html.replace(/\*(.+?)\*/g, (_, content) => `<em class="${classes.em || ''}">${content}</em>`);

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, (_, content) => `<del class="${classes.del || ''}">${content}</del>`);

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}" class="${classes.img || ''}" />`);

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${classes.a || ''}">${text}</a>`);

    // 5. List items
    // Checklist items — must come BEFORE generic unordered list processing.
    // Supports: - [ ] unchecked, - [x] checked, * [ ] unchecked, * [x] checked
    html = html.replace(
        /^[\*\-] \[( |x|X)\] (.+)$/gm,
        (_, checked, label) => {
            const isChecked = checked.toLowerCase() === 'x';
            const id = `chk-${Math.random().toString(36).slice(2, 8)}`;
            const cssLi = classes.checklistLi || '';
            const cssCheckbox = classes.checkbox || '';
            const cssLabel = isChecked ? (classes.labelChecked || '') : (classes.label || '');
            return (
                `<li class="${cssLi}" data-checklist-item>` +
                `<input type="checkbox" id="${id}"` +
                (isChecked ? ' checked' : '') +
                ` class="${cssCheckbox}" />` +
                `<label for="${id}" class="cursor-pointer ${cssLabel}">${label}</label>` +
                `</li>`
            );
        }
    );
    // Wrap consecutive checklist <li> items into a <ul>
    html = html.replace(
        /(<li[^>]*data-checklist-item[^>]*>[\s\S]*?<\/li>\n?)+/g,
        (match) => `<ul class="${classes.checklistUl || ''}">${match}</ul>`
    );

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, (_, content) => `<li class="${classes.li || ''}">${content}</li>`);
    html = html.replace(/^\* (.+)$/gm, (_, content) => `<li class="${classes.li || ''}">${content}</li>`);
    // Wrap non-checklist li items in a ul
    html = html.replace(
        /(<li(?![^>]*data-checklist-item)[^>]*>[\s\S]*?<\/li>\n?)+/g,
        (match) => `<ul class="${classes.ul || ''}">${match}</ul>`
    );

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, (_, content) => `<li class="${classes.li || ''}">${content}</li>`);

    // Paragraphs (lines that don't start with HTML tags or blockcode placeholders)
    html = html.replace(/^(?!<[a-z])(.+)$/gm, (match, content) => {
        // Skip if it's just whitespace
        if (!content.trim()) return match;
        // Skip if it's already in a tag
        if (content.startsWith('<')) return content;
        // Skip if it's a code block placeholder
        if (content.startsWith('@@@BLOCKCODE')) return content;
        return `<p class="${classes.p || ''}">${content}</p>`;
    });

    // Clean up double paragraphs and empty paragraphs
    html = html.replace(/<p[^>]*><\/p>/g, '');
    html = html.replace(/\n\n+/g, '\n');

    // 6. Restore protected code blocks & inline code
    inlineCodes.forEach((codeHtml, i) => {
        html = html.replace(`@@@INLINECODE_${i}@@@`, () => codeHtml);
    });
    codeBlocks.forEach((codeHtml, i) => {
        html = html.replace(`@@@BLOCKCODE_${i}@@@`, () => codeHtml);
    });

    return html.trim();
}

export function normalizeMarkdownForStorage(markdown: string): string {
    return normalizeChecklistMarkdown(markdown).trim();
}

function normalizeChecklistMarkdown(markdown: string): string {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const normalizedLines: string[] = [];
    let isInCodeFence = false;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const isFenceLine = line.trimStart().startsWith('```');

        if (isFenceLine) {
            normalizedLines.push(line);
            isInCodeFence = !isInCodeFence;
            continue;
        }

        if (isInCodeFence) {
            normalizedLines.push(line);
            continue;
        }

        if (isStrayMarkerBeforeChecklist(line, findNextNonEmptyLine(lines, index + 1))) {
            continue;
        }

        normalizedLines.push(normalizeChecklistLine(line));
    }

    return normalizedLines.join('\n');
}

function isStrayMarkerBeforeChecklist(line: string, nextLine?: string): boolean {
    const marker = line.trim();
    return (marker === '-' || marker === '*') && isChecklistMarkdownLine(nextLine || '');
}

function normalizeChecklistLine(line: string): string {
    const match = line.match(/^\s*[\*\-]\s+\[( |x|X)\]\s+(.+)$/);
    if (!match) return line;

    const checked = match[1].toLowerCase() === 'x' ? 'x' : ' ';
    return `- [${checked}] ${match[2].trimStart()}`;
}

function isChecklistMarkdownLine(line: string): boolean {
    return /^\s*[\*\-]\s+\[( |x|X)\]\s+.+/.test(line);
}

function findNextNonEmptyLine(lines: string[], startIndex: number): string {
    for (let index = startIndex; index < lines.length; index++) {
        if (lines[index].trim()) return lines[index];
    }
    return '';
}

