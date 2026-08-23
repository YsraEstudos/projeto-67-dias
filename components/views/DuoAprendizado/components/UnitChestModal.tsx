import React, { useEffect } from 'react';
import { Gift, Zap, Gem, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playDuoSound } from '../utils/soundEffects';

interface UnitChestModalProps {
  unitId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim: (unitId: number) => void;
}

export const UnitChestModal: React.FC<UnitChestModalProps> = ({
  unitId,
  isOpen,
  onClose,
  onClaim,
}) => {
  useEffect(() => {
    if (isOpen && unitId) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#ffc800', '#1cb0f6', '#58cc02'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, unitId]);

  if (!isOpen || unitId === null) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-[#182232] border-2 border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
          <Gift size={40} />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-500/30">
            Unidade {unitId} Concluída!
          </span>
          <h3 className="font-black text-xl text-white mt-2">Baú de Recompensas!</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Parabéns por dominar todos os tópicos desta unidade! Você conquistou:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col items-center">
            <Zap size={20} className="text-[#ffc800] fill-[#ffc800] mb-1" />
            <span className="text-xs text-slate-400 font-bold">Experiência</span>
            <span className="text-xl font-black text-[#ffc800]">+50 XP</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col items-center">
            <Gem size={20} className="text-[#1cb0f6] fill-[#1cb0f6] mb-1" />
            <span className="text-xs text-slate-400 font-bold">Gemas</span>
            <span className="text-xl font-black text-[#1cb0f6]">+20 💎</span>
          </div>
        </div>

        <button
          onClick={() => {
            playDuoSound('gem');
            onClaim(unitId);
            onClose();
          }}
          className="w-full bg-[#ffc800] hover:bg-[#e5b200] active:translate-y-1 shadow-[0_4px_0_#e5b200] py-3.5 rounded-2xl font-black text-slate-950 text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          <span>Coletar Recompensa</span>
        </button>
      </div>
    </div>
  );
};
