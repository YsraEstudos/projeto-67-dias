/**
 * BlockContextMenu Component
 * 
 * Context menu for scheduled blocks with:
 * - Add/Edit note
 * - Edit block
 * - Delete block
 * 
 * Appears on right-click (desktop) or long-press (mobile)
 */
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Edit2, Trash2, X, Save } from 'lucide-react';
import { ScheduledBlock } from '../../../types';

interface BlockContextMenuProps {
    block: ScheduledBlock;
    position: { x: number; y: number };
    onClose: () => void;
    onAddNote: (blockId: string, note: string) => void;
    onEditBlock: () => void;
    onDeleteBlock: () => void;
}

export const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
    block,
    position,
    onClose,
    onAddNote,
    onEditBlock,
    onDeleteBlock
}) => {
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState(block.notes || '');
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Focus input when showing
    useEffect(() => {
        if (showNoteInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showNoteInput]);

    // Adjust position to stay within viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 220),
        y: Math.min(position.y, window.innerHeight - 200)
    };

    const handleSaveNote = () => {
        onAddNote(block.id, noteText);
        onClose();
    };

    const handleDeleteNote = () => {
        onAddNote(block.id, '');
        setNoteText('');
        setShowNoteInput(false);
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                minWidth: showNoteInput ? '280px' : '180px'
            }}
        >
            {!showNoteInput ? (
                <div className="py-1">
                    <button
                        onClick={() => setShowNoteInput(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                    >
                        <MessageSquare size={16} className="text-blue-400" />
                        <span className="text-sm font-medium">
                            {block.notes ? 'Editar Nota' : 'Adicionar Nota'}
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            onEditBlock();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                    >
                        <Edit2 size={16} className="text-emerald-400" />
                        <span className="text-sm font-medium">Editar Bloco</span>
                    </button>
                    <div className="border-t border-slate-700 my-1" />
                    <button
                        onClick={() => {
                            if (confirm('Excluir este bloco?')) {
                                onDeleteBlock();
                                onClose();
                            }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 transition-colors text-slate-300 hover:text-red-400"
                    >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Excluir</span>
                    </button>
                </div>
            ) : (
                <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                            <MessageSquare size={14} className="text-blue-400" />
                            Nota
                        </span>
                        <button
                            onClick={() => setShowNoteInput(false)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <textarea
                        ref={inputRef}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Adicione uma nota..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm placeholder-slate-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                        {block.notes && (
                            <button
                                onClick={handleDeleteNote}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                Remover
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            onClick={handleSaveNote}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            <Save size={12} />
                            Salvar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockContextMenu;
