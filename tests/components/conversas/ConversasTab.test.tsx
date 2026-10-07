import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}));

import ConversasTab from '../../../components/conversas/ConversasTab';

const STORAGE_KEY = 'projeto67.conversas.markdown.v1';

const seed = (sourceUrl: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
        { id: '1', title: 'Conversa A', sourceUrl, markdown: '# Olá', createdAt: 1, updatedAt: 1 },
    ]));
};

describe('ConversasTab', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('normalizes scheme-less source links and neutralizes javascript: links', () => {
        seed('chatgpt.com/c/123');
        const { unmount } = render(<ConversasTab />);
        expect(screen.getByRole('link', { name: /chatgpt\.com/ })).toHaveAttribute('href', 'https://chatgpt.com/c/123');
        unmount();

        seed('javascript:alert(1)');
        render(<ConversasTab />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('opens a conversation with the keyboard', () => {
        seed('');
        render(<ConversasTab />);
        fireEvent.keyDown(screen.getByRole('button', { name: 'Abrir conversa Conversa A' }), { key: 'Enter' });
        expect(screen.getByRole('button', { name: /Copiar Markdown/ })).toBeInTheDocument();
    });

    it('copies the markdown from the viewer', async () => {
        seed('');
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        render(<ConversasTab />);
        fireEvent.click(screen.getByRole('button', { name: 'Abrir conversa Conversa A' }));
        fireEvent.click(screen.getByRole('button', { name: /Copiar Markdown/ }));
        expect(writeText).toHaveBeenCalledWith('# Olá');
        expect(await screen.findByText('Copiado!')).toBeInTheDocument();
    });

    it('does not crash when localStorage is full', () => {
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        render(<ConversasTab />);
        fireEvent.click(screen.getByRole('button', { name: /Nova Conversa/ }));
        fireEvent.change(screen.getByPlaceholderText(/Cole ou escreva aqui/), { target: { value: 'conteúdo' } });
        fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
        expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar');
        expect(screen.getByText('Nova conversa')).toBeInTheDocument();
    });
});
