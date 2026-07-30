import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const orderedLevels = useMemo(() => [...levels].sort((a, b) => b.position - a.position), [levels]);
  const activeLevel = useMemo(() => levels.find(l => l.id === activeLevelId) || orderedLevels[0], [levels, activeLevelId, orderedLevels]);

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

  const renderLevelCard = (level: ReadingShelfLevel, isMobile: boolean) => {
    const isActive = level.id === activeLevelId;
    const isDropTarget = level.id === dragTargetLevelId;
    const isEditing = level.id === editingLevelId;
    const count = bookCounts.get(level.id) ?? 0;

    return (
      <div
        key={level.id}
        className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
          isMobile ? 'w-full' : 'min-w-[168px]'
        } ${
          isDropTarget
            ? 'border-[#F3D274] bg-[#D4AF37]/20 shadow-[0_0_24px_rgba(212,175,55,0.24)]'
            : isActive
              ? 'border-[#D4AF37]/70 bg-[#111827]/95'
              : 'border-slate-700/80 bg-[#0D121A]/85'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            onSelectLevel(level.id);
            if (isMobile) setIsMobileDrawerOpen(false);
          }}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/10 text-xs font-bold text-[#F3D274] hover:bg-[#D4AF37]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
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
              className="h-11 min-h-[44px] w-full rounded-md border border-[#D4AF37] bg-[#080B10] px-2 py-1 text-xs text-slate-100 outline-none"
              aria-label={`Nome de ${level.name}`}
            />
          ) : (
            <button
              type="button"
              onClick={() => startEditing(level)}
              className="block min-h-[44px] max-w-full truncate text-left font-serif text-xs font-bold text-slate-100 hover:text-[#F3D274] focus:outline-none"
              title="Clique para renomear este andar"
              aria-label={level.name}
            >
              <span className="truncate">{level.name}</span>
            </button>
          )}
          <span className="block text-[10px] font-sans font-normal text-slate-500">{count} {count === 1 ? 'livro' : 'livros'}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={() => startEditing(level)}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-[#F3D274] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              aria-label={`Renomear ${level.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {levels.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteLevel(level.id)}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-slate-400 hover:bg-red-950/70 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label={`Excluir ${level.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile (<768px): Compact Floating Button */}
      <div className="pointer-events-auto absolute left-[max(0.75rem,env(safe-area-inset-left))] top-16 z-20 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          aria-label="Abrir gaveta de andares"
          className="flex h-11 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full border border-slate-700/90 bg-[#0D121A]/95 px-3.5 py-2 text-xs font-bold text-slate-100 shadow-xl backdrop-blur-md transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 active:scale-95"
        >
          <Layers className="h-4 w-4 text-[#F3D274]" />
          <span className="max-w-[120px] truncate">{activeLevel ? activeLevel.name : 'Andares'}</span>
          <span className="rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[10px] text-[#F3D274]">
            {levels.length}
          </span>
        </button>
      </div>

      {/* Mobile Bottom Sheet / Drawer */}
      {isMobileDrawerOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            role="dialog"
            aria-label="Andares da Estante"
            className="fixed bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-[#0D121A]/98 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-100 shadow-2xl backdrop-blur-xl"
          >
            {/* Drag Handle Bar */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />

            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F3D274]">
                <Layers className="h-4 w-4 text-[#D4AF37]" />
                Andares da Estante
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Fechar gaveta de andares"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {orderedLevels.map((level) => renderLevelCard(level, true))}

              <button
                type="button"
                onClick={onAddLevel}
                aria-label="Novo andar"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-[#0D121A]/75 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-300 transition hover:border-[#D4AF37] hover:text-[#F3D274]"
              >
                <Plus className="h-4 w-4" />
                Novo andar
              </button>

              {draggingBookId && (
                <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0D121A]/90 p-2.5 text-center text-xs text-[#F3D274] shadow-xl">
                  Solte sobre um andar {dragTargetLevelId ? 'destacado' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Tablet (>=768px): Sleek Side Rail */}
      <aside className="pointer-events-auto absolute left-[max(1rem,env(safe-area-inset-left))] top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <div className="mb-1 rounded-xl border border-slate-700/80 bg-[#0D121A]/90 px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 shadow-xl backdrop-blur-md">
          Andares
        </div>

        {orderedLevels.map((level) => renderLevelCard(level, false))}

        <button
          type="button"
          onClick={onAddLevel}
          aria-label="Novo andar"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-600 bg-[#0D121A]/75 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 hover:border-[#D4AF37] hover:text-[#F3D274] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
        >
          <Plus className="h-4 w-4" />
          Novo andar
        </button>

        {draggingBookId && (
          <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0D121A]/90 px-2 py-1.5 text-[10px] text-[#F3D274] shadow-xl">
            Solte sobre um andar
            {dragTargetLevelId ? ' destacado' : ''}
          </div>
        )}
      </aside>
    </>
  );
};

export default ShelfLevelRail;
