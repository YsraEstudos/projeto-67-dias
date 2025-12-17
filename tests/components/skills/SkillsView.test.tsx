import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkillsView from '../../../components/views/SkillsView';
import { useSkillsStore } from '../../../stores/skillsStore';

const MOCK_SKILL = {
    id: '1',
    name: 'Test Skill',
    level: 'Intermediário' as const,
    currentMinutes: 3600, // 60 hours
    goalMinutes: 6000,    // 100 hours
    sessions: [],
    resources: [],
    roadmap: [],
    logs: [],
    weekDays: [],
    dailyGoal: 30,
    notifications: false,
    nextDayContents: [],
    colorTheme: 'emerald' as const,
    createdAt: Date.now()
};

// Mock useStorage
vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        const [val, setVal] = React.useState(initialValue);
        return [val, setVal];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

// Mock Firebase
vi.mock('../../../services/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-uid' } }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    onSnapshot: vi.fn((_ref, onNext) => {
        if (typeof onNext === 'function') {
            onNext({ exists: () => false, data: () => ({}) });
        }
        return vi.fn();
    })
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-uid' });
        return () => { };
    })
}));

describe('SkillsView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset and seed store
        const store = useSkillsStore.getState();
        store.setSkills([MOCK_SKILL]);
    });

    // --- HAPPY PATH TESTS ---

    it('renders the Skill Tree header', () => {
        render(<SkillsView />);

        expect(screen.getByText('Skill Tree')).toBeInTheDocument();
        expect(screen.getByText('Gerencie seu aprendizado e desenvolvimento.')).toBeInTheDocument();
    });

    it('renders initial skill from mock data', () => {
        render(<SkillsView />);

        expect(screen.getByText('Test Skill')).toBeInTheDocument();
        expect(screen.getByText('Intermediário')).toBeInTheDocument();
    });

    it('opens create modal when Nova Habilidade button is clicked', () => {
        render(<SkillsView />);

        fireEvent.click(screen.getByText('Nova Habilidade'));

        expect(screen.getByText('O que você vai aprender?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Python, Design, Guitarra...')).toBeInTheDocument();
    });

    it('creates a new skill and adds to the list', async () => {
        render(<SkillsView />);

        // Open modal
        fireEvent.click(screen.getByText('Nova Habilidade'));

        // Fill form
        fireEvent.change(
            screen.getByPlaceholderText('Ex: Python, Design, Guitarra...'),
            { target: { value: 'React Testing' } }
        );

        // Submit
        fireEvent.click(screen.getByText('Criar'));

        // New skill should appear
        await waitFor(() => {
            expect(screen.getByText('React Testing')).toBeInTheDocument();
        });
    });

    it('navigates to skill detail view when a card is clicked', async () => {
        render(<SkillsView />);

        // Click on skill card
        const skillCard = screen.getByText('Test Skill').closest('div[class*="cursor-pointer"]');
        if (skillCard) fireEvent.click(skillCard);

        // Should show detail view elements
        await waitFor(() => {
            expect(screen.getByText('Cofre de Recursos')).toBeInTheDocument();
            expect(screen.getByText('Roadmap Inteligente')).toBeInTheDocument();
        });
    });

    it('returns to list view when back button is clicked', async () => {
        render(<SkillsView />);

        // Navigate to detail
        const skillCard = screen.getByText('Test Skill').closest('div[class*="cursor-pointer"]');
        if (skillCard) fireEvent.click(skillCard);

        await waitFor(() => {
            expect(screen.getByText('Cofre de Recursos')).toBeInTheDocument();
        });

        // Click back button
        const backButton = screen.getByTitle('Voltar');
        fireEvent.click(backButton);

        // Should be back to list
        await waitFor(() => {
            expect(screen.getByText('Skill Tree')).toBeInTheDocument();
            expect(screen.getByText('Nova Habilidade')).toBeInTheDocument();
        });
    });

    it('adds a session to a skill', async () => {
        render(<SkillsView />);

        // Find +Sessão button
        fireEvent.click(screen.getByText('+Sessão'));

        // Enter minutes
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '60' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        // Progress should update (initial was 60h/100h = 60%, adding 1h = 61h/100h)
        await waitFor(() => {
            // The percentage display should have changed
            expect(screen.getByText('61%')).toBeInTheDocument();
        });
    });

    // --- EDGE CASE TESTS ---

    it('closes create modal when Cancel is clicked', () => {
        render(<SkillsView />);

        // Open modal
        fireEvent.click(screen.getByText('Nova Habilidade'));
        expect(screen.getByText('O que você vai aprender?')).toBeInTheDocument();

        // Cancel
        fireEvent.click(screen.getByText('Cancelar'));

        // Modal should be closed
        expect(screen.queryByText('O que você vai aprender?')).not.toBeInTheDocument();
    });

    it('deletes a skill when confirmed', async () => {
        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SkillsView />);

        // Navigate to detail
        const skillCard = screen.getByText('Test Skill').closest('div[class*="cursor-pointer"]');
        if (skillCard) fireEvent.click(skillCard);

        await waitFor(() => {
            expect(screen.getByTitle('Excluir módulo')).toBeInTheDocument();
        });

        // Click delete
        fireEvent.click(screen.getByTitle('Excluir módulo'));

        expect(confirmSpy).toHaveBeenCalled();

        // Should return to list and skill should be gone, showing empty state
        await waitFor(() => {
            expect(screen.getByText('Você ainda não está rastreando nenhuma habilidade.')).toBeInTheDocument();
        });

        confirmSpy.mockRestore();
    });

    it('does not delete skill when cancelled', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<SkillsView />);

        // Navigate to detail
        const skillCard = screen.getByText('Test Skill').closest('div[class*="cursor-pointer"]');
        if (skillCard) fireEvent.click(skillCard);

        await waitFor(() => {
            expect(screen.getByTitle('Excluir módulo')).toBeInTheDocument();
        });

        // Click delete but cancel
        fireEvent.click(screen.getByTitle('Excluir módulo'));

        // Should still be in detail view
        expect(screen.getByText('Cofre de Recursos')).toBeInTheDocument();

        confirmSpy.mockRestore();
    });
});
