
import React, { useState } from 'react';
import { Bot, X, Sparkles, Plus } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiModel } from '../../services/gemini';

const AITaskAssistantModal: React.FC<{
    onClose: () => void;
    onApply: (tasks: any[]) => void;
}> = ({ onClose, onApply }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<any[] | null>(null);
    const [conversation, setConversation] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        // Add user message immediately for UI feedback
        const userMsg = input;
        setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
        setGeneratedTasks(null);
        setInput('');

        try {
            const models = getGeminiModel();
            const response = await models.generateContent({
                model: "gemini-2.5-flash",
                contents: `User request: "${userMsg}".
                
                Goal: The user wants to plan a project, event, or organize their life. 
                Break this down into a list of concrete, actionable sub-tasks.
                
                Output Requirement:
                Return ONLY a JSON object with a property "tasks" which is an array of objects.
                Each object must have:
                - "title": string (The task description, keep it concise)
                - "category": string (Pick a relevant category like 'Casa', 'Trabalho', 'Estudos', 'Pessoal', 'Finanças')
                - "daysFromNow": number (0 for today, 1 for tomorrow, etc. Estimate a reasonable timeline).
                
                Example JSON:
                {
                  "tasks": [
                    { "title": "Buy paint", "category": "Casa", "daysFromNow": 0 },
                    { "title": "Move furniture", "category": "Casa", "daysFromNow": 1 }
                  ]
                }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        category: { type: Type.STRING },
                                        daysFromNow: { type: Type.NUMBER }
                                    },
                                    required: ["title", "category", "daysFromNow"]
                                }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setGeneratedTasks(data.tasks);
                setConversation(prev => [...prev, {
                    role: 'ai',
                    text: `Entendido! Criei um plano com ${data.tasks.length} subtarefas para você.`
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
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-900/50 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Assistente de Planejamento</h3>
                            <p className="text-xs text-indigo-300">Gemini 2.5 Flash</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {conversation.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <Sparkles size={48} className="mx-auto mb-4 text-indigo-500/50" />
                            <p className="text-sm mb-2">Olá! Eu posso te ajudar a planejar.</p>
                            <p className="text-xs">Ex: "Planejar uma festa de aniversário", "Organizar minha mudança", "Roteiro de estudos de React".</p>
                        </div>
                    )}

                    {conversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}

                    {generatedTasks && (
                        <div className="mt-4 bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
                            <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Pré-visualização ({generatedTasks.length} itens)</div>
                            <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                                {generatedTasks.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800/50 text-xs">
                                        <span className="text-slate-300 truncate flex-1">{t.title}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 ml-2">{t.category}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => onApply(generatedTasks)}
                                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                            >
                                <Plus size={16} /> Adicionar Tarefas
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none placeholder:text-slate-600"
                            placeholder="O que você quer planejar?"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                            autoFocus
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                            className="bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-colors"
                        >
                            <Bot size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITaskAssistantModal;
