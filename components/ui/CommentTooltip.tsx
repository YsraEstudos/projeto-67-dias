import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, ExternalLink, Link as LinkIcon } from 'lucide-react';

interface LinkItem {
    id: string;
    label: string;
    url: string;
}

interface CommentTooltipProps {
    comment: string;
    links?: LinkItem[];
    className?: string;
}

/**
 * CommentTooltip - Botão de comentário com tooltip interativo
 * 
 * Comportamento:
 * - Hover: Mostra o comentário completo com animação suave
 * - Click: Fixa o tooltip na tela
 * - Mouse leave (sem click): Tooltip desaparece com fade-out
 * - Links no texto são automaticamente clicáveis
 * - Links estruturados aparecem em lista separada
 */
const CommentTooltip: React.FC<CommentTooltipProps> = ({ comment, links = [], className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Calcula a posição ideal do tooltip baseado no espaço disponível
    const calculatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        setTooltipPosition(spaceAbove > spaceBelow && spaceAbove > 120 ? 'top' : 'bottom');
    }, []);

    // Fecha o tooltip fixado ao clicar fora
    useEffect(() => {
        if (!isPinned) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                tooltipRef.current && !tooltipRef.current.contains(target)
            ) {
                setIsPinned(false);
                setIsVisible(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsPinned(false);
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isPinned]);

    const handleMouseEnter = () => {
        calculatePosition();
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        if (!isPinned) {
            setIsVisible(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        calculatePosition();
        if (isPinned) {
            setIsPinned(false);
            setIsVisible(false);
        } else {
            setIsPinned(true);
            setIsVisible(true);
        }
    };

    // Renderiza texto com links clicáveis automaticamente
    const renderTextWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                // Reset lastIndex because of global flag
                urlRegex.lastIndex = 0;
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-0.5 break-all transition-colors"
                    >
                        {part.length > 40 ? part.substring(0, 40) + '...' : part}
                        <ExternalLink size={10} className="flex-shrink-0" />
                    </a>
                );
            }
            return part;
        });
    };

    const showTooltip = isVisible || isPinned;
    const hasLinks = links.length > 0;
    const hasContent = comment || hasLinks;

    return (
        <div className={`relative inline-flex ${className}`}>
            {/* Botão de comentário */}
            <button
                ref={buttonRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className={`
          group flex items-center gap-1.5 px-2 py-1 rounded-md
          text-xs transition-all duration-300 ease-out
          ${isPinned
                        ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50'
                        : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50'
                    }
        `}
                aria-label="Ver comentário"
                aria-expanded={showTooltip}
            >
                {hasLinks ? (
                    <LinkIcon
                        size={12}
                        className={`
                            transition-all duration-300
                            ${isPinned ? 'text-cyan-400' : 'group-hover:text-cyan-400'}
                        `}
                    />
                ) : (
                    <MessageSquare
                        size={12}
                        className={`
                            transition-all duration-300
                            ${isPinned ? 'fill-cyan-400/30' : 'group-hover:fill-cyan-400/20'}
                        `}
                    />
                )}
                <span className="truncate max-w-[120px]">
                    {hasLinks && !comment ? `${links.length} link${links.length > 1 ? 's' : ''}` : comment}
                </span>
            </button>

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                role="tooltip"
                className={`
          absolute z-50 w-64 sm:w-80 p-3
          bg-slate-900/95 backdrop-blur-xl
          border border-slate-700/80 rounded-xl
          shadow-2xl shadow-black/50
          transition-all duration-300 ease-out
          ${tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          left-0
          ${showTooltip
                        ? 'opacity-100 visible translate-y-0 scale-100'
                        : 'opacity-0 invisible translate-y-2 scale-95 pointer-events-none'
                    }
        `}
            >
                {/* Indicador de fixado */}
                {isPinned && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse ring-2 ring-cyan-500/30" />
                )}

                {/* Seta do tooltip */}
                <div
                    className={`
            absolute w-3 h-3 bg-slate-900/95 border-slate-700/80 rotate-45
            ${tooltipPosition === 'top'
                            ? 'bottom-[-6px] border-r border-b'
                            : 'top-[-6px] border-l border-t'
                        }
            left-4
          `}
                />

                {/* Header do tooltip */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        {hasLinks ? <LinkIcon size={14} className="text-cyan-400" /> : <MessageSquare size={14} className="text-cyan-400" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {hasLinks && comment ? 'Comentário & Links' : hasLinks ? 'Links' : 'Comentário'}
                    </span>
                    {isPinned && (
                        <span className="ml-auto text-[10px] text-cyan-400 font-medium px-1.5 py-0.5 bg-cyan-500/10 rounded">
                            Fixado
                        </span>
                    )}
                </div>

                {/* Conteúdo do comentário */}
                {comment && (
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                        {renderTextWithLinks(comment)}
                    </p>
                )}

                {/* Lista de Links */}
                {hasLinks && (
                    <div className={`${comment ? 'mt-3 pt-3 border-t border-slate-800' : ''}`}>
                        <div className="space-y-1.5">
                            {links.map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all group/link"
                                >
                                    <ExternalLink size={14} className="text-cyan-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-300 group-hover/link:text-cyan-400 truncate transition-colors">
                                        {link.label || link.url}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dica de interação */}
                <div className={`
          mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500
          transition-opacity duration-300
          ${isPinned ? 'opacity-100' : 'opacity-0'}
        `}>
                    Clique novamente ou pressione ESC para fechar
                </div>
            </div>
        </div>
    );
};

export default CommentTooltip;

