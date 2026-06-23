import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RandomQuestionsModal from '../../../components/views/AulasView/RandomQuestionsModal';

describe('RandomQuestionsModal layout', () => {
    it('keeps the modal within the viewport and scrolls its main content', () => {
        render(
            <RandomQuestionsModal
                books={[]}
                onClose={vi.fn()}
                onSetQuestionStatus={vi.fn()}
            />,
        );

        const dialog = screen.getByRole('dialog', { name: 'Questões aleatórias' });
        expect(dialog).toHaveClass('max-h-[calc(100dvh-2rem)]', 'flex', 'flex-col');

        const content = screen.getByTestId('random-questions-content');
        expect(content).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    });
});
