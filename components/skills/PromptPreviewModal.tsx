import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Prompt, PromptCategory } from '../../types';

interface PromptPreviewModalProps {
    prompt: Prompt | null;
    category?: PromptCategory;
    onClose: () => void;
}

/**
 * Modal for previewing a linked prompt in the resource vault.
 * Shows full content, category, images, and allows copying.
 */
export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
    prompt,
    category,
    onClose
}) => {
    const [copied, setCopied] = useState(false);

    if (!prompt) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = prompt.content;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-xl max-h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center gap-3 bg-slate-900/50 shrink-0">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles size={18} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{prompt.title}</h3>
                        {category && (
                            <span className="text-xs text-slate-400">{category.name}</span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {prompt.content}
                        </pre>
                    </div>

                    {/* Images */}
                    {prompt.images && prompt.images.length > 0 && (
                        <div className="mt-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <ImageIcon size={12} /> Imagens
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                                {prompt.images.map(img => (
                                    <div
                                        key={img.id}
                                        className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.caption || 'Imagem'}
                                            className="w-full h-20 object-cover"
                                        />
                                        {img.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-xs text-slate-300 truncate">
                                                {img.caption}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-slate-400 hover:bg-slate-700 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check size={18} /> Copiado!
                            </>
                        ) : (
                            <>
                                <Copy size={18} /> Copiar Prompt
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
