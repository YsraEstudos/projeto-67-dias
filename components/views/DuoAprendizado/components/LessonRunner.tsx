import React, { useState, useEffect, useCallback } from 'react';
import { DuoQuestion, DuoUserData } from '../types';
import { X, Heart, Check, HelpCircle, Bot, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playDuoSound } from '../utils/soundEffects';

interface LessonRunnerProps {
  questions: DuoQuestion[];
  userData: DuoUserData;
  nodeTitle?: string;
  isSpacedRepetition?: boolean;
  onExit: () => void;
  onComplete: (isSpacedRepetition: boolean) => void;
  onRecordAnswer: (conceptId: string, isCorrect: boolean) => void;
  onAskAiAboutError: (question: DuoQuestion, userAnswer: string) => void;
}

export const LessonRunner: React.FC<LessonRunnerProps> = ({
  questions,
  userData,
  nodeTitle,
  isSpacedRepetition = false,
  onExit,
  onComplete,
  onRecordAnswer,
  onAskAiAboutError,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  // Initialize blocks when question changes
  useEffect(() => {
    if (!currentQ) return;

    setSelectedOption(null);
    setFillValue('');
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);

    if (currentQ.type === 'blocks' && currentQ.promptBlocks) {
      const shuffled = [...currentQ.promptBlocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffled);
      setSelectedBlocks([]);
    }
  }, [currentIndex, currentQ]);

  // Block movement helpers
  const handleAddBlock = (block: string, index: number) => {
    if (isChecked) return;
    playDuoSound('click');
    setAvailableBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelectedBlocks((prev) => [...prev, block]);
  };

  const handleRemoveBlock = (block: string, index: number) => {
    if (isChecked) return;
    playDuoSound('click');
    setSelectedBlocks((prev) => prev.filter((_, i) => i !== index));
    setAvailableBlocks((prev) => [...prev, block]);
  };

  // Check answer
  const handleCheck = () => {
    if (!currentQ || isChecked) return;

    let correct = false;
    let userAnsStr = '';

    if (currentQ.type === 'choice' || currentQ.type === 'output') {
      if (selectedOption === null) return;
      correct = selectedOption === currentQ.correctIndex;
      userAnsStr = currentQ.options?.[selectedOption] || '';
    } else if (currentQ.type === 'fill') {
      if (!fillValue.trim()) return;
      const normalizedInput = fillValue.trim();
      const normalizedTarget = (currentQ.correctAnswer || '').trim();
      correct = normalizedInput.toLowerCase() === normalizedTarget.toLowerCase();
      userAnsStr = normalizedInput;
    } else if (currentQ.type === 'blocks') {
      if (selectedBlocks.length === 0) return;
      correct = JSON.stringify(selectedBlocks) === JSON.stringify(currentQ.correctOrder);
      userAnsStr = selectedBlocks.join(' ');
    }

    setIsCorrect(correct);
    setIsChecked(true);
    onRecordAnswer(currentQ.conceptId, correct);

    if (correct) {
      playDuoSound('correct');
    } else {
      playDuoSound('wrong');
    }
  };

  // Proceed to next question
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Victory Finish
      playDuoSound('win');
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff'],
        });
      } catch {
        // ignore
      }
      setIsFinished(true);
      onComplete(isSpacedRepetition);
    }
  };

  // Can check validation
  const isCheckDisabled = (): boolean => {
    if (isChecked) return false;
    if (!currentQ) return true;
    if (currentQ.type === 'choice' || currentQ.type === 'output') return selectedOption === null;
    if (currentQ.type === 'fill') return !fillValue.trim();
    if (currentQ.type === 'blocks') return selectedBlocks.length === 0;
    return false;
  };

  const progressPercent = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 text-4xl shadow-2xl shadow-emerald-500/30 animate-bounce">
          <Sparkles size={48} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Lição Concluída com Sucesso!</h2>
          <p className="text-sm text-slate-300">
            {isSpacedRepetition
              ? 'Você reforçou seus pontos de melhoria e recuperou +2 corações ❤️!'
              : `Você concluiu a etapa "${nodeTitle || 'Lição'}"!`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full pt-2">
          <div className="bg-[#161f2e] border-2 border-slate-700/80 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">XP Ganho</span>
            <span className="text-2xl font-black text-[#ffc800] mt-1">+{isSpacedRepetition ? 30 : 50} XP</span>
          </div>
          <div className="bg-[#161f2e] border-2 border-slate-700/80 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Gemas</span>
            <span className="text-2xl font-black text-[#1cb0f6] mt-1">+{isSpacedRepetition ? 5 : 10} 💎</span>
          </div>
        </div>

        <button
          onClick={() => {
            playDuoSound('click');
            onExit();
          }}
          className="w-full bg-[#58cc02] hover:bg-[#46a302] active:translate-y-1 shadow-[0_5px_0_#46a302] text-slate-950 font-black py-4 rounded-2xl text-base uppercase tracking-wider transition"
        >
          Continuar para a Trilha
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b1320] overflow-hidden max-w-2xl mx-auto w-full p-4 sm:p-6 select-none">
      {/* Lesson Header */}
      <div className="flex items-center space-x-3 sm:space-x-4 mb-6 shrink-0">
        <button
          onClick={() => {
            playDuoSound('click');
            onExit();
          }}
          className="text-slate-400 hover:text-white p-2 transition hover:bg-slate-800/60 rounded-xl"
          title="Sair da lição"
        >
          <X size={24} />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 bg-slate-800/90 rounded-full h-4 border border-slate-700/80 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1 text-[#ff4b4b] font-black text-base bg-[#161f2e] px-3 py-1 rounded-xl border border-slate-700/80 shadow-sm">
          <Heart size={18} className="fill-[#ff4b4b]" />
          <span>{userData.hearts}</span>
        </div>
      </div>

      {/* Exercise Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center space-y-6 px-1 custom-scrollbar">
        {/* Title and Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block">
              {currentQ?.type === 'choice' && 'Múltipla Escolha'}
              {currentQ?.type === 'output' && 'Previsão de Saída'}
              {currentQ?.type === 'fill' && 'Preencher Lacuna'}
              {currentQ?.type === 'blocks' && 'Ordenar Blocos de Código'}
            </span>

            {currentQ?.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <Lightbulb size={14} />
                <span>Dica</span>
              </button>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">{currentQ?.title}</h2>

          {showHint && currentQ?.hint && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
              💡 <strong>Dica:</strong> {currentQ.hint}
            </div>
          )}
        </div>

        {/* Interactive Area by Type */}
        <div className="space-y-4 pt-1">
          {/* Multiple Choice */}
          {currentQ?.type === 'choice' && (
            <div className="space-y-3">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    disabled={isChecked}
                    onClick={() => {
                      playDuoSound('click');
                      setSelectedOption(idx);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-sm transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1cb0f6] bg-sky-950/40 text-white shadow-lg shadow-sky-500/10'
                        : 'bg-[#161f2e] border-slate-700/80 hover:border-slate-500 text-slate-200'
                    }`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                        isSelected ? 'border-[#1cb0f6] text-[#1cb0f6] font-black' : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Output Prediction */}
          {currentQ?.type === 'output' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl font-mono text-xs sm:text-sm text-emerald-400 whitespace-pre-wrap shadow-inner">
                {currentQ.codeSnippet}
              </div>

              <div className="space-y-3">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => {
                        playDuoSound('click');
                        setSelectedOption(idx);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 font-mono font-bold text-sm transition flex items-center justify-between ${
                        isSelected
                          ? 'border-[#1cb0f6] bg-sky-950/40 text-white shadow-lg shadow-sky-500/10'
                          : 'bg-[#161f2e] border-slate-700/80 hover:border-slate-500 text-slate-200'
                      }`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fill-in-the-Blank */}
          {currentQ?.type === 'fill' && (
            <div className="bg-[#161f2e] border-2 border-slate-700 p-6 rounded-2xl font-mono text-xs sm:text-sm text-center leading-loose">
              {(() => {
                const parts = (currentQ.codeSnippet || '').split('_____');
                return (
                  <div className="text-amber-300 font-bold whitespace-pre-wrap">
                    {parts[0]}
                    <input
                      type="text"
                      disabled={isChecked}
                      autoFocus
                      value={fillValue}
                      onChange={(e) => setFillValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCheckDisabled()) {
                          if (isChecked) handleNext();
                          else handleCheck();
                        }
                      }}
                      placeholder="resposta..."
                      className="inline-block bg-slate-950 border-2 border-[#1cb0f6] rounded-xl px-3 py-1 text-emerald-400 font-mono font-bold w-40 text-center focus:outline-none focus:ring-2 focus:ring-sky-500/50 mx-1"
                    />
                    {parts[1] || ''}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Code Block Ordering */}
          {currentQ?.type === 'blocks' && (
            <div className="space-y-4">
              {/* Drop Target Zone */}
              <div className="min-h-[72px] bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl p-3 flex flex-wrap gap-2 items-center">
                {selectedBlocks.length === 0 ? (
                  <span className="text-xs text-slate-500 italic px-2">
                    Clique nos blocos abaixo para organizá-los na ordem correta
                  </span>
                ) : (
                  selectedBlocks.map((block, idx) => (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => handleRemoveBlock(block, idx)}
                      className="bg-[#223147] hover:bg-[#1a2638] text-amber-300 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-[0_3px_0_#141f2e] active:translate-y-0.5 transition"
                    >
                      {block}
                    </button>
                  ))
                )}
              </div>

              {/* Source Available Blocks */}
              <div className="flex flex-wrap gap-2 pt-2">
                {availableBlocks.map((block, idx) => (
                  <button
                    key={idx}
                    disabled={isChecked}
                    onClick={() => handleAddBlock(block, idx)}
                    className="bg-[#1c2a3e] hover:bg-[#25364e] text-slate-200 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-md active:translate-y-0.5 transition"
                  >
                    {block}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Feedback */}
      <div className="mt-auto shrink-0 pt-6 border-t border-slate-800/80 flex flex-col gap-4">
        {isChecked && (
          <div
            className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm font-bold animate-fade-in ${
              isCorrect
                ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/90 border border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-[#ff4b4b] text-white font-black'
                }`}
              >
                {isCorrect ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
              </div>
              <div>
                <p className="text-base font-black">{isCorrect ? 'Correto! Excelente!' : 'Não foi dessa vez!'}</p>
                <p className="text-xs font-normal opacity-90 leading-relaxed mt-0.5">{currentQ?.explanation}</p>
              </div>
            </div>

            {!isCorrect && (
              <button
                onClick={() => {
                  playDuoSound('click');
                  const ans =
                    currentQ?.type === 'choice' || currentQ?.type === 'output'
                      ? currentQ.options?.[selectedOption || 0] || ''
                      : currentQ?.type === 'fill'
                      ? fillValue
                      : selectedBlocks.join(' ');
                  onAskAiAboutError(currentQ!, ans);
                }}
                className="text-xs bg-black/40 hover:bg-black/60 text-white font-bold px-3.5 py-2 rounded-xl border border-white/20 shrink-0 transition flex items-center gap-1.5 self-end sm:self-center"
              >
                <Bot size={14} className="text-indigo-300" />
                <span>Por que errei?</span>
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            if (isChecked) {
              playDuoSound('click');
              handleNext();
            } else {
              handleCheck();
            }
          }}
          disabled={isCheckDisabled()}
          className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition ${
            isCheckDisabled()
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : isChecked
              ? isCorrect
                ? 'bg-[#58cc02] hover:bg-[#46a302] text-slate-950 shadow-[0_5px_0_#46a302] active:translate-y-1'
                : 'bg-[#ff4b4b] hover:bg-[#ea2b2b] text-white shadow-[0_5px_0_#ea2b2b] active:translate-y-1'
              : 'bg-[#58cc02] hover:bg-[#46a302] text-slate-950 shadow-[0_5px_0_#46a302] active:translate-y-1'
          }`}
        >
          {isChecked ? 'Continuar' : 'Verificar'}
        </button>
      </div>
    </div>
  );
};
