import React, { useState } from 'react';
import { Trash2, Check, XCircle } from 'lucide-react';
import type { MetTargetSession } from '../../../stores';
import { formatDuration } from './utils';

interface HistorySessionItemProps {
    session: MetTargetSession;
    onDelete: (id: string) => void;
}

export const HistorySessionItem: React.FC<HistorySessionItemProps> = React.memo(({ session, onDelete }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleDeleteClick = () => {
        if (isConfirming) {
            onDelete(session.id);
        } else {
            setIsConfirming(true);
            // Auto-reset confirmation after 3 seconds
            setTimeout(() => setIsConfirming(false), 3000);
        }
    };



    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${isConfirming ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
            <div>
                <div className="text-slate-300 font-medium text-sm">
                    {new Date(session.date).toLocaleDateString('pt-BR')} <span className="text-slate-500 text-xs">• {formatDuration(session.durationSeconds)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    Anki: {session.ankiCount} | NCM: {session.ncmCount} | Refat: {session.refactoringsCount || 0}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {!isConfirming && (
                    <div className="px-3 py-1 rounded-lg font-bold text-sm bg-green-500/10 text-green-400">
                        +{session.points} pts
                    </div>
                )}
                <button
                    onClick={handleDeleteClick}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isConfirming ? 'bg-red-500 text-white px-3' : 'text-slate-500 hover:text-red-400 hover:bg-slate-700/50'}`}
                    title={isConfirming ? "Confirmar exclusão" : "Excluir sessão"}
                >
                    {isConfirming ? (
                        <>
                            <span className="text-xs font-bold">Confirmar?</span>
                            <Check size={16} />
                        </>
                    ) : (
                        <Trash2 size={16} />
                    )}
                </button>
                {isConfirming && (
                    <button
                        onClick={() => setIsConfirming(false)}
                        className="p-2 text-slate-400 hover:text-slate-200"
                        title="Cancelar"
                    >
                        <XCircle size={16} />
                    </button>
                )}
            </div>
        </div>
    );
});

HistorySessionItem.displayName = 'HistorySessionItem';
