import React, { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

export const ClickerTool: React.FC = () => {
    const [count, setCount] = useState(0);

    return (
        <div className="max-w-sm mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-8xl font-black text-white mb-8 tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                    {count}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={() => setCount(prev => Math.max(0, prev - 1))}
                        className="h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <Minus size={32} />
                    </button>
                    <button
                        onClick={() => setCount(prev => prev + 1)}
                        className="h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white transition-all active:scale-95"
                    >
                        <Plus size={32} />
                    </button>
                </div>

                <button
                    onClick={() => setCount(0)}
                    className="flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors mx-auto px-4 py-2 hover:bg-slate-800 rounded-lg text-sm font-medium"
                >
                    <RotateCcw size={16} /> Resetar
                </button>
            </div>
            <p className="text-center text-slate-500 mt-4 text-sm">Use para contar repetições, mantras, ou itens.</p>
        </div>
    );
};
