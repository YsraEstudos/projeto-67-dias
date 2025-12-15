import React, { useState } from 'react';
import { Bot, X, BrainCircuit, Plus } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiModel } from '../../../services/gemini';

interface AIRestAssistantModalProps {
    onClose: () => void;
    onApply: (items: any[]) => void;
}

const AIRestAssistantModal: React.FC<AIRestAssistantModalProps> = ({ onClose, onApply }) => {
    const [input, setInput] = useState('');
    const [frequency, setFrequency] = useState<'ONCE' | 'DAILY'>('ONCE');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<any[] | null>(null);
    const [conversation, setConversation] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        const userMsg = input;
        setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
        setGeneratedItems(null);
        setInput('');

        try {
            const models = getGeminiModel();
            const response = await models.generateContent({
                model: "gemini-2.5-flash",
                contents: `User request: "${userMsg}".
                
                Task: The user is planning physical activities, chores, or breaks.
                Break this request down into small, actionable items.
                
                Rules:
                1. If the user mentions sets (e.g., "3 sets of squats"), split them into separate items.
                2. Return JSON object with property "items" which is array of strings (titles).
                3. Keep titles concise and in Portuguese.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            items: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                const itemsWithType = data.items.map((title: string) => ({
                    title,
                    type: frequency
                }));
                setGeneratedItems(itemsWithType);
                setConversation(prev => [...prev, {
                    role: 'ai',
                    text: `Entendido! Quebrei sua solicitação em ${itemsWithType.length} itens.`
                }]);
            }
        } catch (error) {
            console.error(error);
            setConversation(prev => [...prev, { role: 'ai', text: 'Erro ao processar. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-900/30 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Treinador IA</h3>
                            <p className="text-xs text-cyan-400">Gemini 2.5</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {conversation.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <BrainCircuit size={48} className="mx-auto mb-4 text-cyan-500/50" />
                            <p className="text-sm mb-2">Digita o exercício ou rotina.</p>
                            <p className="text-xs">Ex: "3 séries de 15 flexões", "Alongamento completo".</p>
                        </div>
                    )}

                    {conversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-cyan-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}

                    {generatedItems && (
                        <div className="mt-4 bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
                            <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Preview ({generatedItems.length})</div>
                            <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                                {generatedItems.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800/50 text-xs">
                                        <span className="text-slate-300 truncate">{t.title}</span>
                                        <span className="text-[10px] text-slate-500">{t.type === 'ONCE' ? 'Hoje' : 'Diário'}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => onApply(generatedItems)}
                                className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                            >
                                <Plus size={16} /> Adicionar Rotina
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => setFrequency('ONCE')} className={`flex-1 py-1 text-xs rounded border ${frequency === 'ONCE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Só Hoje</button>
                        <button onClick={() => setFrequency('DAILY')} className={`flex-1 py-1 text-xs rounded border ${frequency === 'DAILY' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Diário</button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none placeholder:text-slate-600"
                            placeholder="Digite sua rotina (ex: 4x12 Supino)..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                            autoFocus
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                            className="bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl hover:bg-cyan-500 transition-colors"
                        >
                            <Bot size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIRestAssistantModal;
