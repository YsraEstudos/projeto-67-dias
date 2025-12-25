/**
 * EditableMarkdown - Componente de edição WYSIWYG para Markdown
 * 
 * Renderiza markdown formatado e permite edição inline com conversão
 * em tempo real para markdown usando MutationObserver.
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FloatingToolbar } from './FloatingToolbar';
import { htmlToMarkdown } from '../../utils/markdownUtils';

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
    const [isEmpty, setIsEmpty] = useState(!content.trim());

    // Sync external content changes to editor
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        // Only update if content actually changed from outside
        if (content !== lastContent.current && editorRef.current) {
            lastContent.current = content;
            // We need to re-render the markdown - this is handled by React re-render
        }
    }, [content]);

    // Convert HTML to Markdown and emit change
    const emitChange = useCallback(() => {
        if (!editorRef.current) return;

        const html = editorRef.current.innerHTML;

        // Check if empty
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

    // Setup MutationObserver for real-time changes
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const observer = new MutationObserver(() => {
            // Debounce slightly to batch rapid changes
            requestAnimationFrame(emitChange);
        });

        observer.observe(editor, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true
        });

        return () => observer.disconnect();
    }, [emitChange]);

    // Handle paste - convert to plain text to avoid HTML pollution
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();

        // Get HTML if available, otherwise plain text
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');

        if (html) {
            // Convert HTML to markdown then insert as text
            const markdown = htmlToMarkdown(html);
            document.execCommand('insertText', false, markdown);
        } else {
            document.execCommand('insertText', false, text);
        }
    }, []);

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
        requestAnimationFrame(emitChange);
    }, [emitChange]);

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
            >
                {content.trim() ? (
                    <MarkdownRenderer content={content} editable />
                ) : null}
            </div>
        </div>
    );
});

EditableMarkdown.displayName = 'EditableMarkdown';
