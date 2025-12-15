import React from 'react';
import { Book as IBook } from '../../../types';
import BookForm from '../BookForm';
import { Edit2, X } from 'lucide-react';

interface EditBookModalProps {
    book: IBook;
    onClose: () => void;
    onSave: (b: IBook) => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ book, onClose, onSave }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-indigo-400" /> Editar Informações</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <BookForm
                    initialData={book}
                    onCancel={onClose}
                    onSave={(data) => onSave({ ...book, ...data })}
                />
            </div>
        </div>
    );
};

export default EditBookModal;
