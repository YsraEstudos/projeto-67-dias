import React, { useState } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiModel } from '../../services/gemini';

interface AIRoadmapModalProps {
    skillName: string;
    level: string;
    onClose: () => void;
    onGenerate: (items: string[]) => void;
}

export const AIRoadmapModal: React.FC<AIRoadmapModalProps> = ({ skillName, level, onClose, onGenerate }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<string[] | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        const prompt = input || `Create a study roadmap for learning ${skillName} at ${level} level.`;

        try {
            const models = getGeminiModel();
            const response = await models.generateContent({
                model: "gemini-2.5-flash",
                contents: `User goal: ${prompt}.
                
                Output Requirement:
                Return ONLY a JSON object with a property "roadmap" which is an array of strings (task titles).
                Keep items actionable and concise.
                Language: Portuguese.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            roadmap: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setGeneratedItems(data.roadmap);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-900/50 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Gerador de Roadmap</h3>
                            <p className="text-xs text-emerald-400">Gemini AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {!generatedItems && (
                        <>
                            <div className="text-center text-slate-500 py-6">
                                <Sparkles size={48} className="mx-auto mb-4 text-emerald-500/50" />
                                <p className="text-sm">Defina o foco ou deixe a IA sugerir o caminho ideal para {skillName}.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Instruções extras (Opcional)</label>
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ex: Focar em conversação, ou focar em gramática..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none h-24 resize-none"
                                />
                            </div>
                        </>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center py-10 gap-2 text-emerald-400">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    )}

                    {generatedItems && (
                        <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
                            <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Sugestão ({generatedItems.length} itens)</div>
                            <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                                {generatedItems.map((t, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800/50 text-xs text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                    {!generatedItems ? (
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            <Sparkles size={18} /> Gerar Roadmap
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setGeneratedItems(null)} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">Tentar de novo</button>
                            <button onClick={() => onGenerate(generatedItems)} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg">
                                Aplicar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
