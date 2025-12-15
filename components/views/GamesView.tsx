import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Plus, Search, Filter, Gamepad2, Trophy, Clock, FolderPlus, ChevronRight, Home, PencilLine } from 'lucide-react';
import { useGames, useGameFolders, useGameFolderActions } from '../../stores';
import { GameStatus, Game, CENTRAL_FOLDER_ID } from '../../types';
import { GameCard } from '../games/GameCard';
import { FolderCard, FOLDER_COLORS } from '../games/FolderCard';

// Lazy load heavy modals to reduce initial bundle size
const AddGameModal = React.lazy(() =>
    import('../games/AddGameModal').then(m => ({ default: m.AddGameModal }))
);
const GameDetailsModal = React.lazy(() =>
    import('../games/GameDetailsModal').then(m => ({ default: m.GameDetailsModal }))
);

const GamesView: React.FC = () => {
    const games = useGames();
    const folders = useGameFolders();
    const { createFolder, deleteFolder } = useGameFolderActions();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [statusFilter, setStatusFilter] = useState<GameStatus | 'ALL'>('ALL');
    const [showPendingReviews, setShowPendingReviews] = useState(false);

    // Sort folders: Central folder always first
    const sortedFolders = useMemo(() => {
        return [...folders].sort((a, b) => {
            if (a.id === CENTRAL_FOLDER_ID) return -1;
            if (b.id === CENTRAL_FOLDER_ID) return 1;
            return 0; // Maintain creation order for others (or add name sort if desired)
        });
    }, [folders]);

    // Debounced search for better performance
    const [searchInputValue, setSearchInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInputValue);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchInputValue]);

    // Folder Navigation
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    const currentFolder = useMemo(() =>
        folders.find(f => f.id === currentFolderId),
        [folders, currentFolderId]
    );

    const filteredGames = useMemo(() => {
        return games.filter((game) => {
            // Pending Reviews Filter Mode
            if (showPendingReviews) {
                return game.reviewPending && game.folderId === CENTRAL_FOLDER_ID;
            }

            const isInCurrentFolder = currentFolderId
                ? game.folderId === currentFolderId
                : !game.folderId;

            const isSearching = searchTerm.trim().length > 0;

            if (isSearching) {
                const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    game.platform.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesSearch;
            }

            const matchesStatus = statusFilter === 'ALL' || game.status === statusFilter;
            return isInCurrentFolder && matchesStatus;
        });
    }, [games, statusFilter, searchTerm, currentFolderId, showPendingReviews]);

    // Folder Handling
    const handleCreateFolder = () => {
        const name = prompt('Nome da nova pasta:');
        if (name) {
            // Pick a random color from available theme
            const availableColors = Object.keys(FOLDER_COLORS);
            const color = availableColors[Math.floor(Math.random() * availableColors.length)];
            createFolder(name, color);
        }
    };

    const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir esta pasta? Os jogos serão movidos para a raiz.')) {
            deleteFolder(folderId);
        }
    };

    // Memoized Statistics (Global) - Single pass through array
    const stats = useMemo(() => {
        let totalHours = 0;
        let completedGames = 0;
        let playingGames = 0;

        for (const g of games) {
            totalHours += g.hoursPlayed;
            if (g.status === 'COMPLETED') completedGames++;
            if (g.status === 'PLAYING') playingGames++;
        }

        return { totalHours, completedGames, playingGames };
    }, [games]);

    // Memoized games grouped by folder - O(N) single pass instead of O(N*M) per folder
    const gamesByFolder = useMemo(() => {
        const map: Record<string, Game[]> = {};
        for (const game of games) {
            const fId = game.folderId || '__root__';
            if (!map[fId]) map[fId] = [];
            map[fId].push(game);
        }
        return map;
    }, [games]);

    // Memoized callbacks for child components
    const handleFolderClick = useCallback((folderId: string) => {
        setCurrentFolderId(folderId);
    }, []);

    const handleGameClick = useCallback((game: Game) => {
        setSelectedGame(game);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.totalHours}h</div>
                        <div className="text-sm text-slate-400">Tempo Total Jogado</div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.completedGames}</div>
                        <div className="text-sm text-slate-400">Jogos Zerados</div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                        <Gamepad2 size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.playingGames}</div>
                        <div className="text-sm text-slate-400">Jogando Atualmente</div>
                    </div>
                </div>
            </div>

            {/* Controls & Navigation */}
            <div className="flex flex-col gap-4">

                {/* Breadcrumb / Tools */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 p-4 rounded-xl border border-slate-800">

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${!currentFolderId ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Home size={16} />
                            <span className="font-medium">Início</span>
                        </button>

                        {/* Pending Reviews Toggle */}
                        <button
                            onClick={() => {
                                setShowPendingReviews(!showPendingReviews);
                                setCurrentFolderId(null);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${showPendingReviews
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <PencilLine size={16} />
                            <span className="font-medium">Resenhas Pendentes</span>
                        </button>

                        {currentFolder && (
                            <>
                                <ChevronRight size={16} className="text-slate-600" />
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg animate-in fade-in slide-in-from-left-2">
                                    <span className="font-medium">{currentFolder.name}</span>
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {!currentFolderId && !searchTerm && (
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 border border-slate-700/50"
                            >
                                <FolderPlus size={18} />
                                Nova Pasta
                            </button>
                        )}

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Novo Jogo
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar em todos os jogos..."
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-slate-600"
                        />
                    </div>

                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as GameStatus | 'ALL')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                        >
                            <option value="ALL">Todos Status</option>
                            <option value="PLAYING">Jogando</option>
                            <option value="WISHLIST">Desejados</option>
                            <option value="COMPLETED">Zerados</option>
                            <option value="PAUSED">Pausados</option>
                            <option value="ABANDONED">Dropados</option>
                        </select>
                    </div>
                </div>

            </div>

            {/* Content Grid */}
            <div className="space-y-8">

                {/* Folders (only show in root and no search and no special filter) */}
                {!currentFolderId && !searchTerm && !showPendingReviews && sortedFolders.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Pastas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {sortedFolders.map(folder => (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    games={gamesByFolder[folder.id] || []}
                                    onFolderClick={handleFolderClick}
                                    onDeleteFolder={handleDeleteFolder}
                                />
                            ))}
                        </div>
                        <div className="h-1 bg-slate-800/50 rounded-full mt-8 mx-4" />
                    </div>
                )}

                {/* Games */}
                <div>
                    {!showPendingReviews && currentFolderId && !searchTerm && (
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Gamepad2 size={16} />
                            <span className="text-sm font-medium">Jogos em {currentFolder?.name}</span>
                        </div>
                    )}

                    {filteredGames.length === 0 && !searchTerm ? (
                        <div className="text-center py-20 text-slate-500">
                            <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Nenhum jogo aqui.</p>
                            <p className="text-sm">Adicione novos jogos ou arraste para esta pasta.</p>
                        </div>
                    ) : filteredGames.length === 0 && searchTerm ? (
                        <div className="text-center py-20 text-slate-500">
                            <p className="text-lg">Nenhum resultado para "{searchTerm}".</p>
                        </div>
                    ) : filteredGames.length === 0 && showPendingReviews ? (
                        <div className="text-center py-20 text-slate-500">
                            <PencilLine size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Nenhuma resenha pendente.</p>
                            <p className="text-sm">Jogos da pasta 67 Days marcados para resenha aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredGames.map((game) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    onGameClick={handleGameClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Lazy Loaded Modals */}
            <Suspense fallback={null}>
                {isAddModalOpen && (
                    <AddGameModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                    />
                )}
            </Suspense>

            <Suspense fallback={null}>
                {selectedGame && (
                    <GameDetailsModal
                        game={selectedGame}
                        onClose={() => setSelectedGame(null)}
                    />
                )}
            </Suspense>

        </div>
    );
};

export default GamesView;
