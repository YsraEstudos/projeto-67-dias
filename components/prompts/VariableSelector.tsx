import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface VariableSelectorProps {
    name: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/**
 * Seletor de variável individual com animações estilo macOS.
 * Features:
 * - Dropdown minimalista com blur de fundo
 * - Spring animation ao abrir/fechar
 * - Suporte a teclado (arrows, enter, escape)
 * - Highlight animado da opção selecionada
 */
export const VariableSelector: React.FC<VariableSelectorProps> = ({
    name,
    options,
    value,
    onChange,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Atualizar highlighted index quando value muda
    useEffect(() => {
        const idx = options.indexOf(value);
        if (idx !== -1) setHighlightedIndex(idx);
    }, [value, options]);

    // Scroll para opção destacada
    useEffect(() => {
        if (isOpen && optionsRef.current) {
            const highlighted = optionsRef.current.children[highlightedIndex] as HTMLElement;
            if (highlighted) {
                highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [highlightedIndex, isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (isOpen) {
                    onChange(options[highlightedIndex]);
                    setIsOpen(false);
                } else {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev => Math.max(prev - 1, 0));
                }
                break;
        }
    }, [disabled, isOpen, highlightedIndex, options, onChange]);

    const selectOption = (option: string, index: number) => {
        onChange(option);
        setHighlightedIndex(index);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className="relative inline-flex flex-col"
        >
            {/* Label */}
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wide">
                {name}
            </label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
          relative flex items-center justify-between gap-2 
          min-w-[140px] px-3 py-2.5
          bg-slate-800/80 backdrop-blur-sm
          border border-slate-600/50 rounded-xl
          text-sm font-medium text-white
          transition-all duration-200 ease-out
          hover:border-purple-500/50 hover:bg-slate-700/80
          focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-purple-500 bg-slate-700/80 shadow-lg shadow-purple-900/20' : ''}
        `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{value}</span>
                <ChevronDown
                    size={16}
                    className={`
            text-slate-400 transition-transform duration-300 ease-out
            ${isOpen ? 'rotate-180 text-purple-400' : ''}
          `}
                />
            </button>

            {/* Dropdown Options */}
            <div
                ref={optionsRef}
                role="listbox"
                aria-label={`Opções para ${name}`}
                className={`
          absolute top-full left-0 right-0 z-50 mt-2
          bg-slate-800/95 backdrop-blur-xl
          border border-slate-600/50 rounded-xl
          shadow-2xl shadow-black/30
          overflow-hidden overflow-y-auto max-h-48
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          origin-top
          ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }
        `}
            >
                {options.map((option, index) => {
                    const isSelected = option === value;
                    const isHighlighted = index === highlightedIndex;

                    return (
                        <button
                            key={option}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => selectOption(option, index)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`
                relative w-full px-3 py-2.5 text-left text-sm
                flex items-center justify-between gap-2
                transition-all duration-150 ease-out
                ${isHighlighted
                                    ? 'bg-purple-500/20 text-white'
                                    : 'text-slate-300 hover:text-white'
                                }
                ${isSelected ? 'font-medium' : ''}
              `}
                        >
                            <span className="truncate">{option}</span>

                            {/* Check mark for selected */}
                            <div className={`
                transition-all duration-200 ease-out
                ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
              `}>
                                <Check size={14} className="text-purple-400" />
                            </div>

                            {/* Animated highlight bar */}
                            {isHighlighted && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 
                    animate-in slide-in-from-left duration-200"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default VariableSelector;
