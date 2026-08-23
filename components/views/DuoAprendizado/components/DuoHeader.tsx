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
    <header className="bg-[#131f31] border-b-2 border-slate-800/90 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 z-20 shadow-lg">
      {/* Brand & Tab Navigation */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div
          onClick={() => {
            playDuoSound('click');
            onTabChange('path');
          }}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Ir para a Trilha de Aprendizado"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#58cc02] flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="font-mono font-black">&lt;/&gt;</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-wide leading-none">
                JS DuoAprendizado
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Trilha Gamificada & Enciclopédia Dev</p>
          </div>
        </div>

        {/* Tab Buttons (Mobile compact / Desktop) */}
        <div className="flex items-center bg-[#0b1320] p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('path');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              currentTab === 'path'
                ? 'bg-[#58cc02] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Map size={14} />
            <span className="hidden sm:inline">Trilha</span>
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('theories');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              currentTab === 'theories'
                ? 'bg-[#1cb0f6] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={14} />
            <span>Teorias</span>
          </button>

          <button
            onClick={() => {
              playDuoSound('click');
              onTabChange('practice');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              currentTab === 'practice'
                ? 'bg-[#ffc800] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reforço</span>
          </button>
        </div>
      </div>

      {/* Gamification Stats and Controls */}
      <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm font-black w-full md:w-auto">
        {/* Streak */}
        <div
          className="flex items-center gap-1.5 bg-[#1c2a3e] px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm"
          title={`Sequência de dias consecutivos estudando: ${userData.streak} dia(s)`}
        >
          <Flame size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-amber-300">{userData.streak}</span>
        </div>

        {/* Gems */}
        <div
          className="flex items-center gap-1.5 bg-[#1c2a3e] px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm"
          title={`Gemas conquistadas: ${userData.gems}`}
        >
          <Gem size={16} className="text-[#1cb0f6] fill-[#1cb0f6]" />
          <span className="text-[#1cb0f6]">{userData.gems}</span>
        </div>

        {/* Hearts */}
        <div
          className="flex items-center gap-1.5 bg-[#1c2a3e] px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm"
          title={`Vidas disponíveis: ${userData.hearts}/${userData.maxHearts}`}
        >
          <Heart size={16} className="text-[#ff4b4b] fill-[#ff4b4b]" />
          <span className="text-[#ff4b4b]">{userData.hearts}</span>
          {userData.hearts < userData.maxHearts && onOpenRefillModal && (
            <button
              onClick={onOpenRefillModal}
              className="ml-0.5 w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center text-[10px] transition"
              title="Recarregar vidas com gemas"
            >
              <Plus size={10} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Total XP */}
        <div
          className="flex items-center gap-1.5 bg-[#1c2a3e] px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-sm"
          title={`Pontos de Experiência acumulados: ${userData.xp} XP`}
        >
          <Zap size={16} className="text-[#ffc800] fill-[#ffc800]" />
          <span className="text-[#ffc800]">{userData.xp} XP</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border text-xs transition ${
            soundOn
              ? 'bg-[#1c2a3e] border-slate-700/60 text-slate-300 hover:text-white'
              : 'bg-slate-900 border-slate-800 text-slate-600'
          }`}
          title={soundOn ? 'Desativar sons' : 'Ativar sons'}
          aria-label="Som"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* AI Tutor Toggle */}
        <button
          onClick={() => {
            playDuoSound('click');
            onToggleAi();
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md hover:shadow-indigo-500/20 active:scale-95"
          title="Abrir o Mascote Tutor IA"
        >
          <Bot size={16} />
          <span className="hidden lg:inline">Tutor IA</span>
        </button>
      </div>
    </header>
  );
};
