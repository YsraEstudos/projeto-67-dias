import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FinalJourneySummaryComponent } from '../../../components/progress/FinalJourneySummary';
import { FinalJourneySummary } from '../../../types';

describe('FinalJourneySummaryComponent', () => {
    const mockSummary: FinalJourneySummary = {
        totalDays: 67,
        generatedAt: Date.now(),
        finalStats: {
            averageConsistency: 85,
            totalBooksRead: 5,
            totalPagesRead: 1200,
            totalSkillHours: 120,
            totalTasksCompleted: 45,
            totalHabitsCompleted: 300,
            totalJournalEntries: 50,
        },
        evolutionCurve: [60, 65, 70, 75, 80, 85, 90, 88, 92, 85],
        bestWeek: 9,
        challengingWeek: 1,
    };

    describe('Basic Rendering', () => {
        it('renders hero section with journey completion message', () => {
            render(<FinalJourneySummaryComponent summary={mockSummary} />);

            expect(screen.getByText(/Jornada Concluída/i)).toBeInTheDocument();
            expect(screen.getByText(/67 dias de transformação pessoal/i)).toBeInTheDocument();
        });

        it('renders all main stats correctly', () => {
            render(<FinalJourneySummaryComponent summary={mockSummary} />);

            // Consistency
            expect(screen.getByText('85%')).toBeInTheDocument();
            expect(screen.getByText('Consistência Média')).toBeInTheDocument();

            // Books
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Livros Lidos')).toBeInTheDocument();
            expect(screen.getByText('1200 páginas')).toBeInTheDocument();

            // Skills
            expect(screen.getByText('120h')).toBeInTheDocument();
            expect(screen.getByText('Horas de Estudo')).toBeInTheDocument();

            // Tasks
            expect(screen.getByText('45')).toBeInTheDocument();
            expect(screen.getByText('Tarefas Concluídas')).toBeInTheDocument();
        });

        it('renders secondary stats', () => {
            render(<FinalJourneySummaryComponent summary={mockSummary} />);

            expect(screen.getByText('300')).toBeInTheDocument();
            expect(screen.getByText('Check-ins de Hábitos')).toBeInTheDocument();

            expect(screen.getByText('50')).toBeInTheDocument();
            expect(screen.getByText('Entradas no Diário')).toBeInTheDocument();

            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('Semanas Registradas')).toBeInTheDocument();
        });

        it('renders best and challenging weeks', () => {
            render(<FinalJourneySummaryComponent summary={mockSummary} />);

            expect(screen.getByText('Melhor Semana')).toBeInTheDocument();
            expect(screen.getByText('Semana 9')).toBeInTheDocument();
            expect(screen.getByText('Score: 92 pontos')).toBeInTheDocument();

            expect(screen.getByText('Semana Desafiadora')).toBeInTheDocument();
            expect(screen.getByText('Semana 1')).toBeInTheDocument();
            expect(screen.getByText('Você superou!')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles zero values gracefully', () => {
            const emptySummary: FinalJourneySummary = {
                ...mockSummary,
                finalStats: {
                    averageConsistency: 0,
                    totalBooksRead: 0,
                    totalPagesRead: 0,
                    totalSkillHours: 0,
                    totalTasksCompleted: 0,
                    totalHabitsCompleted: 0,
                    totalJournalEntries: 0,
                },
                evolutionCurve: [],
            };

            render(<FinalJourneySummaryComponent summary={emptySummary} />);

            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('0h')).toBeInTheDocument();
        });

        it('handles bestWeek index out of evolutionCurve bounds', () => {
            const outOfBoundsSummary: FinalJourneySummary = {
                ...mockSummary,
                bestWeek: 15, // Out of bounds (evolutionCurve has 10 items)
            };

            render(<FinalJourneySummaryComponent summary={outOfBoundsSummary} />);

            // Should show 0 for score when index is out of bounds
            expect(screen.getByText('Score: 0 pontos')).toBeInTheDocument();
        });
    });
});
