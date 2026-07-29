import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReadingShelfLevel } from '../../../types';

interface ShelfLevelRailProps {
  levels: ReadingShelfLevel[];
  bookCounts: Map<string, number>;
  activeLevelId: string | null;
  draggingBookId: string | null;
  dragTargetLevelId: string | null;
  onSelectLevel: (levelId: string) => void;
  onRenameLevel: (levelId: string, name: string) => void;
  onAddLevel: () => void;
  onDeleteLevel: (levelId: string) => void;
}

export const ShelfLevelRail: React.FC<ShelfLevelRailProps> = ({
  levels,
  bookCounts,
  activeLevelId,
  draggingBookId,
  dragTargetLevelId,
  onSelectLevel,
  onRenameLevel,
  onAddLevel,
  onDeleteLevel,
}) => {
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const orderedLevels = useMemo(() => [...levels].sort((a, b) => b.position - a.position), [levels]);

  useEffect(() => {
    if (!editingLevelId || levels.some((level) => level.id === editingLevelId)) return;
    setEditingLevelId(null);
  }, [editingLevelId, levels]);

  const startEditing = (level: ReadingShelfLevel) => {
    setEditingLevelId(level.id);
    setDraftName(level.name);
  };

  const commitName = () => {
    if (!editingLevelId) return;
    onRenameLevel(editingLevelId, draftName);
    setEditingLevelId(null);
  };

  return (
    <aside className="pointer-events-auto absolute left-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
      <div className="mb-1 rounded-xl border border-slate-700/80 bg-[#0D121A]/90 px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 shadow-xl backdrop-blur-md">
        Andares
      </div>

      {orderedLevels.map((level) => {
        const isActive = level.id === activeLevelId;
        const isDropTarget = level.id === dragTargetLevelId;
        const isEditing = level.id === editingLevelId;
        const count = bookCounts.get(level.id) ?? 0;

        return (
          <div
            key={level.id}
            className={`flex min-w-[168px] items-center gap-2 rounded-xl border p-1.5 transition-all ${
              isDropTarget
                ? 'border-[#F3D274] bg-[#D4AF37]/20 shadow-[0_0_24px_rgba(212,175,55,0.24)]'
                : isActive
                  ? 'border-[#D4AF37]/70 bg-[#111827]/95'
                  : 'border-slate-700/80 bg-[#0D121A]/85'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectLevel(level.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[10px] font-bold text-[#F3D274] hover:bg-[#D4AF37]/20"
              aria-label={`Selecionar ${level.name}`}
            >
              {String(level.position + 1).padStart(2, '0')}
            </button>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={commitName}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitName();
                    if (event.key === 'Escape') setEditingLevelId(null);
                  }}
                  className="w-full rounded-md border border-[#D4AF37] bg-[#080B10] px-1.5 py-1 text-xs text-slate-100 outline-none"
                  aria-label={`Nome de ${level.name}`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEditing(level)}
                  className="block max-w-full truncate text-left text-xs font-bold text-slate-100 hover:text-[#F3D274]"
                  title="Clique para renomear este andar"
                >
                  {level.name}
                </button>
              )}
              <span className="text-[10px] text-slate-500">{count} {count === 1 ? 'livro' : 'livros'}</span>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => startEditing(level)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-[#F3D274]"
                  aria-label={`Renomear ${level.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {levels.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteLevel(level.id)}
                  className="rounded-md p-1 text-slate-500 hover:bg-red-950/70 hover:text-red-300"
                  aria-label={`Excluir ${level.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddLevel}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-600 bg-[#0D121A]/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 hover:border-[#D4AF37] hover:text-[#F3D274]"
      >
        <Plus className="h-3.5 w-3.5" />
        Novo andar
      </button>

      {draggingBookId && (
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0D121A]/90 px-2 py-1.5 text-[10px] text-[#F3D274] shadow-xl">
          Solte sobre um andar
          {dragTargetLevelId ? ' destacado' : ''}
        </div>
      )}
    </aside>
  );
};

export default ShelfLevelRail;
