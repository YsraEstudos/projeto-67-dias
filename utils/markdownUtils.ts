/**
 * Markdown Utilities
 * 
 * Funções utilitárias para conversão HTML→Markdown e manipulação de texto.
 * Usa apenas APIs nativas do browser (DOMParser).
 */

// Maximum HTML size to prevent performance issues (100KB)
const MAX_HTML_SIZE = 100 * 1024;

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

        // Clean up excessive whitespace
        return cleanMarkdown(result);
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
