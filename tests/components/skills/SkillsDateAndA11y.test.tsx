import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressStats } from '../../../components/skills/ProgressStats';
import { CreateSkillModal } from '../../../components/skills/CreateSkillModal';
import { SessionHistoryModal } from '../../../components/skills/SessionHistoryModal';
import { MicroAchievementsTab } from '../../../components/skills/MicroAchievementsTab';
import { useConfigStore } from '../../../stores/configStore';
import { Skill } from '../../../types';

const BASE_SKILL: Skill = {
    id: 'skill-1',
    name: 'Violão',
    level: 'Iniciante',
    currentMinutes: 60,
    goalMinutes: 600,
    goalPomodoros: 24,
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: 0,
};

const pad = (n: number) => String(n).padStart(2, '0');
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

describe('Skills date handling (local timezone)', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('ProgressStats shows the deadline on the same calendar day it was saved', () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 11, 1, 22, 30)); // 22:30 local - already "tomorrow" in UTC for UTC-3

        render(
            <ProgressStats
                skill={{ ...BASE_SKILL, deadline: '2026-12-25' }}
                onAddSession={vi.fn()}
                onUpdateGoal={vi.fn()}
                onUpdateGoalType={vi.fn()}
                onUpdateDeadline={vi.fn()}
            />
        );

        // new Date('2026-12-25') is UTC midnight and rendered as 24/12 in UTC-3 before the fix
        expect(screen.getByText('Deadline: 25/12/2026')).toBeInTheDocument();
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        expect(dateInput.min).toBe('2026-12-01');
    });

    it('CreateSkillModal default deadline is startDate + 67 local days', () => {
        const start = new Date(2026, 0, 10, 23, 30); // late evening local time
        useConfigStore.setState(state => ({ config: { ...state.config, startDate: start.toISOString() } }));

        render(<CreateSkillModal onClose={vi.fn()} onCreate={vi.fn()} />);

        const expected = new Date(2026, 0, 10 + 67);
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        expect(dateInput.value).toBe(localISO(expected)); // 2026-03-18
    });
});

describe('SessionHistoryModal accessibility', () => {
    it('is exposed as a dialog and closes with Escape', () => {
        const onClose = vi.fn();
        render(<SessionHistoryModal skill={BASE_SKILL} onClose={onClose} onDeleteLog={vi.fn()} />);

        expect(screen.getByRole('dialog', { name: 'Histórico de sessões de Violão' })).toBeInTheDocument();
        fireEvent.keyDown(window, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('MicroAchievementsTab general target', () => {
    it('does not save 0% when the field is cleared while typing', () => {
        const onUpdate = vi.fn();
        render(<MicroAchievementsTab skill={{ ...BASE_SKILL, roadmapProgressTarget: 80 }} onUpdate={onUpdate} />);

        const input = screen.getByLabelText('Meta geral da skill');
        fireEvent.change(input, { target: { value: '' } });
        expect(onUpdate).not.toHaveBeenCalled();

        fireEvent.change(input, { target: { value: '90' } });
        expect(onUpdate).toHaveBeenCalledWith({ roadmapProgressTarget: 90 });
    });
});
