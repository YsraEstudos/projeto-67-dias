import React, { useState } from 'react';
import { Bot, X, Sparkles, CheckCircle, Loader2, Brain, ChevronDown, ChevronRight, AlertCircle, FileText, Layers } from 'lucide-react';
import { Type } from "@google/genai";
import { generateWithThinking } from '../../services/gemini';

interface AIRoadmapModalProps {
    skillName: string;
    level: string;
    onClose: () => void;
    onGenerate: (items: any[]) => void;
}

type GenerationPhase = 'idle' | 'analyzing' | 'generating' | 'validating' | 'done' | 'error';
type GenerationMode = 'generate' | 'organize';

interface CategoryProgress {
    name: string;
    tasks: { title: string; subTasks: string[] }[];
    status: 'pending' | 'loading' | 'done';
}

// Schemas
const CATEGORIES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        categories: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
} as const;

const TASKS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    subTasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["title", "subTasks"]
            }
        }
    }
} as const;

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
} as const;

export const AIRoadmapModal: React.FC<AIRoadmapModalProps> = ({ skillName, level, onClose, onGenerate }) => {
    const [mode, setMode] = useState<GenerationMode>('generate');
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

    // PHASE 1: Identify categories (or Structure for Organize mode)
    const identifyCategories = async (userPrompt: string): Promise<string[]> => {
        let prompt = '';

        if (mode === 'organize') {
            prompt = `Você é um organizador de conteúdo especialista.
O usuário fornecerá um texto/conteúdo sobre ${skillName}.
Sua tarefa é identificar os TÓPICOS PRINCIPAIS (Categorias) abordados no texto.
NÃO CRIE nada que não esteja no texto. Apenas organize o que foi fornecido.

Texto do usuário:
"${userPrompt}"

Retorne um JSON com "categories" (array de strings).
Idioma: Português brasileiro.`;
        } else {
            prompt = `Você é um especialista em ${skillName} nível ${level}.
${userPrompt ? `Contexto adicional do usuário: "${userPrompt}"` : ''}

Identifique as 4-6 principais áreas de estudo essenciais para dominar esta habilidade.
Pense profundamente sobre a progressão lógica e o que é mais importante aprender.

Retorne um JSON com a propriedade "categories" contendo um array de strings.
Exemplo: {"categories": ["Fundamentos", "Prática Básica", "Técnicas Avançadas"]}

Idioma: Português brasileiro.`;
        }

        const response = await generateWithThinking(prompt, CATEGORIES_SCHEMA, 1024);
        if (response.text) {
            const data = JSON.parse(response.text);
            return data.categories || [];
        }
        return [];
    };

    // PHASE 2: Generate tasks per category
    const generateTasksForCategory = async (category: string): Promise<{ title: string; subTasks: string[] }[]> => {
        let prompt = '';

        if (mode === 'organize') {
            prompt = `Para o tópico "${category}" do texto fornecido sobre ${skillName}:
            
Texto original:
"${input}"

Extraia as tarefas ou conceitos desse tópico e organize-os.
Se houver detalhes específicos, coloque como sub-tarefas.
NÃO INVENTE tarefas. Use apenas o que está no texto.

Retorne JSON com "tasks": [{ "title": "...", "subTasks": ["...", "..."] }]`;
        } else {
            prompt = `Para a área "${category}" de ${skillName} (nível ${level}), crie 3-6 tarefas práticas.
Permita criar sub-tarefas para detalhar passos complexos.

Regras:
- Específico e mensurável
- Ordene por dificuldade
- Use subTasks para quebrar tarefas grandes

Retorne JSON com "tasks": [{ "title": "...", "subTasks": ["...", "..."] }]`;
        }

        const response = await generateWithThinking(prompt, TASKS_SCHEMA, 1024);
        if (response.text) {
            const data = JSON.parse(response.text);
            return data.tasks || [];
        }
        return [];
    };

    // PHASE 3: Mega Analysis (Only for Generate Mode)
    const validateAndComplement = async (allTasks: any[]): Promise<{
        reasoning: string;
        missingItems: string[];
    }> => {
        if (mode === 'organize') {
            return { reasoning: 'Conteúdo organizado com sucesso.', missingItems: [] };
        }

        const taskList = allTasks.map((t, i) => `${i + 1}. ${t.title} (${t.subTasks?.length || 0} subs)`).join('\n');

        const prompt = `Analise este roadmap para ${skillName} (${level}):

${taskList}

Missão: verificar gaps e progressão.
Se encontrar problemas, sugira até 3 tarefas macro complementares (sem subtasks por enquanto).

Retorne JSON: { "isComplete": boolean, "missingItems": string[], "reasoning": string }`;

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
        if (mode === 'organize' && !input.trim()) {
            setError('Para organizar, você precisa fornecer o texto/conteúdo.');
            return;
        }

        setError(null);

        try {
            // PHASE 1
            setPhase('analyzing');
            const identifiedCategories = await identifyCategories(input);

            if (identifiedCategories.length === 0) {
                throw new Error('Não foi possível identificar tópicos/áreas.');
            }

            const initialProgress: CategoryProgress[] = identifiedCategories.map(name => ({
                name,
                tasks: [],
                status: 'pending'
            }));
            setCategories(initialProgress);
            setExpandedCategories(new Set(identifiedCategories));

            // PHASE 2
            setPhase('generating');
            const updatedCategories = [...initialProgress];

            for (let i = 0; i < updatedCategories.length; i++) {
                updatedCategories[i] = { ...updatedCategories[i], status: 'loading' };
                setCategories([...updatedCategories]);

                const tasks = await generateTasksForCategory(updatedCategories[i].name);
                updatedCategories[i] = { ...updatedCategories[i], tasks, status: 'done' };
                setCategories([...updatedCategories]);
            }

            // PHASE 3
            setPhase('validating');
            const allTasks = updatedCategories.flatMap(c => c.tasks);
            const validation = await validateAndComplement(allTasks);

            setValidationReasoning(validation.reasoning);
            setAdditionalItems(validation.missingItems);

            setPhase('done');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erro ao processar.');
            setPhase('error');
        }
    };

    // Collect all items for final output
    const getAllItems = () => {
        const categoryTasks = categories.flatMap(c => c.tasks);
        // Additional items come as strings, convert to objects
        const additionalObjs = additionalItems.map(title => ({ title, subTasks: [] }));
        return [...categoryTasks, ...additionalObjs];
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

    const PhaseIndicator = () => (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border-b border-slate-800">
            {['analyzing', 'generating', 'validating'].map((p, idx) => {
                const labels = mode === 'organize'
                    ? ['Lendo', 'Estruturando', 'Finalizando']
                    : ['Analisando', 'Gerando', 'Validando'];

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
                            <h3 className="font-bold text-white">Assistente de Roadmap</h3>
                            <p className="text-xs text-emerald-400">Gemini 2.5 Flash • Modo Pensamento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Phase Indicator */}
                {phase !== 'idle' && phase !== 'error' && <PhaseIndicator />}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {/* Idle State - Input & Mode Selection */}
                    {phase === 'idle' && (
                        <>
                            {/* Mode Selection */}
                            <div className="bg-slate-900/50 p-1 rounded-xl flex border border-slate-800 mb-4">
                                <button
                                    onClick={() => setMode('generate')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                    ${mode === 'generate' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Sparkles size={16} />
                                    Criar do Zero
                                </button>
                                <button
                                    onClick={() => setMode('organize')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                    ${mode === 'organize' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Layers size={16} />
                                    Organizar Conteúdo
                                </button>
                            </div>

                            <div className="text-center text-slate-500 py-2">
                                {mode === 'generate' ? (
                                    <>
                                        <Brain size={42} className="mx-auto mb-3 text-emerald-500/50" />
                                        <p className="text-sm">A IA vai criar um plano de estudos completo para <strong>{skillName}</strong>.</p>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={42} className="mx-auto mb-3 text-blue-500/50" />
                                        <p className="text-sm">Cole seu texto, anotações ou ementa de curso. A IA vai <strong>estruturar tudo em tarefas</strong> para você.</p>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
                                    {mode === 'generate' ? 'Instruções extras (Opcional)' : 'Cole seu conteúdo aqui (Obrigatório)'}
                                </label>
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={mode === 'generate'
                                        ? "Ex: Focar em conversação, ou focar em gramática..."
                                        : "Cole aqui o texto, resumo ou lista bagunçada..."}
                                    className={`w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none resize-none transition-all
                                        ${mode === 'organize' ? 'h-40' : 'h-24'}`}
                                />
                            </div>
                        </>
                    )}

                    {/* Analyzing State */}
                    {phase === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 size={32} className="text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-400">
                                {mode === 'generate' ? 'Planejando estrutura...' : 'Lendo seu conteúdo...'}
                            </p>
                        </div>
                    )}

                    {/* Generating State */}
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
                                        <div className="px-3 pb-3 space-y-2">
                                            {cat.tasks.map((task, idx) => (
                                                <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800/50">
                                                    <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {task.title}
                                                    </div>
                                                    {task.subTasks && task.subTasks.length > 0 && (
                                                        <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-2">
                                                            {task.subTasks.map((sub, sIdx) => (
                                                                <div key={sIdx} className="text-xs text-slate-500">
                                                                    - {sub}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Validating/Done Info */}
                    {(phase === 'done' || phase === 'validating') && validationReasoning && (
                        <div className="bg-gradient-to-r from-purple-900/30 to-slate-900 rounded-xl border border-purple-800/50 p-4 mt-4 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={16} className="text-purple-400" />
                                <span className="text-xs font-bold text-purple-300 uppercase">Análise da IA</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{validationReasoning}</p>
                        </div>
                    )}

                    {/* Error State */}
                    {phase === 'error' && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                            <AlertCircle size={48} className="text-red-400" />
                            <p className="text-sm text-red-400">{error}</p>
                            <button onClick={handleRetry} className="text-xs text-slate-400 underline">Tentar novamente</button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                    {phase === 'idle' && (
                        <button
                            onClick={handleGenerate}
                            disabled={mode === 'organize' && !input.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            {mode === 'generate' ? <Brain size={18} /> : <Layers size={18} />}
                            {mode === 'generate' ? 'Gerar Roadmap' : 'Organizar Tarefas'}
                        </button>
                    )}

                    {(phase === 'analyzing' || phase === 'generating' || phase === 'validating') && (
                        <div className="w-full text-center py-3 text-slate-500 text-sm">
                            Processando...
                        </div>
                    )}

                    {phase === 'done' && (
                        <>
                            <button onClick={handleRetry} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
                                Refazer
                            </button>
                            <button onClick={handleApply} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg">
                                Aplicar ({categories.reduce((acc, c) => acc + c.tasks.length, 0) + additionalItems.length} itens)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
