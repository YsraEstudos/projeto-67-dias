import React, { useEffect, useState, memo, Suspense } from 'react';
import { useWaterData, useWaterActions } from '../../stores/selectors';
import { Minus, Droplets, Settings } from 'lucide-react';

const BottleManagerModal = React.lazy(() => import('./BottleManagerModal').then(module => ({ default: module.BottleManagerModal })));

export const WaterTracker: React.FC = memo(() => {
    const { currentAmount, dailyGoal, bottles } = useWaterData();
    const { addWater, removeWater, checkDate, setGoal } = useWaterActions();

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ensure we are tracking for the correct day on mount
    useEffect(() => {
        checkDate(new Date().toISOString().split('T')[0]);
    }, [checkDate]);

    const percentage = Math.min(100, Math.max(0, (currentAmount / dailyGoal) * 100));
    const today = new Date().toISOString().split('T')[0];

    // Get smallest bottle amount for correction
    const smallestBottle = bottles.reduce((min, b) => b.amount < min.amount ? b : min, bottles[0]);

    return (
        <>
            <div className="w-full bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg backdrop-blur-sm">
                {/* Background Wave Effects */}
                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none">
                    <div className="absolute bottom-0 w-[200%] h-full bg-cyan-500/30 animate-[wave_8s_linear_infinite]"
                        style={{ transform: 'translateX(-50%)' }} />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

                    {/* Visual Circle Indicator */}
                    <div className="relative w-40 h-40 flex-shrink-0">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />

                        {/* Progress Ring (SVG) */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="46"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray="289.02" // 2 * pi * 46
                                strokeDashoffset={289.02 - (percentage / 100) * 289.02}
                                strokeLinecap="round"
                                className="text-cyan-500 transition-all duration-1000 ease-out"
                            />
                        </svg>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <Droplets size={24} className="text-cyan-400 mb-1" />
                            <span className="text-2xl font-bold">{currentAmount}</span>
                            <span className="text-[10px] text-cyan-300 uppercase tracking-wider">de {dailyGoal}ml</span>
                        </div>

                        {/* Bubbles Animation Effect */}
                        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                            {percentage > 0 && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-cyan-500/20 transition-all duration-1000 ease-out"
                                    style={{ height: `${percentage}%` }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400">
                                    <Droplets size={20} />
                                </span>
                                Hidratação
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-cyan-200 font-medium">
                                    {percentage.toFixed(0)}% da meta
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Gerenciar garrafas"
                                >
                                    <Settings size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Bottle Grid - responsive for varying number of bottles */}
                        <div className={`grid gap-2 mb-4 ${bottles.length <= 3 ? 'grid-cols-3' :
                            bottles.length <= 4 ? 'grid-cols-4' :
                                bottles.length <= 6 ? 'grid-cols-3 sm:grid-cols-6' :
                                    'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'
                            }`}>
                            {bottles.map((bottle) => (
                                <button
                                    key={bottle.id}
                                    onClick={() => addWater(bottle.amount, today)}
                                    className="bottle-btn flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:scale-105 transition-all text-white group"
                                    style={{
                                        '--bottle-color': bottle.color || '#22d3ee',
                                    } as React.CSSProperties}
                                >
                                    <span className="text-xl sm:text-2xl mb-0.5">{bottle.icon || '💧'}</span>
                                    <span
                                        className="font-bold text-sm sm:text-base"
                                        style={{ color: bottle.color || '#22d3ee' }}
                                    >
                                        +{bottle.amount}ml
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate max-w-full">{bottle.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                                onClick={() => removeWater(smallestBottle?.amount || 200, today)}
                                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                            >
                                <Minus size={12} /> Corrigir (-{smallestBottle?.amount || 200}ml)
                            </button>
                            <button
                                onClick={() => {
                                    const newGoal = prompt('Nova meta diária (ml):', dailyGoal.toString());
                                    if (newGoal && !isNaN(Number(newGoal))) {
                                        setGoal(Number(newGoal));
                                    }
                                }}
                                className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                            >
                                Editar Meta
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottle Manager Modal */}
            {isModalOpen && (
                <Suspense fallback={null}>
                    <BottleManagerModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </Suspense>
            )}
        </>
    );
});

