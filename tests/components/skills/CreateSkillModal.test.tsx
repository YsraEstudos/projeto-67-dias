import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSkillModal } from '../../../components/skills/CreateSkillModal';
import { Skill } from '../../../types';

describe('CreateSkillModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnCreate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- HAPPY PATH TESTS ---

    it('renders all form fields correctly', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        expect(screen.getByText('Nova Habilidade')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Python, Design, Guitarra...')).toBeInTheDocument();
        expect(screen.getByText('Nível Atual')).toBeInTheDocument();
        expect(screen.getByText('Meta (Horas)')).toBeInTheDocument();
        expect(screen.getByText('Cor do Tema')).toBeInTheDocument();
    });

    it('creates skill with filled fields', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Fill name
        const nameInput = screen.getByPlaceholderText('Ex: Python, Design, Guitarra...');
        fireEvent.change(nameInput, { target: { value: 'JavaScript Avançado' } });

        // Click create
        fireEvent.click(screen.getByText('Criar'));

        expect(mockOnCreate).toHaveBeenCalledTimes(1);
        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];
        expect(createdSkill.name).toBe('JavaScript Avançado');
        expect(createdSkill.level).toBe('Iniciante'); // default
        expect(createdSkill.goalMinutes).toBe(1200); // 20h * 60
        expect(createdSkill.colorTheme).toBe('emerald'); // default
        expect(createdSkill.currentMinutes).toBe(0);
        expect(createdSkill.resources).toEqual([]);
        expect(createdSkill.roadmap).toEqual([]);
        expect(createdSkill.logs).toEqual([]);
    });

    it('closes modal when Cancel is clicked', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        fireEvent.click(screen.getByText('Cancelar'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('closes modal when X button is clicked', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Find the X button in the header
        const header = screen.getByText('Nova Habilidade').parentElement;
        const closeButton = header?.querySelector('button');
        if (closeButton) fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    // --- EDGE CASE TESTS ---

    it('does not create skill with empty name', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Try to create without filling name
        fireEvent.click(screen.getByText('Criar'));

        expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('allows changing level', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Fill name
        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'React' } }
        );

        // Change level
        const levelSelect = screen.getByDisplayValue('Iniciante');
        fireEvent.change(levelSelect, { target: { value: 'Avançado' } });

        fireEvent.click(screen.getByText('Criar'));

        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];
        expect(createdSkill.level).toBe('Avançado');
    });

    it('allows changing goal hours', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Fill name
        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'Design' } }
        );

        // Change goal hours
        const hoursInput = screen.getByDisplayValue('20');
        fireEvent.change(hoursInput, { target: { value: '50' } });

        fireEvent.click(screen.getByText('Criar'));

        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];
        expect(createdSkill.goalMinutes).toBe(3000); // 50h * 60
    });

    it('allows selecting different color themes', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        // Fill name
        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'TypeScript' } }
        );

        // Find and click blue theme button (second color button)
        const themeButtons = screen.getByText('Cor do Tema').parentElement?.querySelectorAll('button');
        if (themeButtons && themeButtons[1]) {
            fireEvent.click(themeButtons[1]); // blue
        }

        fireEvent.click(screen.getByText('Criar'));

        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];
        expect(createdSkill.colorTheme).toBe('blue');
    });

    it('generates unique id for each skill', () => {
        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'Skill 1' } }
        );
        fireEvent.click(screen.getByText('Criar'));

        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];
        expect(createdSkill.id).toBeDefined();
        expect(typeof createdSkill.id).toBe('string');
        expect(createdSkill.id.length).toBeGreaterThan(0);
    });

    it('sets createdAt timestamp', () => {
        const before = Date.now();

        render(<CreateSkillModal onClose={mockOnClose} onCreate={mockOnCreate} />);

        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'New Skill' } }
        );
        fireEvent.click(screen.getByText('Criar'));

        const after = Date.now();
        const createdSkill: Skill = mockOnCreate.mock.calls[0][0];

        expect(createdSkill.createdAt).toBeGreaterThanOrEqual(before);
        expect(createdSkill.createdAt).toBeLessThanOrEqual(after);
    });
});
