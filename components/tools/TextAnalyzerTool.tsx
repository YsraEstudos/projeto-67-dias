import React, { useState, useMemo } from 'react';
import { AlignLeft, Type, Hash, Clock, Pilcrow } from 'lucide-react';

export const TextAnalyzerTool: React.FC = () => {
    const [textInput, setTextInput] = useState('');

    const textStats = useMemo(() => {
        const trimmed = textInput.trim();
        if (!trimmed) return { words: 0, chars: 0, charsNoSpace: 0, lines: 0, paragraphs: 0, tokens: 0, readTime: 0 };

        const words = trimmed.split(/\s+/).length;
        const chars = textInput.length;
        const charsNoSpace = textInput.replace(/\s/g, '').length;
        const lines = textInput.split(/\n/).length;
        const paragraphs = textInput.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        const tokens = Math.ceil(chars / 4);
        const readTime = Math.ceil(words / 225);

        return { words, chars, charsNoSpace, lines, paragraphs, tokens, readTime };
    }, [textInput]);

    return (
        <div className="animate-in zoom-in-95 duration-300 h-full flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold">
                        <AlignLeft size={14} /> Palavras
                    </div>
                    <div className="text-2xl font-bold text-white">{textStats.words}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold">
                        <Type size={14} /> Caracteres
                    </div>
                    <div className="text-2xl font-bold text-white">{textStats.chars}</div>
                    <div className="text-xs text-slate-500">{textStats.charsNoSpace} sem espaço</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold">
                        <Pilcrow size={14} /> Parágrafos
                    </div>
                    <div className="text-2xl font-bold text-white">{textStats.paragraphs}</div>
                    <div className="text-xs text-slate-500">{textStats.lines} linhas</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs uppercase font-bold">
                        <Clock size={14} /> Tempo Leitura
                    </div>
                    <div className="text-2xl font-bold text-white">{textStats.readTime === 0 ? '< 1' : `~${textStats.readTime}`} min</div>
                    <div className="text-xs text-slate-500">{textStats.tokens} tokens est.</div>
                </div>
            </div>

            <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-1 w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none font-mono text-sm leading-relaxed"
                placeholder="Cole seu texto aqui para analisar..."
            />
        </div>
    );
};
