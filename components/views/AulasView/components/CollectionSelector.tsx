import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  bookIds: string[];
}

interface CollectionSelectorProps {
  collections: Collection[];
  currentView: { type: "folder" | "collection"; id: string } | null;
  onSelectCollection: (collectionId: string) => void;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionId: string) => void;
}

export default function CollectionSelector({
  collections,
  currentView,
  onSelectCollection,
  onCreateCollection,
  onDeleteCollection,
}: CollectionSelectorProps) {
  return (
    <div className="pt-6">
      <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3 flex justify-between items-center group">
        <span>Coleções</span>
        <button
          type="button"
          onClick={onCreateCollection}
          className="opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] transition-opacity"
          title="Criar Coleção"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </h2>
      {collections && collections.length > 0 ? (
        collections.map((col) => {
          const isSelected = currentView?.type === "collection" && currentView.id === col.id;
          return (
            <div key={col.id} className="flex items-center group">
              <button
                type="button"
                onClick={() => onSelectCollection(col.id)}
                className={`flex-1 text-left px-3 py-2 text-sm rounded transition-colors ${
                  isSelected
                    ? "border-l-2 border-[#D4AF37] bg-slate-850 text-[#D4AF37] font-medium"
                    : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                {col.name}
              </button>
              <button
                type="button"
                onClick={() => onDeleteCollection(col.id)}
                className="p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity"
                title="Excluir Coleção"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })
      ) : (
        <div className="px-3 py-2 text-xs text-slate-500 italic">Nenhuma coleção</div>
      )}
    </div>
  );
}
