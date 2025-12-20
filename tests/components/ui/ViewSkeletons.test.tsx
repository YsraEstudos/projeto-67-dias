import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    HabitsViewSkeleton,
    ReadingViewSkeleton,
    SkillsViewSkeleton,
    ProgressViewSkeleton,
    GenericViewSkeleton,
    ChartSkeleton
} from '../../../components/ui/ViewSkeletons';

describe('ViewSkeletons', () => {
    describe('HabitsViewSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<HabitsViewSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has animate-pulse class for loading effect', () => {
            const { container } = render(<HabitsViewSkeleton />);
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('ReadingViewSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<ReadingViewSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders book grid placeholders', () => {
            const { container } = render(<ReadingViewSkeleton />);
            // Should have multiple skeleton cards
            const skeletonCards = container.querySelectorAll('.rounded-2xl');
            expect(skeletonCards.length).toBeGreaterThan(3);
        });
    });

    describe('SkillsViewSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<SkillsViewSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('ProgressViewSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<ProgressViewSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders hero card placeholder', () => {
            const { container } = render(<ProgressViewSkeleton />);
            // Should have large hero card
            const heroCard = container.querySelector('.h-48');
            expect(heroCard).toBeInTheDocument();
        });
    });

    describe('GenericViewSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<GenericViewSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('ChartSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<ChartSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has chart height placeholder', () => {
            const { container } = render(<ChartSkeleton />);
            const chartArea = container.querySelector('.h-\\[250px\\]');
            expect(chartArea).toBeInTheDocument();
        });
    });
});
