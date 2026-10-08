import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RandomQuestionsModal from '../../../components/views/AulasView/RandomQuestionsModal';
import { AulaBook, AulaFolder } from '../../../types';

describe('RandomQuestionsModal layout', () => {
    it('keeps the modal within the viewport and scrolls its main content', () => {
        render(
            <RandomQuestionsModal
                books={[]}
                onClose={vi.fn()}
            />,
        );

        const dialog = screen.getByRole('dialog', { name: 'Central de revisão' });
        expect(dialog).toHaveClass('max-w-[96rem]', 'max-h-[calc(100dvh-1rem)]', 'flex', 'flex-col');

        const content = screen.getByTestId('random-questions-content');
        expect(content).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    });

    it('allows selecting and filtering by specific study folder', () => {
        const mockFolders: AulaFolder[] = [
            { id: 'f-1', name: 'Direito Constitucional', position: 0 },
            { id: 'f-2', name: 'Direito Administrativo', position: 1 },
        ];

        const mockBooks: AulaBook[] = [
            {
                id: 'b-1',
                folderId: 'f-1',
                title: 'Controle de Constitucionalidade',
                coverImage: null,
                targetDate: null,
                position: 0,
                chapters: [
                    {
                        id: 'c-1',
                        title: 'Ação Direta de Inconstitucionalidade',
                        position: 0,
                        relatedQuestions: {
                            aula: 1,
                            titulo: 'Controle Concentrado',
                            questoes_principais: [1, 2, 3],
                            por_secao: [],
                            questoes_secundarias_que_misturam_com_aulas_futuras: [],
                        },
                    },
                ],
            },
            {
                id: 'b-2',
                folderId: 'f-2',
                title: 'Atos Administrativos',
                coverImage: null,
                targetDate: null,
                position: 0,
                chapters: [
                    {
                        id: 'c-2',
                        title: 'Elementos do Ato',
                        position: 0,
                        relatedQuestions: {
                            aula: 1,
                            titulo: 'Atos e Poderes',
                            questoes_principais: [4, 5],
                            por_secao: [],
                            questoes_secundarias_que_misturam_com_aulas_futuras: [],
                        },
                    },
                ],
            },
        ];

        render(
            <RandomQuestionsModal
                books={mockBooks}
                folders={mockFolders}
                onClose={vi.fn()}
            />,
        );

        // Verifica que o seletor de pasta existe
        const folderSelect = screen.getByLabelText(/Pasta de Revisão/i);
        expect(folderSelect).toBeInTheDocument();

        // Inicialmente mostra "Todas as Pastas"
        expect(folderSelect).toHaveValue('all');

        // Seleciona a pasta "Direito Constitucional"
        fireEvent.change(folderSelect, { target: { value: 'f-1' } });

        // Verifica que o texto informativo atualizou
        expect(screen.getByText(/Filtrando por: Direito Constitucional/i)).toBeInTheDocument();
    });
});
