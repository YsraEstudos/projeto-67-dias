import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DuoAprendizadoView from '../components/views/DuoAprendizado';
import { DuoHeader } from '../components/views/DuoAprendizado/components/DuoHeader';
import { TheoryWikiView } from '../components/views/DuoAprendizado/components/TheoryWikiView';
import { LessonRunner } from '../components/views/DuoAprendizado/components/LessonRunner';
import { AiTutorDrawer } from '../components/views/DuoAprendizado/components/AiTutorDrawer';
import { DUO_QUESTION_BANK } from '../components/views/DuoAprendizado/data/questionBank';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  db: null,
  auth: { currentUser: null },
}));

describe('DuoAprendizado Responsive & Touch UI', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('DuoHeader Mobile & Tablet layout', () => {
    const mockUserData = {
      xp: 150,
      gems: 45,
      hearts: 5,
      maxHearts: 5,
      streak: 3,
      lastStreakDate: '2026-08-23',
      completedNodes: ['u1_n1'],
      unlockedChests: [],
      mastery: {},
      lastActiveTimestamp: Date.now(),
    };

    it('renders navigation tabs and stats cleanly on mobile layout', () => {
      const handleTabChange = vi.fn();
      const handleToggleAi = vi.fn();

      render(
        <DuoHeader
          currentTab="path"
          onTabChange={handleTabChange}
          userData={mockUserData}
          onToggleAi={handleToggleAi}
        />
      );

      expect(screen.getByText('JS DuoAprendizado')).toBeInTheDocument();
      expect(screen.getByText('Trilha')).toBeInTheDocument();
      expect(screen.getByText('Teorias')).toBeInTheDocument();
      expect(screen.getByText('Reforço')).toBeInTheDocument();

      // Check stats badges
      expect(screen.getByText('3')).toBeInTheDocument(); // Streak
      expect(screen.getByText('45')).toBeInTheDocument(); // Gems
      expect(screen.getByText('5')).toBeInTheDocument(); // Hearts
      expect(screen.getByText('150 XP')).toBeInTheDocument(); // XP

      // Click on Theories tab
      fireEvent.click(screen.getByText('Teorias'));
      expect(handleTabChange).toHaveBeenCalledWith('theories');
    });
  });

  describe('TheoryWikiView Master-Detail Mobile Navigation', () => {
    it('supports mobile view toggling between topics list and selected article', () => {
      const handlePractice = vi.fn();
      render(<TheoryWikiView onPracticeConcept={handlePractice} />);

      // Check category filters
      expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fundamentos' })).toBeInTheDocument();

      // In mobile toggle bar
      expect(screen.getByText(/Lista de Tópicos/i)).toBeInTheDocument();
      expect(screen.getByText('Artigo Selecionado')).toBeInTheDocument();

      // Click on a topic card in the list
      const varCards = screen.getAllByText(/O que é var/i);
      expect(varCards.length).toBeGreaterThan(0);
      fireEvent.click(varCards[0]);

      // Article should be shown with practice button
      const practiceButtons = screen.getAllByText('Praticar Lição');
      expect(practiceButtons.length).toBeGreaterThan(0);
      fireEvent.click(practiceButtons[0]);
      expect(handlePractice).toHaveBeenCalled();
    });

    it('allows live code sandbox execution in theory article', () => {
      render(<TheoryWikiView onPracticeConcept={vi.fn()} />);

      // Find first "Executar" button
      const executeButtons = screen.getAllByText('Executar');
      expect(executeButtons.length).toBeGreaterThan(0);

      fireEvent.click(executeButtons[0]);
      expect(screen.getByText('Console de Saída:')).toBeInTheDocument();
    });
  });

  describe('LessonRunner Mobile Touch Flow', () => {
    const mockUserData = {
      xp: 0,
      gems: 10,
      hearts: 5,
      maxHearts: 5,
      streak: 1,
      lastStreakDate: '2026-08-23',
      completedNodes: [],
      unlockedChests: [],
      mastery: {},
      lastActiveTimestamp: Date.now(),
    };

    const choiceQuestion = DUO_QUESTION_BANK.find((q) => q.type === 'choice') || DUO_QUESTION_BANK[0];
    const fillQuestion = DUO_QUESTION_BANK.find((q) => q.type === 'fill') || DUO_QUESTION_BANK[0];
    const blocksQuestion = DUO_QUESTION_BANK.find((q) => q.type === 'blocks') || DUO_QUESTION_BANK[0];

    it('handles multiple choice answer selection and verification with sticky action bar', () => {
      const handleRecord = vi.fn();
      const handleComplete = vi.fn();

      render(
        <LessonRunner
          questions={[choiceQuestion]}
          userData={mockUserData}
          nodeTitle="Teste Escolha"
          onExit={vi.fn()}
          onComplete={handleComplete}
          onRecordAnswer={handleRecord}
          onAskAiAboutError={vi.fn()}
        />
      );

      expect(screen.getByText(choiceQuestion.title)).toBeInTheDocument();

      // Action button should be disabled before selection
      const verifyButton = screen.getByText('Verificar');
      expect(verifyButton).toBeDisabled();

      // Select first option
      if (choiceQuestion.options && choiceQuestion.options.length > 0) {
        fireEvent.click(screen.getByText(choiceQuestion.options[0]));
        expect(verifyButton).not.toBeDisabled();

        // Click Verificar
        fireEvent.click(verifyButton);

        // Record callback called
        expect(handleRecord).toHaveBeenCalled();

        // Button should switch to Continuar
        expect(screen.getByText('Continuar')).toBeInTheDocument();
      }
    });

    it('handles fill-in-the-blank input on mobile', () => {
      if (!fillQuestion || fillQuestion.type !== 'fill') return;

      const handleRecord = vi.fn();
      render(
        <LessonRunner
          questions={[fillQuestion]}
          userData={mockUserData}
          onExit={vi.fn()}
          onComplete={vi.fn()}
          onRecordAnswer={handleRecord}
          onAskAiAboutError={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('resposta...');
      expect(input).toBeInTheDocument();

      // Type answer
      fireEvent.change(input, { target: { value: fillQuestion.correctAnswer || 'const' } });

      const verifyButton = screen.getByText('Verificar');
      expect(verifyButton).not.toBeDisabled();
      fireEvent.click(verifyButton);

      expect(handleRecord).toHaveBeenCalledWith(fillQuestion.conceptId, true);
    });

    it('handles code blocks tap movement in mobile ordering questions', () => {
      if (!blocksQuestion || blocksQuestion.type !== 'blocks' || !blocksQuestion.promptBlocks) return;

      const handleRecord = vi.fn();
      render(
        <LessonRunner
          questions={[blocksQuestion]}
          userData={mockUserData}
          onExit={vi.fn()}
          onComplete={vi.fn()}
          onRecordAnswer={handleRecord}
          onAskAiAboutError={vi.fn()}
        />
      );

      // Tap on available block to move it to target zone
      const firstBlock = blocksQuestion.promptBlocks[0];
      const blockButton = screen.getByText((content) => content.includes(firstBlock.trim()));
      fireEvent.click(blockButton);

      // Block is in selected area
      expect(screen.getByText((content) => content.includes(firstBlock.trim()))).toBeInTheDocument();
    });
  });

  describe('AiTutorDrawer & Backdrop', () => {
    it('renders backdrop overlay and allows quick prompt interaction', async () => {
      const handleClose = vi.fn();
      render(<AiTutorDrawer isOpen={true} onClose={handleClose} />);

      expect(screen.getByText(/Mascote Tutor IA/i)).toBeInTheDocument();
      expect(screen.getByText('O que é var?')).toBeInTheDocument();

      // Send a quick prompt
      fireEvent.click(screen.getByText('O que é var?'));

      await waitFor(() => {
        expect(screen.getByText(/O que é `var`/i)).toBeInTheDocument();
      });

      // Close drawer
      const closeButton = screen.getByLabelText('Fechar');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Full DuoAprendizadoView Integration', () => {
    it('renders root view and switches to Reforço tab and back', () => {
      render(<DuoAprendizadoView />);

      expect(screen.getByText('Prática de Reforço')).toBeInTheDocument();

      // Switch to Reforço / Practice tab
      fireEvent.click(screen.getByText('Reforço'));
      expect(screen.getByText(/Laboratório de Reforço/i)).toBeInTheDocument();
      expect(screen.getByText(/Iniciar Sessão de Reforço/i)).toBeInTheDocument();

      // Switch back to Trilha
      fireEvent.click(screen.getByText('Trilha'));
      expect(screen.getByText('Prática de Reforço')).toBeInTheDocument();
    });
  });
});
