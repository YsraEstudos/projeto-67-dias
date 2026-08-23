import React, { useState, useMemo, useCallback } from 'react';
import { DuoTab, DuoNode, DuoQuestion } from './types';
import { DUO_QUESTION_BANK } from './data/questionBank';
import { DUO_UNITS } from './data/unitsData';
import { useDuoProgress } from './hooks/useDuoProgress';
import { DuoHeader } from './components/DuoHeader';
import { PathTreeView } from './components/PathTreeView';
import { LessonRunner } from './components/LessonRunner';
import { TheoryWikiView } from './components/TheoryWikiView';
import { AiTutorDrawer } from './components/AiTutorDrawer';
import { NoHeartsModal } from './components/NoHeartsModal';
import { UnitChestModal } from './components/UnitChestModal';
import { playDuoSound } from './utils/soundEffects';

interface DuoAprendizadoViewProps {
  userId?: string;
}

export const DuoAprendizadoView: React.FC<DuoAprendizadoViewProps> = ({ userId }) => {
  const {
    userData,
    completeNode,
    recordAnswerResult,
    recoverHearts,
    refillAllHeartsWithGems,
    unlockChest,
  } = useDuoProgress(userId);

  // Navigation & Session State
  const [currentTab, setCurrentTab] = useState<DuoTab>('path');
  const [activeLessonNode, setActiveLessonNode] = useState<DuoNode | null>(null);
  const [isLessonRunning, setIsLessonRunning] = useState(false);
  const [isSpacedRepetition, setIsSpacedRepetition] = useState(false);
  const [lessonQuestions, setLessonQuestions] = useState<DuoQuestion[]>([]);

  // Modals & Drawers
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isNoHeartsModalOpen, setIsNoHeartsModalOpen] = useState(false);
  const [chestModalUnitId, setChestModalUnitId] = useState<number | null>(null);
  const [theorySearchQuery, setTheorySearchQuery] = useState('');

  // Start single node lesson
  const handleStartLesson = useCallback(
    (node: DuoNode) => {
      if (userData.hearts <= 0) {
        setIsNoHeartsModalOpen(true);
        return;
      }

      const questions = DUO_QUESTION_BANK.filter((q) => q.conceptId === node.conceptId);
      const sessionQuestions =
        questions.length > 0
          ? questions
          : DUO_QUESTION_BANK.filter((q) => q.unitId === node.unitId).slice(0, 3);

      setActiveLessonNode(node);
      setIsSpacedRepetition(false);
      setLessonQuestions(sessionQuestions.length > 0 ? sessionQuestions : [DUO_QUESTION_BANK[0]]);
      setIsLessonRunning(true);
    },
    [userData.hearts]
  );

  // Start Spaced Repetition Reinforcement session
  const handleStartSpacedRepetition = useCallback(() => {
    // If 0 hearts, grant 1 temporary heart for practice mode
    if (userData.hearts <= 0) {
      recoverHearts(1);
    }

    // Sort concepts by lowest mastery first
    const sorted = [...DUO_QUESTION_BANK].sort((a, b) => {
      const scoreA = userData.mastery[a.conceptId] ?? 0;
      const scoreB = userData.mastery[b.conceptId] ?? 0;
      return scoreA - scoreB;
    });

    const sessionQuestions = sorted.slice(0, 4);

    setActiveLessonNode(null);
    setIsSpacedRepetition(true);
    setLessonQuestions(sessionQuestions);
    setIsLessonRunning(true);
  }, [userData.hearts, userData.mastery, recoverHearts]);

  // Direct practice trigger from Theory Wiki
  const handlePracticeConceptFromWiki = useCallback(
    (conceptId: string) => {
      // Find corresponding node
      for (const unit of DUO_UNITS) {
        const foundNode = unit.nodes.find((n) => n.conceptId === conceptId);
        if (foundNode) {
          handleStartLesson(foundNode);
          return;
        }
      }

      // If not in a direct node, launch questions matching concept
      const matching = DUO_QUESTION_BANK.filter((q) => q.conceptId === conceptId);
      if (matching.length > 0) {
        if (userData.hearts <= 0) {
          setIsNoHeartsModalOpen(true);
          return;
        }
        setActiveLessonNode({
          id: `custom_${conceptId}`,
          title: `Prática: ${conceptId}`,
          conceptId,
          unitId: 1,
        });
        setIsSpacedRepetition(false);
        setLessonQuestions(matching);
        setIsLessonRunning(true);
      }
    },
    [handleStartLesson, userData.hearts]
  );

  // Open theory wiki and prefill search for that concept
  const handleOpenTheoryForConcept = useCallback((conceptId: string) => {
    setTheorySearchQuery(conceptId);
    setCurrentTab('theories');
  }, []);

  // Lesson completion handler
  const handleLessonComplete = useCallback(
    (spaced: boolean) => {
      if (spaced) {
        recoverHearts(2);
      } else if (activeLessonNode) {
        completeNode(
          activeLessonNode.id,
          activeLessonNode.conceptId,
          activeLessonNode.xpReward || 25,
          activeLessonNode.gemsReward || 5
        );
      }
    },
    [activeLessonNode, completeNode, recoverHearts]
  );

  // Ask AI Mascot about a mistake
  const handleAskAiAboutError = useCallback(
    (question: DuoQuestion, userAnswer: string) => {
      const prompt = `Errei o exercício: "${question.title}".\nMinha resposta foi: "${userAnswer}".\nA explicação correta é: "${question.explanation}".\nPode me explicar de forma didática com um exemplo simples em JavaScript?`;
      setAiPrompt(prompt);
      setIsAiOpen(true);
    },
    []
  );

  // Refill hearts with gems
  const handleRefillWithGems = useCallback(() => {
    const success = refillAllHeartsWithGems();
    if (success) {
      playDuoSound('gem');
    }
  }, [refillAllHeartsWithGems]);

  // Main content selector
  const renderMainContent = () => {
    if (isLessonRunning) {
      return (
        <LessonRunner
          questions={lessonQuestions}
          userData={userData}
          nodeTitle={activeLessonNode?.title}
          isSpacedRepetition={isSpacedRepetition}
          onExit={() => setIsLessonRunning(false)}
          onComplete={handleLessonComplete}
          onRecordAnswer={recordAnswerResult}
          onAskAiAboutError={handleAskAiAboutError}
        />
      );
    }

    switch (currentTab) {
      case 'path':
        return (
          <PathTreeView
            userData={userData}
            onStartLesson={handleStartLesson}
            onStartSpacedRepetition={handleStartSpacedRepetition}
            onOpenChest={(unitId) => setChestModalUnitId(unitId)}
            onOpenTheoryForConcept={handleOpenTheoryForConcept}
          />
        );

      case 'theories':
        return (
          <TheoryWikiView
            initialSearchQuery={theorySearchQuery}
            onPracticeConcept={handlePracticeConceptFromWiki}
          />
        );

      case 'practice':
        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-5 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-2xl sm:text-3xl shadow-inner mx-auto">
              ⚡
            </div>
            <div className="space-y-2 px-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                Laboratório de Reforço & Repetição Espaçada
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                Nosso algoritmo inteligente seleciona automaticamente os tópicos onde você teve menor taxa de acerto para consolidar seu aprendizado na memória de longo prazo.
              </p>
            </div>
            <button
              onClick={() => {
                playDuoSound('click');
                handleStartSpacedRepetition();
              }}
              className="w-full sm:w-auto bg-[#ffc800] hover:bg-[#e5b200] active:translate-y-1 shadow-[0_4px_0_#e5b200] text-slate-950 font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition touch-manipulation"
            >
              Iniciar Sessão de Reforço (+2 Vidas ❤️)
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] md:h-[calc(100vh-7rem)] bg-[#0b1320] text-slate-100 font-sans overflow-hidden select-none relative rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Top Gamification Header */}
      {!isLessonRunning && (
        <DuoHeader
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'theories') setTheorySearchQuery('');
          }}
          userData={userData}
          onToggleAi={() => setIsAiOpen(!isAiOpen)}
          onOpenRefillModal={() => setIsNoHeartsModalOpen(true)}
        />
      )}

      {/* Main Container Area */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {renderMainContent()}

        {/* AI Tutor Side Drawer */}
        <AiTutorDrawer
          isOpen={isAiOpen}
          onClose={() => {
            setIsAiOpen(false);
            setAiPrompt(null);
          }}
          initialPrompt={aiPrompt}
        />
      </div>

      {/* Modals */}
      <NoHeartsModal
        isOpen={isNoHeartsModalOpen}
        gemsCount={userData.gems}
        onClose={() => setIsNoHeartsModalOpen(false)}
        onPractice={handleStartSpacedRepetition}
        onRefillWithGems={handleRefillWithGems}
      />

      <UnitChestModal
        unitId={chestModalUnitId}
        isOpen={chestModalUnitId !== null}
        onClose={() => setChestModalUnitId(null)}
        onClaim={(uId) => unlockChest(uId)}
      />
    </div>
  );
};

export default DuoAprendizadoView;
