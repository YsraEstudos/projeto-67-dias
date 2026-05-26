import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownRenderer } from '../../../components/notes/MarkdownRenderer';

describe('MarkdownRenderer', () => {
    it('keeps plain line-separated paragraphs readable in narrow panels', () => {
        render(
            <MarkdownRenderer
                content={`Descricao fornecida pelo item
TIPI/NCM oficial
NESH
Pesquisas oficiais/decisoes da Receita, quando houver`}
            />
        );

        const paragraph = screen.getByText(/Descricao fornecida pelo item/);

        expect(paragraph).toHaveClass('whitespace-pre-line');
        expect(paragraph).toHaveClass('wrap-anywhere');
    });

    it('constrains the markdown root to the available width', () => {
        const { container } = render(
            <MarkdownRenderer content="codigo/referencia; marca/fabricante; modelo;" />
        );

        expect(container.firstElementChild).toHaveClass('min-w-0');
        expect(container.firstElementChild).toHaveClass('max-w-full');
    });

    it('renders GFM checklist items without regular bullet points', () => {
        render(<MarkdownRenderer content="* [ ] Melhorar o **Pomodoro**" />);

        const checkbox = screen.getByRole('checkbox');
        const listItem = checkbox.closest('li');
        const list = checkbox.closest('ul');

        expect(checkbox).toBeInTheDocument();
        expect(listItem).toHaveClass('list-none');
        expect(list).toHaveClass('list-none');
        expect(list).not.toHaveClass('list-disc');
        expect(screen.getByText('Pomodoro')).toHaveClass('font-bold');
    });

    it('renders every checklist item in a pasted markdown block as a checkbox', () => {
        const content = [
            '* [ ] Melhorar a experiência de uso no **Pomodoro**.',
            '',
            '* [ ] No **Pomodoro**, adicionar uma função de foco.',
            '',
            '* [ ] Integrar melhor o **Pomodoro com o módulo de trabalho**.',
        ].join('\n');

        render(<MarkdownRenderer content={content} />);

        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(screen.getByText('Pomodoro com o módulo de trabalho')).toHaveClass('font-bold');
    });
});
