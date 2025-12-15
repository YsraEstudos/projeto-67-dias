import React, { useState, useEffect } from 'react';
import { Wind } from 'lucide-react';

export const BreathingTool: React.FC = () => {
    const [breathingActive, setBreathingActive] = useState(false);
    const [breathingTechnique, setBreathingTechnique] = useState<'4-7-8' | 'box'>('4-7-8');
    const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-empty'>('inhale');
    const [breathingInstruction, setBreathingInstruction] = useState('Pronto');
    const [breathingScale, setBreathingScale] = useState(1);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (breathingActive) {
            const runPhase = () => {
                if (breathingTechnique === '4-7-8') {
                    // 4-7-8 Cycle
                    if (breathingPhase === 'inhale') {
                        setBreathingInstruction('Inspire...');
                        setBreathingScale(1.5);
                        timeout = setTimeout(() => {
                            setBreathingPhase('hold');
                        }, 4000);
                    } else if (breathingPhase === 'hold') {
                        setBreathingInstruction('Segure...');
                        setBreathingScale(1.5); // Keep expanded
                        timeout = setTimeout(() => {
                            setBreathingPhase('exhale');
                        }, 7000);
                    } else if (breathingPhase === 'exhale') {
                        setBreathingInstruction('Expire...');
                        setBreathingScale(1);
                        timeout = setTimeout(() => {
                            setBreathingPhase('inhale');
                        }, 8000);
                    }
                } else {
                    // Box Breathing Cycle (4-4-4-4)
                    if (breathingPhase === 'inhale') {
                        setBreathingInstruction('Inspire...');
                        setBreathingScale(1.5);
                        timeout = setTimeout(() => {
                            setBreathingPhase('hold');
                        }, 4000);
                    } else if (breathingPhase === 'hold') {
                        setBreathingInstruction('Segure...');
                        setBreathingScale(1.5);
                        timeout = setTimeout(() => {
                            setBreathingPhase('exhale');
                        }, 4000);
                    } else if (breathingPhase === 'exhale') {
                        setBreathingInstruction('Expire...');
                        setBreathingScale(1);
                        timeout = setTimeout(() => {
                            setBreathingPhase('hold-empty');
                        }, 4000);
                    } else if (breathingPhase === 'hold-empty') {
                        setBreathingInstruction('Segure (Vazio)...');
                        setBreathingScale(1);
                        timeout = setTimeout(() => {
                            setBreathingPhase('inhale');
                        }, 4000);
                    }
                }
            };
            runPhase();
        } else {
            // Reset
            setBreathingInstruction('Pronto');
            setBreathingScale(1);
            setBreathingPhase('inhale');
        }

        return () => clearTimeout(timeout);
    }, [breathingActive, breathingPhase, breathingTechnique]);

    const toggleBreathing = () => {
        setBreathingActive(!breathingActive);
        if (!breathingActive) {
            setBreathingPhase('inhale');
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto text-center animate-in zoom-in-95 duration-300">

            <div className="mb-8 flex justify-center gap-2">
                <button
                    onClick={() => { setBreathingTechnique('4-7-8'); setBreathingActive(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${breathingTechnique === '4-7-8' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Relaxamento (4-7-8)
                </button>
                <button
                    onClick={() => { setBreathingTechnique('box'); setBreathingActive(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${breathingTechnique === 'box' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Foco (Box)
                </button>
            </div>

            <div className="relative h-64 w-64 mx-auto mb-10 flex items-center justify-center">
                {/* Outer Rings */}
                <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/20 transition-all duration-[4000ms] ease-in-out`}
                    style={{ transform: `scale(${breathingScale * 1.2})` }}
                />
                <div className={`absolute inset-0 rounded-full border border-cyan-500/10 transition-all duration-[4000ms] ease-in-out`}
                    style={{ transform: `scale(${breathingScale * 1.4})` }}
                />

                {/* Core Circle */}
                <div
                    className={`w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_50px_rgba(34,211,238,0.3)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out z-10`}
                    style={{ transform: `scale(${breathingScale})` }}
                >
                    <span className="text-2xl font-bold text-white drop-shadow-md">
                        {breathingInstruction}
                    </span>
                </div>
            </div>

            <button
                onClick={toggleBreathing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${breathingActive
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-500/20'
                    }`}
            >
                {breathingActive ? 'Parar Sessão' : 'Iniciar Respiração'}
            </button>
            <p className="mt-4 text-slate-500 text-sm">
                {breathingTechnique === '4-7-8'
                    ? 'Inspire (4s) • Segure (7s) • Expire (8s)'
                    : 'Inspire (4s) • Segure (4s) • Expire (4s) • Segure (4s)'}
            </p>
        </div>
    );
};
