import React, { useState } from 'react';
import { Delete, Equal, X, Minus, Plus } from 'lucide-react';

export const CalculatorTool: React.FC = () => {
    const [display, setDisplay] = useState('');

    // Secure expression evaluator using Shunting Yard algorithm
    const safeCalculate = (expression: string): string => {
        try {
            // Strict validation - only allow numbers and basic operators
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                return 'Erro';
            }

            // Tokenize the expression
            const tokens = expression.match(/(\d+\.?\d*|[+\-*/()])/g);
            if (!tokens) return 'Erro';

            // Shunting Yard Algorithm
            const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
            const outputQueue: string[] = [];
            const operatorStack: string[] = [];

            for (const token of tokens) {
                if (/\d/.test(token)) {
                    outputQueue.push(token);
                } else if (token in precedence) {
                    while (
                        operatorStack.length > 0 &&
                        operatorStack[operatorStack.length - 1] in precedence &&
                        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
                    ) {
                        outputQueue.push(operatorStack.pop()!);
                    }
                    operatorStack.push(token);
                } else if (token === '(') {
                    operatorStack.push(token);
                } else if (token === ')') {
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                        outputQueue.push(operatorStack.pop()!);
                    }
                    if (operatorStack.length === 0) return 'Erro'; // Mismatched parentheses
                    operatorStack.pop(); // Remove '('
                }
            }

            while (operatorStack.length > 0) {
                const op = operatorStack.pop()!;
                if (op === '(' || op === ')') return 'Erro'; // Mismatched parentheses
                outputQueue.push(op);
            }

            // Evaluate RPN (Reverse Polish Notation)
            const evalStack: number[] = [];
            for (const token of outputQueue) {
                if (/\d/.test(token)) {
                    evalStack.push(parseFloat(token));
                } else {
                    if (evalStack.length < 2) return 'Erro';
                    const b = evalStack.pop()!;
                    const a = evalStack.pop()!;
                    switch (token) {
                        case '+': evalStack.push(a + b); break;
                        case '-': evalStack.push(a - b); break;
                        case '*': evalStack.push(a * b); break;
                        case '/':
                            if (b === 0) return 'Erro';
                            evalStack.push(a / b);
                            break;
                    }
                }
            }

            if (evalStack.length !== 1) return 'Erro';
            const result = evalStack[0];

            // Format result nicely
            if (!isFinite(result)) return 'Erro';
            return Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
        } catch {
            return 'Erro';
        }
    };

    const handleInput = (val: string) => {
        if (val === 'C') {
            setDisplay('');
        } else if (val === '=') {
            setDisplay(prev => safeCalculate(prev));
        } else {
            setDisplay(prev => prev + val);
        }
    };

    const buttons = [
        { label: 'C', value: 'C', style: 'text-red-400 font-bold' },
        { label: '(', value: '(', style: 'text-slate-400' },
        { label: ')', value: ')', style: 'text-slate-400' },
        { label: '÷', value: '/', style: 'text-indigo-400 font-bold', icon: null },
        { label: '7', value: '7', style: 'text-white font-bold' },
        { label: '8', value: '8', style: 'text-white font-bold' },
        { label: '9', value: '9', style: 'text-white font-bold' },
        { label: '×', value: '*', style: 'text-indigo-400 font-bold', icon: X },
        { label: '4', value: '4', style: 'text-white font-bold' },
        { label: '5', value: '5', style: 'text-white font-bold' },
        { label: '6', value: '6', style: 'text-white font-bold' },
        { label: '-', value: '-', style: 'text-indigo-400 font-bold', icon: Minus },
        { label: '1', value: '1', style: 'text-white font-bold' },
        { label: '2', value: '2', style: 'text-white font-bold' },
        { label: '3', value: '3', style: 'text-white font-bold' },
        { label: '+', value: '+', style: 'text-indigo-400 font-bold', icon: Plus },
        { label: '0', value: '0', style: 'text-white font-bold col-span-2' },
        { label: '.', value: '.', style: 'text-white font-bold' },
        { label: '=', value: '=', style: 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-500', icon: Equal },
    ];

    return (
        <div className="max-w-xs mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="bg-slate-900 h-20 mb-6 rounded-xl border border-slate-800 flex items-center justify-end px-4 overflow-x-auto">
                    <span className="text-3xl font-mono text-white tracking-widest">{display || '0'}</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {buttons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => handleInput(btn.value)}
                            className={`h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 ${btn.style.includes('bg-') ? btn.style : `bg-slate-900 border border-slate-800 hover:bg-slate-800 ${btn.style}`}`}
                        >
                            {btn.icon ? <btn.icon size={20} /> : btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
