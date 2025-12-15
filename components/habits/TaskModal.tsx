import React, { useState, useEffect } from 'react';
import { X, Bell, Save } from 'lucide-react';
import { OrganizeTask } from '../../types';

interface TaskModalProps {
    task: OrganizeTask | null;
    categories: string[];
    onClose: () => void;
    onSave: (data: any) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        category: task?.category || 'Casa',
        dueDate: task?.dueDate || '',
        reminderDate: task?.reminderDate || '',
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                category: task.category,
                dueDate: task.dueDate || '',
                reminderDate: task.reminderDate || '',
            });
        } else {
            setFormData({
                title: '',
                category: 'Casa',
                dueDate: '',
                reminderDate: '',
            });
        }
    }, [task]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">O que precisa ser feito?</label>
                        <input
                            autoFocus
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none placeholder:text-slate-600"
                            placeholder="Ex: Limpar a garagem"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria</label>
                        <div className="relative">
                            <input
                                list="categories-list"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                placeholder="Selecione ou digite..."
                            />
                            <datalist id="categories-list">
                                <option value="Casa" />
                                <option value="Trabalho" />
                                <option value="Finanças" />
                                <option value="Estudos" />
                                <option value="Pessoal" />
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Data Limite</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                <Bell size={10} className="text-yellow-500" /> Lembrete
                            </label>
                            <input
                                type="date"
                                value={formData.reminderDate}
                                onChange={e => setFormData({ ...formData, reminderDate: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                            />
                            {formData.reminderDate && (
                                <p className="text-[10px] text-slate-500 mt-1">Aparecerá no painel neste dia.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
