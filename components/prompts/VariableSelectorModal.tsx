import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Check, Sparkles, Eye } from 'lucide-react';
import { PromptVariable } from '../../types';
import { VariableSelector } from './VariableSelector';

// Regex para encontrar variáveis no formato {{nome|op1,op2,op3}}
const VARIABLE_REGEX = /\{\{(\w+)\|([^}]+)\}\}/g;

export interface ParsedVariable {
    id: string;
    name: string;
    options: string[];
    fullMatch: string;
}

/**
 * Extrai variáveis do conteúdo do prompt.
 * Formato: {{nome|opção1,opção2,opção3}}
 */
export const parseVariables = (content: string): ParsedVariable[] => {
    const variables: ParsedVariable[] = [];
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    VARIABLE_REGEX.lastIndex = 0;

    while ((match = VARIABLE_REGEX.exec(content)) !== null) {
        const [fullMatch, name, optionsStr] = match;
        const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);

        // Evitar duplicatas pelo nome
        if (!variables.some(v => v.name === name)) {
            variables.push({
                id: `var_${name}_${Date.now()}`,
                name,
                options,
                fullMatch,
            });
        }
    }

    return variables;
};

/**
 * Substitui variáveis no texto pelos valores selecionados.
 */
export const replaceVariables = (
    content: string,
    selections: Record<string, string>
): string => {
    let result = content;

    VARIABLE_REGEX.lastIndex = 0;

    result = result.replace(VARIABLE_REGEX, (_, name) => {
        return selections[name] || `[${name}]`;
    });

    return result;
};

interface VariableSelectorModalProps {
    content: string;
    onCopy: (processedContent: string) => void;
    onClose: () => void;
}

/**
 * Modal que aparece ao copiar um prompt com variáveis.
 * - Lista todas as variáveis encontradas
 * - Cada variável tem seu VariableSelector
 * - Preview do texto resultante em tempo real
 * - Animações suaves de entrada/saída
 */
export const VariableSelectorModal: React.FC<VariableSelectorModalProps> = ({
    content,
    onCopy,
    onClose,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Parse variáveis do conteúdo
    const variables = useMemo(() => parseVariables(content), [content]);

    // Estado das seleções (nome -> valor selecionado)
    const [selections, setSelections] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        variables.forEach(v => {
            initial[v.name] = v.options[0] || '';
        });
        return initial;
    });

    // Preview do texto com variáveis substituídas
    const previewContent = useMemo(
        () => replaceVariables(content, selections),
        [content, selections]
    );

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 200);
    };

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(previewContent);
            } else {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = previewContent;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            setIsCopied(true);
            onCopy(previewContent);

            setTimeout(() => {
                handleClose();
            }, 800);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const updateSelection = (name: string, value: string) => {
        setSelections(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div
            className={`
        fixed inset-0 z-[60] flex items-center justify-center 
        bg-black/70 backdrop-blur-sm p-4
        transition-opacity duration-200 ease-out
        ${isExiting ? 'opacity-0' : 'animate-in fade-in duration-200'}
      `}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`
          bg-slate-800/95 backdrop-blur-xl
          w-full max-w-xl max-h-[85vh]
          rounded-2xl border border-slate-600/50
          shadow-2xl shadow-black/40
          overflow-hidden flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isExiting
                        ? 'opacity-0 scale-95 translate-y-4'
                        : 'animate-in zoom-in-95 slide-in-from-bottom-4 duration-300'
                    }
        `}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Sparkles size={18} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Personalizar Prompt</h3>
                            <p className="text-[11px] text-slate-500">Selecione as opções desejadas</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Variables Selection */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    {/* Variables Grid */}
                    <div className="flex flex-wrap gap-4">
                        {variables.map(variable => (
                            <VariableSelector
                                key={variable.id}
                                name={variable.name}
                                options={variable.options}
                                value={selections[variable.name] || variable.options[0]}
                                onChange={(value) => updateSelection(variable.name, value)}
                            />
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-700/50" />
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-bold">
                            <Eye size={12} />
                            Preview
                        </div>
                        <div className="flex-1 h-px bg-slate-700/50" />
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 max-h-48 overflow-y-auto">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                            {previewContent}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-700 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={isCopied}
                        className={`
              flex-1 py-3 rounded-xl font-bold text-sm
              flex items-center justify-center gap-2
              transition-all duration-300 ease-out
              ${isCopied
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98]'
                            }
            `}
                    >
                        {isCopied ? (
                            <>
                                <Check size={18} className="animate-in zoom-in duration-200" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy size={18} />
                                Copiar Prompt
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariableSelectorModal;
