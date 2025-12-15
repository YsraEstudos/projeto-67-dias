import React from 'react';
import { X, Save } from 'lucide-react';
import { useGameFolders, useGameActions } from '../../stores';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gameSchema, GameFormData, GameFormInput } from '../../schemas';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose }) => {
    const folders = useGameFolders();
    const { addGame } = useGameActions();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<GameFormInput, any, GameFormData>({
        resolver: zodResolver(gameSchema),
        defaultValues: {
            title: '',
            platform: '',
            status: 'PLAYING',
            coverUrl: '',
            totalHoursEstimate: undefined,
            folderId: '',
        }
    });

    if (!isOpen) return null;

    const onSubmit = (data: GameFormData) => {
        addGame({
            title: data.title,
            platform: data.platform,
            status: data.status,
            coverUrl: data.coverUrl || undefined,
            totalHoursEstimate: data.totalHoursEstimate,
            hoursPlayed: 0,
            folderId: data.folderId || undefined,
        });

        reset();
        onClose();
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-500">👾</span> Novo Jogo
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

                    {/* Title */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-400">Nome do Jogo</label>
                            {errors.title && <span className="text-xs text-red-400">{errors.title.message}</span>}
                        </div>
                        <input
                            {...register('title')}
                            className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 placeholder:text-slate-600 ${errors.title ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'
                                }`}
                            placeholder="Ex: Elden Ring"
                        />
                    </div>

                    {/* Platform & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-400">Plataforma</label>
                                {errors.platform && <span className="text-xs text-red-400">{errors.platform.message}</span>}
                            </div>
                            <input
                                {...register('platform')}
                                className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 placeholder:text-slate-600 ${errors.platform ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'
                                    }`}
                                placeholder="Ex: PC, Steam"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                            <select
                                {...register('status')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="PLAYING">Jogando</option>
                                <option value="WISHLIST">Desejados</option>
                                <option value="COMPLETED">Zerado</option>
                                <option value="PAUSED">Pausado</option>
                                <option value="ABANDONED">Dropado</option>
                            </select>
                        </div>
                    </div>

                    {/* Folder Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Pasta (Opcional)</label>
                        <select
                            {...register('folderId')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="">Nenhuma (Raiz)</option>
                            {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cover URL */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-400">Capa (URL)</label>
                            {errors.coverUrl && <span className="text-xs text-red-400">{errors.coverUrl.message}</span>}
                        </div>
                        <input
                            {...register('coverUrl')}
                            className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 placeholder:text-slate-600 ${errors.coverUrl ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'
                                }`}
                            placeholder="https://..."
                        />
                    </div>

                    {/* Time Estimate */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-400">Tempo Estimado (horas)</label>
                            {errors.totalHoursEstimate && <span className="text-xs text-red-400">{errors.totalHoursEstimate.message}</span>}
                        </div>
                        <input
                            {...register('totalHoursEstimate')}
                            type="number"
                            min="0"
                            step="1"
                            max="9999"
                            className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 placeholder:text-slate-600 ${errors.totalHoursEstimate ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'
                                }`}
                            placeholder="Ex: 50"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Save size={18} />
                            Salvar Jogo
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
