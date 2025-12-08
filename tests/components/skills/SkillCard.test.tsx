import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillCard } from '../../../components/skills/SkillCard';
import { Skill } from '../../../types';

// Mock skill data
const mockSkill: Skill = {
    id: 'test-skill-1',
    name: 'Python Básico',
    level: 'Iniciante',
    currentMinutes: 120, // 2 hours
    goalMinutes: 600, // 10 hours
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: Date.now()
};

describe('SkillCard Component', () => {
    const mockOnClick = vi.fn();
    const mockOnAddSession = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- HAPPY PATH TESTS ---

    it('renders skill name, level and progress correctly', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        expect(screen.getByText('Python Básico')).toBeInTheDocument();
        expect(screen.getByText('Iniciante')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument(); // 120/600 = 20%
    });

    it('calculates progress percentage correctly', () => {
        const skillHalfway: Skill = { ...mockSkill, currentMinutes: 300, goalMinutes: 600 };
        render(
            <SkillCard
                skill={skillHalfway}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        const card = screen.getByText('Python Básico').closest('div[class*="cursor-pointer"]');
        if (card) fireEvent.click(card);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('opens session input when +Sessão button is clicked', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        const addButton = screen.getByText('+Sessão');
        fireEvent.click(addButton);

        // Should show input with min label
        expect(screen.getByText('min')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('adds session minutes when confirmed', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        // Open add session
        fireEvent.click(screen.getByText('+Sessão'));

        // Change value and confirm
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '45' } });

        // Click confirm button (CheckCircle icon)
        const confirmButton = input.parentElement?.querySelector('button');
        if (confirmButton) fireEvent.click(confirmButton);

        expect(mockOnAddSession).toHaveBeenCalledWith(45);
    });

    it('confirms session with Enter key', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        fireEvent.click(screen.getByText('+Sessão'));

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '30' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnAddSession).toHaveBeenCalledWith(30);
    });

    // --- EDGE CASE TESTS ---

    it('cancels session addition', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        fireEvent.click(screen.getByText('+Sessão'));
        expect(screen.getByText('min')).toBeInTheDocument();

        // Click cancel button (X icon) 
        const buttons = screen.getAllByRole('button');
        const cancelButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-x') || btn.textContent === '');
        // Find the second button in the input area (cancel)
        const inputArea = screen.getByRole('spinbutton').parentElement;
        const cancelBtn = inputArea?.querySelectorAll('button')[1];
        if (cancelBtn) fireEvent.click(cancelBtn);

        // Should return to +Sessão button
        expect(screen.getByText('+Sessão')).toBeInTheDocument();
    });

    it('caps percentage at 100%', () => {
        const skillOver100: Skill = { ...mockSkill, currentMinutes: 1000, goalMinutes: 600 };
        render(
            <SkillCard
                skill={skillOver100}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    // --- ERROR CASE TESTS ---

    it('does not call onAddSession with invalid (NaN) input', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        fireEvent.click(screen.getByText('+Sessão'));

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnAddSession).not.toHaveBeenCalled();
    });

    it('does not call onAddSession with zero or negative input', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        fireEvent.click(screen.getByText('+Sessão'));

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '0' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnAddSession).not.toHaveBeenCalled();
    });

    it('displays hours correctly in footer', () => {
        render(
            <SkillCard
                skill={mockSkill}
                onClick={mockOnClick}
                onAddSession={mockOnAddSession}
            />
        );

        // 120 minutes = 2.0 hours
        expect(screen.getByText('2.0')).toBeInTheDocument();
        // 600 minutes = 10 hours
        expect(screen.getByText('/ 10h')).toBeInTheDocument();
    });
});
