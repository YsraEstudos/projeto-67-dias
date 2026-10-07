import React, { useState, useEffect, useCallback } from 'react';
import { applyCalculatorInput, mapCalculatorKey } from './utils/calculatorEngine';
import { Delete, Equal, X, Minus, Plus } from 'lucide-react';

export const CalculatorTool: React.FC = () => {
    const [display, setDisplay] = useState('');

    const handleInput = useCallback((val: string) => {
        setDisplay(prev => applyCalculatorInput(prev, val));
    }, []);

    // Keyboard support (digits, operators, Enter, Backspace, Esc) — ignored while typing in other fields
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
            const mapped = mapCalculatorKey(event.key);
            if (!mapped) return;
            // Let Enter/Space activate a focused button normally
            if (mapped === '=' && target?.tagName === 'BUTTON') return;
            event.preventDefault();
            handleInput(mapped);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleInput]);

    const buttons = [
        { label: 'C', value: 'C', style: 'text-red-400 font-bold' },
        { label: '(', value: '(', style: 'text-slate-400' },
        { label: ')', value: ')', style: 'text-slate-400' },
        { label: '÷', value: '/', style: 'text-indigo-400 font-bold', icon: null },
        { label: '7', value: '7', style: 'text-white font-bold' },
        { label: '8', value: '8', style: 'text-white font-bold' },
        { label: '9', value: '9', style: 'text-white font-bold' },
        { label: 'Multiplicar', value: '*', style: 'text-indigo-400 font-bold', icon: X },
        { label: '4', value: '4', style: 'text-white font-bold' },
        { label: '5', value: '5', style: 'text-white font-bold' },
        { label: '6', value: '6', style: 'text-white font-bold' },
        { label: 'Subtrair', value: '-', style: 'text-indigo-400 font-bold', icon: Minus },
        { label: '1', value: '1', style: 'text-white font-bold' },
        { label: '2', value: '2', style: 'text-white font-bold' },
        { label: '3', value: '3', style: 'text-white font-bold' },
        { label: 'Somar', value: '+', style: 'text-indigo-400 font-bold', icon: Plus },
        { label: '0', value: '0', style: 'text-white font-bold' },
        { label: '.', value: '.', style: 'text-white font-bold' },
        { label: 'Apagar', value: 'DEL', style: 'text-amber-400', icon: Delete },
        { label: 'Calcular', value: '=', style: 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-500', icon: Equal },
    ];

    return (
        <div className="max-w-xs mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="bg-slate-900 h-20 mb-6 rounded-xl border border-slate-800 flex items-center justify-end px-4 overflow-x-auto">
                    <span aria-live="polite" data-testid="calculator-display" className="text-3xl font-mono text-white tracking-widest">{display || '0'}</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {buttons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => handleInput(btn.value)}
                            aria-label={btn.icon ? btn.label : undefined}
                            className={`h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 ${btn.style.includes('bg-') ? btn.style : `bg-slate-900 border border-slate-800 hover:bg-slate-800 ${btn.style}`}`}
                        >
                            {btn.icon ? <btn.icon size={20} /> : btn.label}
                        </button>
                    ))}
                </div>
            </div>
            <p className="text-center text-slate-500 mt-4 text-xs">Dica: use o teclado (números, operadores, Enter, Backspace e Esc).</p>
        </div>
    );
};
