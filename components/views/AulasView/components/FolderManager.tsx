import React, { useState } from "react";
import { Plus, ChevronRight, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

interface FolderNodeProps {
  folder: Folder;
  allFolders: Folder[];
  currentView: { type: "folder" | "collection"; id: string } | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folder: { id: string; name: string }) => void;
  onDeleteFolder: (folderId: string) => void;
  expandedFolders: string[];
  toggleFolderExpand: (folderId: string) => void;
  depth: number;
}

const DroppableFolder = React.memo(function DroppableFolder({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: { type: "folder", id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} transition-all duration-300 ${
        isOver
          ? "bg-slate-800/80 ring-2 ring-[#D4AF37] scale-[1.03] shadow-lg shadow-[#D4AF37]/10 rounded-md"
          : ""
      }`}
    >
      {children}
    </div>
  );
});

const FolderNode = React.memo(function FolderNode({
  folder,
  allFolders,
  currentView,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  expandedFolders,
  toggleFolderExpand,
  depth,
}: FolderNodeProps) {
  const subfolders = allFolders.filter((sub) => sub.parentId === folder.id);
  const isExpanded = expandedFolders.includes(folder.id);
  const isSelected = currentView?.type === "folder" && currentView.id === folder.id;

  const handleFolderClick = () => {
    onSelectFolder(folder.id);
    toggleFolderExpand(folder.id);
  };

  return (
    <div className="space-y-1">
      <DroppableFolder id={folder.id} className="flex items-center group">
        <button
          type="button"
          onClick={handleFolderClick}
          className={`flex-1 flex items-center gap-1.5 text-left px-3 rounded transition-colors ${
            isSelected
              ? "border-l-2 border-[#D4AF37] bg-slate-850 text-[#D4AF37] font-medium"
              : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          } ${depth > 0 ? "text-xs py-1.5" : "text-sm py-2"}`}
        >
          {subfolders.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="flex-1 truncate">{folder.name}</span>
        </button>

        <button
          type="button"
          onClick={() => onCreateFolder(folder.id)}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] text-slate-400 transition-opacity"
          title="Adicionar Subpasta"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRenameFolder({ id: folder.id, name: folder.name })}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] text-slate-400 transition-opacity"
          title="Renomear Pasta"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteFolder(folder.id)}
          className="p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity"
          title="Excluir Pasta"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </DroppableFolder>

      {isExpanded && subfolders.length > 0 && (
        <div className="space-y-1 border-l border-slate-800 ml-4 pl-1">
          {subfolders.map((subf) => (
            <FolderNode
              key={subf.id}
              folder={subf}
              allFolders={allFolders}
              currentView={currentView}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              expandedFolders={expandedFolders}
              toggleFolderExpand={toggleFolderExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface FolderManagerProps {
  folders: Folder[];
  currentView: { type: "folder" | "collection"; id: string } | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folder: { id: string; name: string }) => void;
  onDeleteFolder: (folderId: string) => void;
}

export default function FolderManager({
  folders,
  currentView,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderManagerProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3 flex justify-between items-center group">
        <span>Pastas</span>
        <button
          type="button"
          onClick={() => onCreateFolder()}
          className="opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] transition-opacity"
          title="Adicionar Pasta Raiz"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </h2>

      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          allFolders={folders}
          currentView={currentView}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          expandedFolders={expandedFolders}
          toggleFolderExpand={toggleFolderExpand}
          depth={0}
        />
      ))}
    </div>
  );
}
