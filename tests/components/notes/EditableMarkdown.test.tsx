import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditableMarkdown } from '../../../components/notes/EditableMarkdown';

// Mock MarkdownRenderer
vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-renderer">{content}</div>
}));

// Mock FloatingToolbar
vi.mock('../../../components/notes/FloatingToolbar', () => ({
    FloatingToolbar: () => <div data-testid="floating-toolbar" />
}));

// Mock htmlToMarkdown
vi.mock('../../../utils/markdownUtils', () => ({
    htmlToMarkdown: (html: string) => html.replace(/<[^>]*>/g, '')
}));

describe('EditableMarkdown', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders with content', () => {
            render(
                <EditableMarkdown
                    content="# Hello World"
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
            expect(screen.getByTestId('markdown-renderer')).toHaveTextContent('# Hello World');
        });

        it('renders placeholder when content is empty', () => {
            const { container } = render(
                <EditableMarkdown
                    content=""
                    onChange={mockOnChange}
                    placeholder="Digite aqui..."
                />
            );

            // Should have placeholder attribute on contenteditable div
            const editableDiv = container.querySelector('[data-placeholder="Digite aqui..."]');
            expect(editableDiv).toBeInTheDocument();
        });

        it('includes FloatingToolbar component', () => {
            render(
                <EditableMarkdown
                    content="Test content"
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByTestId('floating-toolbar')).toBeInTheDocument();
        });
    });

    describe('ContentEditable behavior', () => {
        it('has contentEditable attribute', () => {
            const { container } = render(
                <EditableMarkdown
                    content="Editable content"
                    onChange={mockOnChange}
                />
            );

            const editableDiv = container.querySelector('[contenteditable="true"]');
            expect(editableDiv).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(
                <EditableMarkdown
                    content="Test"
                    onChange={mockOnChange}
                    className="custom-class"
                />
            );

            const editableDiv = container.querySelector('[contenteditable="true"]');
            expect(editableDiv).toHaveClass('custom-class');
        });
    });

    describe('Props', () => {
        it('accepts content prop', () => {
            render(
                <EditableMarkdown
                    content="My content"
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByText('My content')).toBeInTheDocument();
        });

        it('accepts onChange callback', () => {
            expect(() => {
                render(
                    <EditableMarkdown
                        content=""
                        onChange={mockOnChange}
                    />
                );
            }).not.toThrow();
        });

        it('accepts placeholder prop', () => {
            const { container } = render(
                <EditableMarkdown
                    content=""
                    onChange={mockOnChange}
                    placeholder="Custom placeholder"
                />
            );

            const editableDiv = container.querySelector('[data-placeholder]');
            expect(editableDiv).toHaveAttribute('data-placeholder', 'Custom placeholder');
        });
    });

    describe('Export', () => {
        it('exports EditableMarkdown component', () => {
            expect(EditableMarkdown).toBeDefined();
        });
    });
});
