import React, { useState } from 'react';
import { X, History, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { Skill, RoadmapBackup } from '../../types';

interface RoadmapBackupModalProps {
    skill: Skill;
    onClose: () => void;
    onRollback: (backupId: string) => void;
    onDelete: (backupId: string) => void;
}

export const RoadmapBackupModal: React.FC<RoadmapBackupModalProps> = ({
    skill,
    onClose,
    onRollback,
    onDelete
}) => {
    const [confirmingRollback, setConfirmingRollback] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    const backups = skill.roadmapHistory || [];

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRollback = (backupId: string) => {
        if (confirmingRollback === backupId) {
            onRollback(backupId);
            setConfirmingRollback(null);
            onClose();
        } else {
            setConfirmingRollback(backupId);
            setConfirmingDelete(null);
        }
    };

    const handleDelete = (backupId: string) => {
        if (confirmingDelete === backupId) {
            onDelete(backupId);
            setConfirmingDelete(null);
        } else {
            setConfirmingDelete(backupId);
            setConfirmingRollback(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <History className="text-amber-400" size={20} />
                        <h3 className="font-bold text-white">Histórico de Backups</h3>
                    </div>
                    <button onClick={onClose}>
                        <X className="text-slate-400 hover:text-white transition-colors" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {backups.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="mx-auto text-slate-600 mb-3" size={48} />
                            <p className="text-slate-400 text-sm">Nenhum backup salvo ainda.</p>
                            <p className="text-slate-500 text-xs mt-1">
                                Backups são criados automaticamente ao importar roadmaps.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backups.map((backup, index) => (
                                <div
                                    key={backup.id}
                                    className={`p-4 rounded-xl border transition-all ${index === 0
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {index === 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    MAIS RECENTE
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(backup.createdAt)}
                                        </span>
                                    </div>

                                    {backup.label && (
                                        <p className="text-white font-medium mb-2 text-sm">
                                            {backup.label}
                                        </p>
                                    )}

                                    <p className="text-xs text-slate-500 mb-3">
                                        {backup.previousRoadmap.length} itens no roadmap
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRollback(backup.id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${confirmingRollback === backup.id
                                                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                                                    : 'bg-slate-600 text-white hover:bg-slate-500'
                                                }`}
                                        >
                                            {confirmingRollback === backup.id ? (
                                                <>
                                                    <AlertCircle size={14} />
                                                    Confirmar Restauração
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw size={14} />
                                                    Restaurar
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(backup.id)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${confirmingDelete === backup.id
                                                    ? 'bg-red-500 text-white hover:bg-red-400'
                                                    : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                                                }`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {confirmingRollback === backup.id && (
                                        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            Um backup do estado atual será criado antes de restaurar.
                                        </p>
                                    )}

                                    {confirmingDelete === backup.id && (
                                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            Clique novamente para excluir permanentemente.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {backups.length > 0 && (
                    <div className="p-3 border-t border-slate-700 bg-slate-900/30 shrink-0">
                        <p className="text-xs text-slate-500 text-center">
                            Máximo de 10 backups são mantidos por skill.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
