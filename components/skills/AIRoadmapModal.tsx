import React, { useState } from 'react';
import { Bot, X, Sparkles, CheckCircle, Loader2, Brain, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Type } from "@google/genai";
import { generateWithThinking } from '../../services/gemini';

interface AIRoadmapModalProps {
    skillName: string;
    level: string;
    onClose: () => void;
    onGenerate: (items: string[]) => void;
}

type GenerationPhase = 'idle' | 'analyzing' | 'generating' | 'validating' | 'done' | 'error';

interface CategoryProgress {
    name: string;
    tasks: string[];
    status: 'pending' | 'loading' | 'done';
}

// Schemas for Gemini responses
const CATEGORIES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        categories: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
};

const TASKS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
};

const VALIDATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        isComplete: { type: Type.BOOLEAN },
        missingItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        reasoning: { type: Type.STRING }
    }
};

export const AIRoadmapModal: React.FC<AIRoadmapModalProps> = ({ skillName, level, onClose, onGenerate }) => {
    const [input, setInput] = useState('');
    const [phase, setPhase] = useState<GenerationPhase>('idle');
    const [categories, setCategories] = useState<CategoryProgress[]>([]);
    const [validationReasoning, setValidationReasoning] = useState<string | null>(null);
    const [additionalItems, setAdditionalItems] = useState<string[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const toggleCategory = (name: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    // PHASE 1: Identify categories
    const identifyCategories = async (userPrompt: string): Promise<string[]> => {
        const prompt = `Você é um especialista em ${skillName} nível ${level}.
${userPrompt ? `Contexto adicional do usuário: "${userPrompt}"` : ''}

Identifique as 4-6 principais áreas de estudo essenciais para dominar esta habilidade.
Pense profundamente sobre a progressão lógica e o que é mais importante aprender.

Retorne um JSON com a propriedade "categories" contendo um array de strings.
Exemplo: {"categories": ["Fundamentos", "Prática Básica", "Técnicas Avançadas"]}

Idioma: Português brasileiro.`;

        const response = await generateWithThinking(prompt, CATEGORIES_SCHEMA, 1024);
        if (response.text) {
            const data = JSON.parse(response.text);
            return data.categories || [];
        }
        return [];
    };

    // PHASE 2: Generate tasks per category
    const generateTasksForCategory = async (category: string): Promise<string[]> => {
        const prompt = `Para a área "${category}" de ${skillName} (nível ${level}), crie 3-6 tarefas práticas e acionáveis.

Regras:
- Cada tarefa deve ser específica e mensurável
- Ordene por dificuldade (do mais fácil ao mais difícil)
- Use verbos de ação (Estudar, Praticar, Completar, etc.)

Retorne um JSON com a propriedade "tasks" contendo um array de strings.
Idioma: Português brasileiro.`;

        const response = await generateWithThinking(prompt, TASKS_SCHEMA, 512);
        if (response.text) {
            const data = JSON.parse(response.text);
            return data.tasks || [];
        }
        return [];
    };

    // PHASE 3: Mega Analysis
    const validateAndComplement = async (allTasks: string[]): Promise<{
        reasoning: string;
        missingItems: string[];
    }> => {
        const prompt = `Analise este roadmap completo para ${skillName} (nível ${level}):

${allTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Sua missão:
1. Verifique se há gaps de conhecimento importantes
2. A progressão faz sentido didático?
3. Faltam conceitos fundamentais que todo estudante deveria aprender?

Se encontrar problemas, adicione até 5 tarefas complementares.
Se o roadmap estiver completo, retorne uma lista vazia.

Explique seu raciocínio de forma clara e amigável em português.

Retorne um JSON com:
- "isComplete": boolean
- "missingItems": array de strings (tarefas a adicionar)
- "reasoning": string explicando sua análise`;

        const response = await generateWithThinking(prompt, VALIDATION_SCHEMA, 2048);
        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                reasoning: data.reasoning || 'Análise concluída.',
                missingItems: data.missingItems || []
            };
        }
        return { reasoning: 'Roadmap validado.', missingItems: [] };
    };

    // Main generation flow
    const handleGenerate = async () => {
        setError(null);

        try {
            // PHASE 1: Analyze and identify categories
            setPhase('analyzing');
            const identifiedCategories = await identifyCategories(input);

            if (identifiedCategories.length === 0) {
                throw new Error('Não foi possível identificar áreas de estudo.');
            }

            const initialProgress: CategoryProgress[] = identifiedCategories.map(name => ({
                name,
                tasks: [],
                status: 'pending'
            }));
            setCategories(initialProgress);
            setExpandedCategories(new Set(identifiedCategories));

            // PHASE 2: Generate tasks for each category
            setPhase('generating');
            const updatedCategories = [...initialProgress];

            for (let i = 0; i < updatedCategories.length; i++) {
                updatedCategories[i] = { ...updatedCategories[i], status: 'loading' };
                setCategories([...updatedCategories]);

                const tasks = await generateTasksForCategory(updatedCategories[i].name);
                updatedCategories[i] = { ...updatedCategories[i], tasks, status: 'done' };
                setCategories([...updatedCategories]);
            }

            // PHASE 3: Mega Analysis
            setPhase('validating');
            const allTasks = updatedCategories.flatMap(c => c.tasks);
            const validation = await validateAndComplement(allTasks);

            setValidationReasoning(validation.reasoning);
            setAdditionalItems(validation.missingItems);

            setPhase('done');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erro ao gerar roadmap.');
            setPhase('error');
        }
    };

    // Collect all items for final output
    const getAllItems = (): string[] => {
        const categoryTasks = categories.flatMap(c => c.tasks);
        return [...categoryTasks, ...additionalItems];
    };

    const handleApply = () => {
        onGenerate(getAllItems());
    };

    const handleRetry = () => {
        setPhase('idle');
        setCategories([]);
        setValidationReasoning(null);
        setAdditionalItems([]);
        setError(null);
    };

    // Phase indicator component
    const PhaseIndicator = () => (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border-b border-slate-800">
            {['analyzing', 'generating', 'validating'].map((p, idx) => {
                const labels = ['Analisando', 'Gerando', 'Validando'];
                const isActive = phase === p;
                const isDone = ['analyzing', 'generating', 'validating'].indexOf(phase) > idx || phase === 'done';

                return (
                    <div key={p} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                            {isDone && !isActive ? <CheckCircle size={14} /> : idx + 1}
                        </div>
                        <span className={`text-xs ${isActive ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                            {labels[idx]}
                        </span>
                        {idx < 2 && <div className={`w-8 h-0.5 mx-2 ${isDone ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-900/50 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Gerador de Roadmap Inteligente</h3>
                            <p className="text-xs text-emerald-400">Gemini 2.5 Flash • Modo Pensamento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Phase Indicator (only when generating) */}
                {phase !== 'idle' && phase !== 'error' && <PhaseIndicator />}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {/* Idle State - Input */}
                    {phase === 'idle' && (
                        <>
                            <div className="text-center text-slate-500 py-4">
                                <Brain size={48} className="mx-auto mb-4 text-emerald-500/50" />
                                <p className="text-sm mb-2">O gerador vai analisar <strong className="text-white">{skillName}</strong> em 3 etapas:</p>
                                <div className="flex justify-center gap-2 text-xs mt-3">
                                    <span className="bg-slate-700 px-2 py-1 rounded">1. Identificar áreas</span>
                                    <span className="bg-slate-700 px-2 py-1 rounded">2. Criar tarefas</span>
                                    <span className="bg-slate-700 px-2 py-1 rounded">3. Validar completude</span>
                                </div>
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

                    {/* Analyzing State */}
                    {phase === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 size={32} className="text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-400">Identificando áreas de estudo...</p>
                            <p className="text-xs text-slate-600">A IA está pensando profundamente</p>
                        </div>
                    )}

                    {/* Generating State - Show categories progress */}
                    {(phase === 'generating' || phase === 'validating' || phase === 'done') && categories.length > 0 && (
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <div key={cat.name} className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                                    <button
                                        onClick={() => toggleCategory(cat.name)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {cat.status === 'loading' ? (
                                                <Loader2 size={16} className="text-emerald-400 animate-spin" />
                                            ) : cat.status === 'done' ? (
                                                <CheckCircle size={16} className="text-emerald-500" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                                            )}
                                            <span className="text-sm font-medium text-white">{cat.name}</span>
                                            <span className="text-xs text-slate-500">({cat.tasks.length} tarefas)</span>
                                        </div>
                                        {expandedCategories.has(cat.name) ? (
                                            <ChevronDown size={16} className="text-slate-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-slate-400" />
                                        )}
                                    </button>
                                    {expandedCategories.has(cat.name) && cat.tasks.length > 0 && (
                                        <div className="px-3 pb-3 space-y-1">
                                            {cat.tasks.map((task, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800/50 text-xs text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {task}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Validating State */}
                    {phase === 'validating' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-3 border-t border-slate-800 mt-4">
                            <Brain size={24} className="text-purple-400 animate-pulse" />
                            <p className="text-sm text-slate-400">Mega análise em andamento...</p>
                            <p className="text-xs text-slate-600">Verificando completude e gaps</p>
                        </div>
                    )}

                    {/* Done State - Show validation reasoning */}
                    {phase === 'done' && (
                        <>
                            {validationReasoning && (
                                <div className="bg-gradient-to-r from-purple-900/30 to-slate-900 rounded-xl border border-purple-800/50 p-4 mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain size={16} className="text-purple-400" />
                                        <span className="text-xs font-bold text-purple-300 uppercase">Análise da IA</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{validationReasoning}</p>
                                </div>
                            )}

                            {additionalItems.length > 0 && (
                                <div className="bg-slate-950/50 rounded-xl border border-emerald-800/50 p-3 mt-3">
                                    <div className="text-xs font-bold text-emerald-400 uppercase mb-2">
                                        + {additionalItems.length} itens adicionados pela análise
                                    </div>
                                    <div className="space-y-1">
                                        {additionalItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-emerald-800/30 text-xs text-emerald-300">
                                                <Sparkles size={12} className="text-emerald-400" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-center text-sm text-slate-500 pt-2">
                                Total: <strong className="text-white">{getAllItems().length} tarefas</strong> geradas
                            </div>
                        </>
                    )}

                    {/* Error State */}
                    {phase === 'error' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                            <AlertCircle size={48} className="text-red-400" />
                            <p className="text-sm text-red-400">{error}</p>
                            <p className="text-xs text-slate-500">Tente novamente ou ajuste as instruções.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                    {phase === 'idle' && (
                        <button
                            onClick={handleGenerate}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Brain size={18} /> Gerar Roadmap Inteligente
                        </button>
                    )}

                    {(phase === 'analyzing' || phase === 'generating' || phase === 'validating') && (
                        <div className="w-full text-center py-3 text-slate-500 text-sm">
                            Gerando roadmap...
                        </div>
                    )}

                    {phase === 'done' && (
                        <>
                            <button onClick={handleRetry} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
                                Tentar de novo
                            </button>
                            <button onClick={handleApply} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg">
                                Aplicar ({getAllItems().length} itens)
                            </button>
                        </>
                    )}

                    {phase === 'error' && (
                        <button
                            onClick={handleRetry}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
