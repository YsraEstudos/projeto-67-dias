import React from 'react';
import { DuoTab, DuoUserData } from '../types';
import { Flame, Gem, Heart, Zap, Bot, BookOpen, Map, RotateCcw, Volume2, VolumeX, Plus } from 'lucide-react';
import { isSoundEffectsEnabled, setSoundEffectsEnabled, playDuoSound } from '../utils/soundEffects';

interface DuoHeaderProps {
  currentTab: DuoTab;
  onTabChange: (tab: DuoTab) => void;
  userData: DuoUserData;
  onToggleAi: () => void;
  onOpenRefillModal?: () => void;
}

export const DuoHeader: React.FC<DuoHeaderProps> = ({
  currentTab,
  onTabChange,
  userData,
  onToggleAi,
  onOpenRefillModal,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEffectsEnabled);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEffectsEnabled(next);
    if (next) playDuoSound('click');
  };

  return (
    <header className="bg-[#131f31] border-b-2 border-slate-800/90 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-20 shadow-lg">
      {/* Top row on mobile / Left section on desktop: Brand + Action buttons on mobile */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div
          onClick={() => {
            playDuoSound('click');
            onTabChange('path');
          }}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group touch-manipulation"
          title="Ir para a Trilha de Aprendizado"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#58cc02] flex items-center justify-center text-slate-950 font-black text-lg sm:text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <span className="font-mono font-black">&lt;/&gt;</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-white tracking-wide leading-none">
                JS DuoAprendizado
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 hidden xs:block">
              Trilha Gamificada & Enciclopédia Dev
            </p>
          </div>
        </div>

        {/* Action icons on mobile (Sound & Tutor) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center ${
              soundOn
                ? 'bg-[#1c2a3e] border-slate-700/60 text-slate-300 hover:text-white'
                : 'bg-slate-900 border-slate-800 text-slate-600'
            }`}
            title={soundOn ? 'Desativar sons' : 'Ativar sons'}
            aria-label="Som"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onToggleAi();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95 touch-manipulation min-h-[36px]"
            title="Abrir o Mascote Tutor IA"
          >
            <Bot size={16} />
            <span className="text-[11px] font-bold">Tutor</span>
          </button>
        </div>
      </div>

      {/* Center on desktop / Middle row on mobile: Navigation Tabs */}
      <div className="w-full md:w-auto flex items-center bg-[#0b1320] p-1 rounded-2xl border border-slate-800 shadow-inner">
        <div className="grid grid-cols-3 md:flex md:items-center gap-1 w-full">
          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('path');
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-extrabold transition touch-manipulation ${
              currentTab === 'path'
                ? 'bg-[#58cc02] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Map size={14} className="shrink-0" />
            <span>Trilha</span>
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('theories');
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-extrabold transition touch-manipulation ${
              currentTab === 'theories'
                ? 'bg-[#1cb0f6] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={14} className="shrink-0" />
            <span>Teorias</span>
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('practice');
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-extrabold transition touch-manipulation ${
              currentTab === 'practice'
                ? 'bg-[#ffc800] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <RotateCcw size={14} className="shrink-0" />
            <span>Reforço</span>
          </button>
        </div>
      </div>

      {/* Bottom row on mobile / Right section on desktop: Gamification Stats */}
      <div className="flex items-center justify-between sm:justify-center md:justify-end gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-black w-full md:w-auto overflow-x-auto custom-scrollbar py-0.5">
        {/* Streak */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 bg-[#1c2a3e] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm shrink-0"
          title={`Sequência de dias consecutivos estudando: ${userData.streak} dia(s)`}
        >
          <Flame size={15} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-amber-300 text-xs sm:text-sm">{userData.streak}</span>
        </div>

        {/* Gems */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 bg-[#1c2a3e] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm shrink-0"
          title={`Gemas conquistadas: ${userData.gems}`}
        >
          <Gem size={15} className="text-[#1cb0f6] fill-[#1cb0f6]" />
          <span className="text-[#1cb0f6] text-xs sm:text-sm">{userData.gems}</span>
        </div>

        {/* Hearts */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 bg-[#1c2a3e] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm shrink-0"
          title={`Vidas disponíveis: ${userData.hearts}/${userData.maxHearts}`}
        >
          <Heart size={15} className="text-[#ff4b4b] fill-[#ff4b4b]" />
          <span className="text-[#ff4b4b] text-xs sm:text-sm">{userData.hearts}</span>
          {userData.hearts < userData.maxHearts && onOpenRefillModal && (
            <button
              onClick={onOpenRefillModal}
              className="ml-0.5 w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center text-[10px] transition touch-manipulation"
              title="Recarregar vidas com gemas"
              aria-label="Recarregar vidas"
            >
              <Plus size={10} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Total XP */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 bg-[#1c2a3e] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm shrink-0"
          title={`Pontos de Experiência acumulados: ${userData.xp} XP`}
        >
          <Zap size={15} className="text-[#ffc800] fill-[#ffc800]" />
          <span className="text-[#ffc800] text-xs sm:text-sm">{userData.xp} XP</span>
        </div>

        {/* Desktop-only Sound & AI buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
              soundOn
                ? 'bg-[#1c2a3e] border-slate-700/60 text-slate-300 hover:text-white'
                : 'bg-slate-900 border-slate-800 text-slate-600'
            }`}
            title={soundOn ? 'Desativar sons' : 'Ativar sons'}
            aria-label="Som"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onToggleAi();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md hover:shadow-indigo-500/20 active:scale-95 touch-manipulation min-h-[36px]"
            title="Abrir o Mascote Tutor IA"
          >
            <Bot size={16} />
            <span className="hidden lg:inline">Tutor IA</span>
          </button>
        </div>
      </div>
    </header>
  );
};
