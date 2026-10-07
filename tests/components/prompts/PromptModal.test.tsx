import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

import PromptModal from '../../../components/prompts/PromptModal';
import { PromptCategory } from '../../../types';

const categoryButton = (name: RegExp) =>
    screen.getAllByRole('button', { name }).find(button => button.hasAttribute('aria-pressed'))!;

const categories: PromptCategory[] = [
    { id: 'geral', name: 'Geral', color: 'slate', icon: 'default', order: 0 },
    { id: 'codigo', name: 'Código', color: 'emerald', icon: 'code', order: 1 },
];

describe('PromptModal default category', () => {
    it('pre-selects the category currently filtered in the list', () => {
        render(<PromptModal prompt={null} categories={categories} defaultCategoryId="codigo" onClose={vi.fn()} onSave={vi.fn()} />);
        expect(categoryButton(/Código/)).toHaveAttribute('aria-pressed', 'true');
        expect(categoryButton(/Geral/)).toHaveAttribute('aria-pressed', 'false');
    });

    it('falls back to the first existing category when "geral" was deleted', () => {
        render(<PromptModal prompt={null} categories={[categories[1]]} onClose={vi.fn()} onSave={vi.fn()} />);
        expect(categoryButton(/Código/)).toHaveAttribute('aria-pressed', 'true');
    });

    it('ignores an unknown default category', () => {
        render(<PromptModal prompt={null} categories={categories} defaultCategoryId="missing" onClose={vi.fn()} onSave={vi.fn()} />);
        expect(categoryButton(/Geral/)).toHaveAttribute('aria-pressed', 'true');
    });
});
