import React from 'react';
import { HeartCrack, RotateCcw, Gem, X } from 'lucide-react';
import { playDuoSound } from '../utils/soundEffects';

interface NoHeartsModalProps {
  isOpen: boolean;
  gemsCount: number;
  onClose: () => void;
  onPractice: () => void;
  onRefillWithGems: () => void;
}

export const NoHeartsModal: React.FC<NoHeartsModalProps> = ({
  isOpen,
  gemsCount,
  onClose,
  onPractice,
  onRefillWithGems,
}) => {
  if (!isOpen) return null;

  const REFILL_COST = 10;
  const canRefill = gemsCount >= REFILL_COST;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-[#182232] border-2 border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-[#ff4b4b] flex items-center justify-center text-3xl mx-auto border border-rose-500/40 shadow-inner">
          <HeartCrack size={32} />
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-xl text-white">Você ficou sem vidas!</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Não desanime! Pratique no modo de reforço para recuperar vidas grátis ou recarregue instantaneamente usando gemas.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          {/* Option 1: Practice to recover */}
          <button
            onClick={() => {
              playDuoSound('click');
              onPractice();
              onClose();
            }}
            className="w-full bg-[#58cc02] hover:bg-[#46a302] active:translate-y-1 shadow-[0_4px_0_#46a302] py-3.5 rounded-2xl font-black text-slate-950 text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            <span>Recuperar Vidas Praticando</span>
          </button>

          {/* Option 2: Refill with Gems */}
          <button
            onClick={() => {
              if (canRefill) {
                playDuoSound('gem');
                onRefillWithGems();
                onClose();
              }
            }}
            disabled={!canRefill}
            className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${
              canRefill
                ? 'bg-[#1cb0f6] hover:bg-[#1899d6] text-white shadow-[0_4px_0_#1899d6] active:translate-y-1'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Gem size={15} />
            <span>
              Recarregar Cheio ({REFILL_COST} Gemas) {canRefill ? '' : `(Você tem ${gemsCount})`}
            </span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-white font-bold transition"
          >
            Voltar à Trilha
          </button>
        </div>
      </div>
    </div>
  );
};
