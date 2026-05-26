/**
 * EditableMarkdown - Componente de edição WYSIWYG para Markdown
 * 
 * Renderiza markdown formatado e permite edição inline com conversão
 * em tempo real para markdown usando eventos de input.
 * 
 * SOLUÇÃO DO BUG DE LOOP INFINITO:
 * - Não renderiza componentes React dentro do contentEditable
 * - Usa HTML estático gerado uma vez na montagem
 * - Usa onInput ao invés de MutationObserver para evitar ciclos
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { FloatingToolbar } from './FloatingToolbar';
import { htmlToMarkdown, markdownToHtml } from '../../utils/markdownUtils';

interface EditableMarkdownProps {
    content: string;
    onChange: (markdown: string) => void;
    className?: string;
    placeholder?: string;
}

export const EditableMarkdown: React.FC<EditableMarkdownProps> = React.memo(({
    content,
    onChange,
    className = '',
    placeholder = 'Clique para editar...'
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);
    const lastContent = useRef(content);
    const isInitialized = useRef(false);
    const [isEmpty, setIsEmpty] = useState(!content.trim());

    // Initialize editor with HTML content only once
    useEffect(() => {
        if (!editorRef.current || isInitialized.current) return;

        isInitialized.current = true;
        if (content.trim()) {
            const html = markdownToHtml(content);
            editorRef.current.innerHTML = html;
        }
    }, []);

    // Sync external content changes to editor (only when content changes from outside)
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        // Only update if content actually changed from outside
        if (content !== lastContent.current && editorRef.current && isInitialized.current) {
            lastContent.current = content;
            const html = markdownToHtml(content);

            // Save cursor position
            const selection = window.getSelection();
            const savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;

            editorRef.current.innerHTML = html;

            // Restore cursor if possible
            if (savedRange && selection) {
                try {
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                } catch (e) {
                    // Cursor restoration failed, that's ok
                }
            }

            setIsEmpty(!content.trim());
        }
    }, [content]);

    // Handle input changes - convert HTML back to Markdown
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;

        const html = editorRef.current.innerHTML;
        const textContent = editorRef.current.textContent || '';

        setIsEmpty(!textContent.trim());

        // Convert to markdown
        const markdown = htmlToMarkdown(html);

        if (markdown !== lastContent.current) {
            isInternalChange.current = true;
            lastContent.current = markdown;
            onChange(markdown);
        }
    }, [onChange]);

    // Save checkbox state when user clicks a checklist checkbox.
    // contentEditable doesn't fire `input` for checkbox changes,
    // so we use a click listener on the container instead.
    useEffect(() => {
        const container = editorRef.current;
        if (!container) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' || (target as HTMLInputElement).type !== 'checkbox') return;

            const checkbox = target as HTMLInputElement;
            const label = checkbox.parentElement?.querySelector('label');

            // Update label styling immediately
            if (label) {
                if (checkbox.checked) {
                    label.classList.add('line-through', 'text-slate-500');
                    label.classList.remove('text-slate-300');
                } else {
                    label.classList.remove('line-through', 'text-slate-500');
                    label.classList.add('text-slate-300');
                }
            }

            // Persist to markdown after the DOM settles
            requestAnimationFrame(() => {
                if (!editorRef.current) return;
                const markdown = htmlToMarkdown(editorRef.current.innerHTML);
                if (markdown !== lastContent.current) {
                    isInternalChange.current = true;
                    lastContent.current = markdown;
                    onChange(markdown);
                }
            });
        };

        container.addEventListener('click', handleClick);
        return () => container.removeEventListener('click', handleClick);
    }, [onChange]);

    // Handle paste - prefer plain text when clipboard looks like markdown
    // to avoid losing checklist syntax ([ ]) buried in rich HTML.
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();

        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');

        // If plain text looks like markdown (has checklist syntax, headings, or
        // list markers) prefer it directly — it carries the raw syntax intact.
        const looksLikeMarkdown = /^\s*[\*\-\d]+[\s\.]|\[[ xX]\]|^#+\s/m.test(text);

        if (looksLikeMarkdown || !html) {
            // Insert as raw markdown; the `handleInput` → `markdownToHtml` pipeline
            // will render it correctly on the next input event.
            document.execCommand('insertText', false, text);
        } else {
            // Rich HTML paste (e.g., from a webpage) — convert to markdown first
            const markdown = htmlToMarkdown(html);
            document.execCommand('insertText', false, markdown);
        }

        // Re-render the editor so inserted markdown becomes styled HTML
        requestAnimationFrame(() => {
            if (!editorRef.current) return;
            const rawText = editorRef.current.innerText;
            const rendered = markdownToHtml(rawText);
            if (rendered !== editorRef.current.innerHTML) {
                editorRef.current.innerHTML = rendered;
                // Fire onChange so the store is updated
                const markdown = htmlToMarkdown(rendered);
                isInternalChange.current = true;
                lastContent.current = markdown;
                onChange(markdown);
            }
        });
    }, [onChange]);

    // Handle format commands from toolbar
    const handleFormat = useCallback((command: string, value?: string) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        switch (command) {
            case 'bold':
                document.execCommand('bold', false);
                break;
            case 'italic':
                document.execCommand('italic', false);
                break;
            case 'code':
                // Wrap in <code> tag
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                const codeElement = document.createElement('code');
                codeElement.className = 'bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono';
                codeElement.textContent = selectedText;
                range.deleteContents();
                range.insertNode(codeElement);
                break;
            case 'createLink':
                if (value) {
                    document.execCommand('createLink', false, value);
                }
                break;
            case 'heading':
                // Convert to h2
                document.execCommand('formatBlock', false, 'h2');
                break;
            case 'list':
                document.execCommand('insertUnorderedList', false);
                break;
            case 'quote':
                document.execCommand('formatBlock', false, 'blockquote');
                break;
        }

        // Trigger change after formatting
        requestAnimationFrame(handleInput);
    }, [handleInput]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && e.key === 'b') {
            e.preventDefault();
            handleFormat('bold');
        } else if (isCtrlOrCmd && e.key === 'i') {
            e.preventDefault();
            handleFormat('italic');
        } else if (isCtrlOrCmd && e.key === 'k') {
            e.preventDefault();
            const url = prompt('Digite a URL:', 'https://');
            if (url && url !== 'https://') {
                handleFormat('createLink', url);
            }
        }
    }, [handleFormat]);

    return (
        <div className="relative">
            {/* Floating Toolbar */}
            <FloatingToolbar
                containerRef={editorRef}
                onFormat={handleFormat}
            />

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className={`
                    outline-none min-h-[200px] 
                    focus:ring-2 focus:ring-purple-500/20 rounded-xl
                    prose prose-invert prose-lg max-w-none
                    ${isEmpty ? 'before:content-[attr(data-placeholder)] before:text-slate-500 before:italic before:pointer-events-none' : ''}
                    ${className}
                `}
                data-placeholder={placeholder}
            />
        </div>
    );
});

EditableMarkdown.displayName = 'EditableMarkdown';
