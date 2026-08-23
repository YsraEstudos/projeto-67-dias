import React from 'react';
import { DUO_UNITS } from '../data/unitsData';
import { DuoNode, DuoUserData } from '../types';
import { RotateCcw, Check, Star, Lock, Gift, Sparkles, BookOpen } from 'lucide-react';
import { playDuoSound } from '../utils/soundEffects';

interface PathTreeViewProps {
  userData: DuoUserData;
  onStartLesson: (node: DuoNode) => void;
  onStartSpacedRepetition: () => void;
  onOpenChest: (unitId: number) => void;
  onOpenTheoryForConcept: (conceptId: string) => void;
}

export const PathTreeView: React.FC<PathTreeViewProps> = ({
  userData,
  onStartLesson,
  onStartSpacedRepetition,
  onOpenChest,
  onOpenTheoryForConcept,
}) => {
  // Helper to determine if a node is unlocked
  const isNodeUnlocked = (uIdx: number, nIdx: number): boolean => {
    if (uIdx === 0 && nIdx === 0) return true; // First node always unlocked

    const unit = DUO_UNITS[uIdx];
    if (nIdx > 0) {
      // Previous node in same unit must be completed
      const prevNodeId = unit.nodes[nIdx - 1]?.id;
      return userData.completedNodes.includes(prevNodeId);
    } else if (uIdx > 0) {
      // Last node of previous unit must be completed
      const prevUnit = DUO_UNITS[uIdx - 1];
      const lastNodeId = prevUnit.nodes[prevUnit.nodes.length - 1]?.id;
      return userData.completedNodes.includes(lastNodeId);
    }
    return false;
  };

  // Node horizontal offset pattern (Duolingo style winding path with responsive boundaries)
  const getOffsetClass = (nIdx: number): string => {
    const pattern = [
      'translate-x-0',
      'translate-x-6 sm:translate-x-10 md:translate-x-14',
      'translate-x-0',
      '-translate-x-6 sm:-translate-x-10 md:-translate-x-14',
    ];
    return pattern[nIdx % pattern.length];
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col items-center custom-scrollbar">
      {/* Spaced Repetition Banner */}
      <div className="w-full max-w-lg bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/30 rounded-3xl p-3.5 sm:p-5 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 shadow-2xl">
        <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-xl sm:text-2xl shadow-inner shrink-0">
            <RotateCcw className="text-[#1cb0f6] animate-spin-slow" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-base text-white">Prática de Reforço</h3>
              <span className="text-[9px] sm:text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                +2 Vidas ❤️
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">
              Treina seus conceitos com menor domínio e recupera corações!
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            playDuoSound('click');
            onStartSpacedRepetition();
          }}
          className="w-full sm:w-auto bg-[#1cb0f6] hover:bg-[#1899d6] active:translate-y-1 shadow-[0_4px_0_#1899d6] text-white font-extrabold px-5 py-3 sm:py-2.5 rounded-2xl text-xs uppercase tracking-wider transition shrink-0 touch-manipulation"
        >
          Praticar
        </button>
      </div>

      {/* Progressive Units Tree */}
      <div className="w-full max-w-lg space-y-10 sm:space-y-12 pb-28 sm:pb-32">
        {DUO_UNITS.map((unit, uIdx) => {
          const completedInUnit = unit.nodes.filter((n) => userData.completedNodes.includes(n.id)).length;
          const isUnitFullyCompleted = completedInUnit === unit.nodes.length;
          const isChestUnlocked = userData.unlockedChests.includes(unit.id);

          return (
            <div key={unit.id} className="w-full space-y-5 sm:space-y-6 text-center">
              {/* Unit Header Card */}
              <div
                className="border-2 rounded-3xl p-3.5 sm:p-5 shadow-xl text-left flex items-center justify-between transition-all"
                style={{
                  backgroundColor: '#161f2e',
                  borderColor: isUnitFullyCompleted ? '#ffc800' : '#1e293b',
                }}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${unit.colorTheme.badge}`}
                    >
                      Unidade {unit.id}
                    </span>
                    {isUnitFullyCompleted && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Sparkles size={10} /> 100%
                      </span>
                    )}
                  </div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white mt-1 leading-snug">{unit.title}</h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {unit.desc}
                  </p>
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-800/80 flex flex-col items-center justify-center text-slate-300 font-extrabold text-xs border border-slate-700 shrink-0 ml-2">
                  <span className="text-amber-400">{completedInUnit}</span>
                  <span className="text-[9px] text-slate-500 font-normal">/{unit.nodes.length}</span>
                </div>
              </div>

              {/* Unit Nodes Path */}
              <div className="flex flex-col items-center space-y-7 sm:space-y-8 pt-2">
                {unit.nodes.map((node, nIdx) => {
                  const isCompleted = userData.completedNodes.includes(node.id);
                  const isUnlocked = isNodeUnlocked(uIdx, nIdx);
                  const canPlay = isUnlocked || isCompleted;
                  const masteryScore = userData.mastery[node.conceptId] || 0;
                  const offsetClass = getOffsetClass(nIdx);

                  return (
                    <div
                      key={node.id}
                      className={`flex flex-col items-center space-y-2 transition-all duration-300 ${offsetClass}`}
                    >
                      <div className="relative group">
                        <button
                          onClick={() => {
                            if (canPlay) {
                              playDuoSound('click');
                              onStartLesson(node);
                            }
                          }}
                          disabled={!canPlay}
                          aria-label={node.title}
                          className={`w-15 h-15 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center font-extrabold text-xl sm:text-2xl transition shadow-xl relative touch-manipulation ${
                            isCompleted
                              ? 'bg-[#ffc800] text-slate-950 shadow-[0_4px_0_#e5b200] sm:shadow-[0_5px_0_#e5b200] active:translate-y-1 active:shadow-none hover:scale-105'
                              : isUnlocked
                              ? 'bg-[#58cc02] text-slate-950 shadow-[0_4px_0_#46a302] sm:shadow-[0_5px_0_#46a302] active:translate-y-1 active:shadow-none animate-bounce-subtle hover:scale-105 ring-4 ring-emerald-500/20'
                              : 'bg-slate-800 border-2 border-slate-700 text-slate-600 cursor-not-allowed opacity-60 shadow-inner'
                          }`}
                          style={{ width: '3.75rem', height: '3.75rem' }}
                        >
                          {isCompleted ? (
                            <Check size={24} strokeWidth={3.5} />
                          ) : isUnlocked ? (
                            <Star size={22} className="fill-slate-950" />
                          ) : (
                            <Lock size={18} />
                          )}
                        </button>

                        {/* Quick Theory Lookup Floating Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playDuoSound('click');
                            onOpenTheoryForConcept(node.conceptId);
                          }}
                          className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-[10px] shadow-md border border-indigo-400/40 opacity-90 sm:opacity-80 hover:opacity-100 transition-opacity touch-manipulation z-10"
                          title={`Ver teoria e explicações sobre: ${node.title}`}
                          aria-label={`Ver teoria sobre ${node.title}`}
                        >
                          <BookOpen size={12} />
                        </button>

                        {/* Mastery Percentage Badge */}
                        {masteryScore > 0 && (
                          <span className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 text-[9px] sm:text-[10px] text-amber-400 font-black px-1.5 sm:px-2 py-0.2 rounded-full shadow-md pointer-events-none whitespace-nowrap">
                            {masteryScore}%
                          </span>
                        )}
                      </div>

                      {/* Node Title Label */}
                      <p
                        className={`text-[11px] sm:text-xs font-bold max-w-[140px] sm:max-w-[170px] leading-tight text-center ${
                          canPlay ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {node.title}
                      </p>
                    </div>
                  );
                })}

                {/* Unit Reward Chest */}
                <div className="pt-3 sm:pt-4 flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (isUnitFullyCompleted && !isChestUnlocked) {
                        playDuoSound('chest');
                        onOpenChest(unit.id);
                      }
                    }}
                    disabled={!isUnitFullyCompleted || isChestUnlocked}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all touch-manipulation ${
                      isChestUnlocked
                        ? 'bg-slate-800/80 border-2 border-slate-700 text-slate-500 cursor-default opacity-60'
                        : isUnitFullyCompleted
                        ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow-[0_4px_0_#d97706] hover:scale-110 active:translate-y-1 animate-pulse'
                        : 'bg-slate-800/50 border-2 border-dashed border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title={
                      isChestUnlocked
                        ? 'Baú de recompensa já resgatado!'
                        : isUnitFullyCompleted
                        ? 'Clique para abrir seu baú de recompensa da unidade!'
                        : 'Complete todas as etapas desta unidade para desbloquear o baú!'
                    }
                    aria-label="Baú da Unidade"
                  >
                    <Gift size={24} className={isUnitFullyCompleted && !isChestUnlocked ? 'animate-bounce' : ''} />
                  </button>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1.5">
                    {isChestUnlocked
                      ? 'Baú Coletado ✓'
                      : isUnitFullyCompleted
                      ? 'Recompensa da Unidade!'
                      : 'Baú da Unidade'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
