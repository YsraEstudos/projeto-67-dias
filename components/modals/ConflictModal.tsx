/**
 * Conflict Resolution Modal
 * 
 * Displays when there's a sync conflict between local and remote data.
 * User can choose which version to keep.
 */
import React from 'react';
import { AlertTriangle, Cloud, Smartphone, Clock, X } from 'lucide-react';
import { useConflictStore, formatRelativeTime, Conflict } from '../../stores/conflictStore';
import { writeToFirestore } from '../../stores/firestoreSync';

interface ConflictModalProps {
    conflict: Conflict;
    onResolved?: () => void;
}

const ConflictCard: React.FC<ConflictModalProps> = ({ conflict, onResolved }) => {
    const { resolveConflict, dismissConflict } = useConflictStore();

    const handleChoice = (choice: 'local' | 'remote') => {
        const result = resolveConflict(conflict.id, choice);

        if (result && choice === 'local') {
            // If user chose local, we need to overwrite the remote
            writeToFirestore(result.collectionKey, result.chosenData as object);
        }
        // If user chose remote, no action needed - the Firestore listener will update local state

        onResolved?.();
    };

    const handleDismiss = () => {
        dismissConflict(conflict.id);
        onResolved?.();
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-w-lg w-full">
            {/* Header */}
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-full">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Conflito de Dados</h3>
                        <p className="text-xs text-amber-300/80">{conflict.label}</p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-sm text-slate-300 mb-4">
                    Ao reconectar, encontramos alterações diferentes. Qual versão deseja manter?
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Local Version */}
                    <button
                        onClick={() => handleChoice('local')}
                        className="p-4 bg-slate-900/50 hover:bg-blue-500/10 border border-slate-700 hover:border-blue-500/50 rounded-xl text-left transition-all group"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">Este Dispositivo</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(conflict.localTimestamp)}
                        </div>
                        <div className="mt-3 py-2 px-3 bg-blue-500/10 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium text-blue-400">Manter Local</span>
                        </div>
                    </button>

                    {/* Remote Version */}
                    <button
                        onClick={() => handleChoice('remote')}
                        className="p-4 bg-slate-900/50 hover:bg-purple-500/10 border border-slate-700 hover:border-purple-500/50 rounded-xl text-left transition-all group"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Cloud className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-400">Nuvem</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(conflict.remoteTimestamp)}
                            {conflict.remoteTimestamp > conflict.localTimestamp && (
                                <span className="ml-1 text-emerald-400">(mais recente)</span>
                            )}
                        </div>
                        <div className="mt-3 py-2 px-3 bg-purple-500/10 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium text-purple-400">Manter Nuvem</span>
                        </div>
                    </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                    ⚠️ A versão não escolhida será descartada permanentemente
                </p>
            </div>
        </div>
    );
};

/**
 * Global Conflict Modal Component
 * Renders all pending conflicts as a modal overlay
 */
export const ConflictModal: React.FC = () => {
    const { conflicts } = useConflictStore();

    // Show only the first conflict (FIFO queue)
    const currentConflict = conflicts[0];

    if (!currentConflict) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <ConflictCard conflict={currentConflict} />
        </div>
    );
};

export default ConflictModal;
