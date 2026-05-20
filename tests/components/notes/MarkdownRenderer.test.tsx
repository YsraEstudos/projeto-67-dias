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
});
