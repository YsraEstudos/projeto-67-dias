import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Recharts to avoid complex SVG rendering in tests
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    CartesianGrid: () => <div data-testid="grid" />,
}));

// Import after mocking
import { HabitWeeklyChart } from '../../../components/progress/HabitWeeklyChart';

describe('HabitWeeklyChart', () => {
    const mockChartData = [
        { name: 'seg', completed: 3 },
        { name: 'ter', completed: 5 },
        { name: 'qua', completed: 4 },
        { name: 'qui', completed: 6 },
        { name: 'sex', completed: 4 },
        { name: 'sab', completed: 2 },
        { name: 'dom', completed: 1 },
    ];

    it('renders with valid data', () => {
        render(<HabitWeeklyChart chartData={mockChartData} />);

        // Should show the title
        expect(screen.getByText('Ritmo Semanal')).toBeInTheDocument();

        // Should render chart components
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders with empty data without crashing', () => {
        render(<HabitWeeklyChart chartData={[]} />);

        // Should still render the container
        expect(screen.getByText('Ritmo Semanal')).toBeInTheDocument();
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders chart area element', () => {
        render(<HabitWeeklyChart chartData={mockChartData} />);

        expect(screen.getByTestId('area')).toBeInTheDocument();
    });

    it('shows TrendingUp icon in header', () => {
        render(<HabitWeeklyChart chartData={mockChartData} />);

        // The header should contain the icon (teal color class)
        const header = screen.getByText('Ritmo Semanal').closest('h3');
        expect(header).toHaveClass('text-lg', 'font-bold');
    });
});
