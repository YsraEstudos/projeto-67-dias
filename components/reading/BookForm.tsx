import React, { useState } from 'react';
import { Book as IBook } from '../../types';
import { Save, TrendingUp } from 'lucide-react';

interface BookFormProps {
    initialData: Partial<IBook>;
    onSave: (data: any) => void;
    onCancel: () => void;
    saveLabel?: string;
}

const BookForm: React.FC<BookFormProps> = React.memo(({ initialData, onSave, onCancel, saveLabel = "Salvar" }) => {
    const [formData, setFormData] = useState({
        title: initialData.title || '',
        author: initialData.author || '',
        genre: initialData.genre || '',
        total: initialData.total || 0,
        current: initialData.current || 0,
        unit: initialData.unit || 'PAGES',
        coverUrl: initialData.coverUrl || '',
        notes: initialData.notes || ''
    });

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
                <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Título</label>
                    <input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                        placeholder="Ex: O Hobbit"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Autor</label>
                        <input
                            value={formData.author}
                            onChange={e => setFormData({ ...formData, author: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="J.R.R. Tolkien"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Gênero</label>
                        <input
                            value={formData.genre}
                            onChange={e => setFormData({ ...formData, genre: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="Fantasia"
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2"><TrendingUp size={16} /> Progresso</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Unidade</label>
                            <select
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
                            >
                                <option value="PAGES">Páginas</option>
                                <option value="CHAPTERS">Capítulos</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Atual</label>
                            <input
                                type="number"
                                value={formData.current}
                                onChange={e => setFormData({ ...formData, current: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Total</label>
                            <input
                                type="number"
                                value={formData.total}
                                onChange={e => setFormData({ ...formData, total: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">URL da Capa</label>
                    <div className="flex gap-2">
                        <input
                            value={formData.coverUrl || ''}
                            onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none text-sm"
                        />
                        {formData.coverUrl && (
                            <img
                                src={formData.coverUrl}
                                alt="Preview"
                                className="h-10 w-10 object-cover rounded border border-slate-600"
                                loading="lazy"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Cover';
                                }}
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Notas</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm h-24 resize-none"
                        placeholder="Suas anotações..."
                    />
                </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
                <button onClick={() => onSave(formData)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                    <Save size={18} /> {saveLabel}
                </button>
            </div>
        </div>
    );
});

BookForm.displayName = 'BookForm';
export default BookForm;
