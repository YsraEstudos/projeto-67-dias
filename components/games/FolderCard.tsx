import React, { useMemo } from 'react';
import { Folder, Clock, Gamepad2, Trash2, Pencil } from 'lucide-react';
import { GameFolder, Game } from '../../types';

interface FolderCardProps {
    folder: GameFolder;
    games: Game[]; // Games inside this folder
    onFolderClick: (folderId: string) => void;
    onEditFolder: (e: React.MouseEvent, folderId: string) => void;
    onDeleteFolder: (e: React.MouseEvent, folderId: string) => void;
}

export const FOLDER_COLORS = {
    purple: {
        bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
        text: 'text-purple-400 group-hover:text-purple-300'
    },
    blue: {
        bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
        text: 'text-blue-400 group-hover:text-blue-300'
    },
    emerald: {
        bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
        text: 'text-emerald-400 group-hover:text-emerald-300'
    },
    amber: {
        bg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
        text: 'text-amber-400 group-hover:text-amber-300'
    },
    pink: {
        bg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
        text: 'text-pink-400 group-hover:text-pink-300'
    },
    cyan: {
        bg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
        text: 'text-cyan-400 group-hover:text-cyan-300'
    }
};

export const FolderCard: React.FC<FolderCardProps> = React.memo(({ folder, games, onFolderClick, onEditFolder, onDeleteFolder }) => {
    // Memoize total hours calculation
    const totalHours = useMemo(() =>
        games.reduce((acc, g) => acc + g.hoursPlayed, 0),
        [games]
    );
    const colorTheme = FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS] || FOLDER_COLORS.purple;

    const handleClick = () => onFolderClick(folder.id);
    const handleEdit = (e: React.MouseEvent) => onEditFolder(e, folder.id);
    const handleDelete = (e: React.MouseEvent) => onDeleteFolder(e, folder.id);

    return (
        <div
            onClick={handleClick}
            className="group relative bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
            <div className={`absolute top-0 right-0 w-16 h-16 ${colorTheme.bg} blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 transition-colors`} />

            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${colorTheme.text} transition-colors`}>
                    <Folder size={24} />
                </div>
                {/* Edit and Delete buttons (hidden for protected folders) */}
                {!folder.isProtected && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleEdit}
                            className="p-2 text-slate-600 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 rounded-lg"
                            title="Editar pasta"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 rounded-lg"
                            title="Excluir pasta"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-200 group-hover:text-white mb-1 transition-colors">{folder.name}</h3>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-3">
                <span className="flex items-center gap-1.5">
                    <Gamepad2 size={14} />
                    {games.length} jogos
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {totalHours}h
                </span>
            </div>
        </div>
    );
});

FolderCard.displayName = 'FolderCard';

