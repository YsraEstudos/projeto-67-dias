import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeeklyReviewCard } from '../../../components/progress/WeeklyReviewCard';
import { WeeklySnapshot } from '../../../types';

describe('WeeklyReviewCard', () => {
    const mockSnapshot: WeeklySnapshot = {
        id: 'snapshot-1',
        weekNumber: 3,
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        capturedAt: Date.now(),
        metrics: {
            habitsCompleted: 21,
            habitsTotal: 28,
            habitConsistency: 75,
            booksProgress: 50,
            booksCompleted: 1,
            skillMinutes: 300,
            skillsProgressed: ['skill-1'],
            tasksCompleted: 10,
            journalEntries: 5,
            gamesHoursPlayed: 8,
            gamesCompleted: 1,
            gamesReviewed: 1,
        },
        evolution: {
            habitsChange: 5,
            skillsChange: 30,
            readingChange: 10,
            gamesChange: 2,
            overallScore: 82,
            trend: 'UP',
        },
        status: 'CONFIRMED',
    };

    const mockOnClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders week number and date range', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('Semana 3')).toBeInTheDocument();
        });

        it('renders metrics correctly', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('75%')).toBeInTheDocument(); // habitConsistency
            expect(screen.getByText('5h')).toBeInTheDocument(); // skillMinutes converted to hours
            expect(screen.getByText('50 págs')).toBeInTheDocument(); // booksProgress
            expect(screen.getByText('10')).toBeInTheDocument(); // tasksCompleted
            expect(screen.getByText('8h')).toBeInTheDocument(); // gamesHoursPlayed
        });

        it('renders overall score', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('82')).toBeInTheDocument(); // overallScore
        });
    });

    describe('Badges', () => {
        it('shows "Atual" badge when isCurrentWeek is true', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={true}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('Atual')).toBeInTheDocument();
        });

        it('shows "Melhor" badge when isBestWeek is true', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={true}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('Melhor')).toBeInTheDocument();
        });

        it('shows both badges when both conditions are true', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={true}
                    isBestWeek={true}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('Atual')).toBeInTheDocument();
            expect(screen.getByText('Melhor')).toBeInTheDocument();
        });
    });

    describe('Status Badge', () => {
        it('shows pending status when snapshot status is PENDING', () => {
            const pendingSnapshot = { ...mockSnapshot, status: 'PENDING' as const };
            render(
                <WeeklyReviewCard
                    snapshot={pendingSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText(/Aguardando confirmação/i)).toBeInTheDocument();
        });

        it('does not show pending status when snapshot status is CONFIRMED', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.queryByText(/Aguardando confirmação/i)).not.toBeInTheDocument();
        });
    });

    describe('Click Handler', () => {
        it('calls onClick when card is clicked', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            fireEvent.click(screen.getByText('Semana 3'));

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Evolution Indicators', () => {
        it('shows positive change indicator for habits', () => {
            render(
                <WeeklyReviewCard
                    snapshot={mockSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('+5%')).toBeInTheDocument();
        });

        it('handles negative changes', () => {
            const negativeSnapshot = {
                ...mockSnapshot,
                evolution: {
                    ...mockSnapshot.evolution!,
                    habitsChange: -10,
                    trend: 'DOWN' as const,
                },
            };

            render(
                <WeeklyReviewCard
                    snapshot={negativeSnapshot}
                    isCurrentWeek={false}
                    isBestWeek={false}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText('-10%')).toBeInTheDocument();
        });
    });
});
