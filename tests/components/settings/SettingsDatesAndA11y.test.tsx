import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FocusSkillsCarousel } from '../../../components/settings/FocusSkillsCarousel';
import { SettingsCategory } from '../../../components/settings/SettingsCategory';
import { StreakCard } from '../../../components/settings/StreakCard';
import { TasksProgressSection } from '../../../components/progress/TasksProgressSection';
import { useStreakStore } from '../../../stores';
import { Skill, OrganizeTask } from '../../../types';

const makeSkill = (id: string, name: string): Skill => ({
    id,
    name,
    level: 'Intermediário',
    currentMinutes: 0,
    goalMinutes: 100,
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: 1,
});

describe('FocusSkillsCarousel', () => {
    it('does not crash when the currently shown skill is removed from focus', () => {
        const skills = [makeSkill('a', 'Alpha'), makeSkill('b', 'Beta')];
        const props = {
            skills,
            onToggleFocusSkill: vi.fn(),
            onUpdateWeight: vi.fn(),
            totalFocusWeight: 100,
        };
        const { rerender } = render(
            <FocusSkillsCarousel {...props} focusSkills={[{ skillId: 'a', weight: 50 }, { skillId: 'b', weight: 50 }]} />,
        );
        // Navega até o último item
        fireEvent.click(screen.getByLabelText(/próxim/i));
        expect(screen.getByText('Beta')).toBeInTheDocument();

        expect(() =>
            rerender(<FocusSkillsCarousel {...props} focusSkills={[{ skillId: 'a', weight: 100 }]} />),
        ).not.toThrow();
        expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
});

describe('SettingsCategory', () => {
    it('exposes expanded state and hides collapsed content from keyboard/AT', () => {
        const { rerender } = render(
            <SettingsCategory id="x" title="Cat" description="d" icon={null} iconBgColor="" isExpanded={false} onToggle={vi.fn()}>
                <button>Interno</button>
            </SettingsCategory>,
        );
        const header = screen.getByRole('button', { name: /Cat/ });
        expect(header).toHaveAttribute('aria-expanded', 'false');
        expect(header).toHaveAttribute('aria-controls', 'settings-category-x');
        expect(document.getElementById('settings-category-x')).toHaveAttribute('inert');

        rerender(
            <SettingsCategory id="x" title="Cat" description="d" icon={null} iconBgColor="" isExpanded onToggle={vi.fn()}>
                <button>Interno</button>
            </SettingsCategory>,
        );
        expect(header).toHaveAttribute('aria-expanded', 'true');
        expect(document.getElementById('settings-category-x')).not.toHaveAttribute('inert');
    });
});

// Fuso negativo (Brasil) expõe o bug de interpretar YYYY-MM-DD como UTC
const ORIGINAL_TZ = process.env.TZ;
const useSaoPauloTZ = () => {
    beforeEach(() => { process.env.TZ = 'America/Sao_Paulo'; });
    afterEach(() => { process.env.TZ = ORIGINAL_TZ; });
};

describe('StreakCard dates', () => {
    useSaoPauloTZ();
    it('renders YYYY-MM-DD dates in local time (no off-by-one day)', () => {
        useStreakStore.setState({
            currentStreak: 3,
            streakStartDate: '2026-03-05',
            lastActiveDate: '2026-03-07',
        });
        render(<StreakCard />);
        const expected = new Date(2026, 2, 5).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        expect(screen.getByText(expected)).toBeInTheDocument();
    });
});

describe('TasksProgressSection overdue detection', () => {
    useSaoPauloTZ();
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 7, 9, 0, 0)); // 07/10/2026 09:00 local
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    const task = (id: string, dueDate: string): OrganizeTask => ({
        id,
        title: `Tarefa ${id}`,
        isCompleted: false,
        isArchived: false,
        category: 'Geral',
        dueDate,
        createdAt: 1,
    });

    it('does not mark a task due today as overdue, but does flag yesterday', () => {
        const { rerender } = render(<TasksProgressSection tasks={[task('hoje', '2026-10-07')]} />);
        expect(screen.getByText('Tarefa hoje').closest('div.rounded-xl')?.className).not.toContain('bg-red-900/20');

        rerender(<TasksProgressSection tasks={[task('ontem', '2026-10-06')]} />);
        expect(screen.getByText('Tarefa ontem').closest('div.rounded-xl')?.className).toContain('bg-red-900/20');
    });
});
