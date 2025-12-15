import React from 'react';
import { Book as IBook, Folder as IFolder } from '../../../types';
import { X, Library, Folder } from 'lucide-react';

interface MoveBookModalProps {
    book: IBook;
    folders: IFolder[];
    onClose: () => void;
    onMove: (bookId: string, folderId: string | null) => void;
}

const MoveBookModal: React.FC<MoveBookModalProps> = ({ book, folders, onClose, onMove }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-white">Mover "{book.title}"</h3>
                <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
                <button
                    onClick={() => onMove(book.id, null)}
                    className="w-full text-left p-3 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-200 transition-colors"
                >
                    <Library size={16} /> Raiz (Biblioteca)
                </button>
                {folders.map(f => (
                    <button
                        key={f.id}
                        onClick={() => onMove(book.id, f.id)}
                        className="w-full text-left p-3 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-200 transition-colors"
                    >
                        <Folder size={16} className="text-indigo-400" /> {f.name}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

export default MoveBookModal;
