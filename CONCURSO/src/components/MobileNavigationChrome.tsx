import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Brain,
  Calendar,
  FileText,
  Folder,
  GripVertical,
  Home,
  Link2,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NAV_ITEMS } from '../app/constants';
import { MAX_MOBILE_PINNED_NAV_ITEMS, type NavPath } from '../app/mobileNavigation';

const SIDEBAR_DROPZONE_ID = 'mobile-nav-sidebar-dropzone';
const ISLAND_SLOT_PREFIX = 'mobile-nav-slot-';

type DragSource = 'sidebar' | 'island';

interface DragPayload {
  path: NavPath;
  source: DragSource;
}

interface MobileNavigationChromeProps {
  activePath: NavPath;
  isOpen: boolean;
  pinnedPaths: NavPath[];
  onClose: () => void;
  onNavigate: (path: NavPath) => void;
  onPin: (path: NavPath, targetIndex?: number) => void;
  onRemove: (path: NavPath) => void;
  onReorder: (path: NavPath, targetIndex: number) => void;
}

const NAV_ICON_MAP: Record<NavPath, LucideIcon> = {
  '/': Home,
  '/plano-diario': Calendar,
  '/conteudo': BookOpen,
  '/anki': Brain,
  '/correcoes': Link2,
  '/simulados-redacoes': FileText,
  '/projetos': Folder,
  '/notas-de-corte': TrendingUp,
  '/configuracoes': Settings,
};

const buildSlotId = (index: number) => `${ISLAND_SLOT_PREFIX}${index}`;

const getSlotIndex = (id: string | null | undefined): number | null => {
  if (!id || !id.startsWith(ISLAND_SLOT_PREFIX)) return null;
  const parsed = Number(id.slice(ISLAND_SLOT_PREFIX.length));
  return Number.isInteger(parsed) ? parsed : null;
};

const buildDragId = (path: NavPath, source: DragSource) => `${source}:${path}`;

const DragPreview = ({ path }: { path: NavPath }) => {
  const navItem = NAV_ITEMS.find((item) => item.to === path);
  if (!navItem) return null;
  const Icon = NAV_ICON_MAP[path];

  return (
    <div className="mobile-nav-drag-preview">
      <div className="mobile-nav-drag-icon">
        <Icon size={18} />
      </div>
      <div className="mobile-nav-drag-copy">
        <strong>{navItem.label}</strong>
        <span>Soltando na ilha</span>
      </div>
      <GripVertical size={14} />
    </div>
  );
};

interface SidebarCardProps {
  activePath: NavPath;
  descriptor: (typeof NAV_ITEMS)[number];
  isPinned: boolean;
  onNavigate: () => void;
  onPin: () => void;
  onRemove: () => void;
}

const SidebarCard = ({ activePath, descriptor, isPinned, onNavigate, onPin, onRemove }: SidebarCardProps) => {
  const Icon = NAV_ICON_MAP[descriptor.to];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: buildDragId(descriptor.to, 'sidebar'),
    data: { path: descriptor.to, source: 'sidebar' } satisfies DragPayload,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mobile-sidebar-card ${descriptor.to === activePath ? 'mobile-sidebar-card-active' : ''} ${isDragging ? 'mobile-sidebar-card-dragging' : ''}`}
      data-testid={`sidebar-card-${descriptor.to}`}
    >
      <button
        type="button"
        className="mobile-sidebar-card-main"
        onClick={onNavigate}
        aria-label={`Abrir ${descriptor.label}`}
      >
        <span className="mobile-sidebar-card-icon">
          <Icon size={18} />
        </span>
        <span className="mobile-sidebar-card-copy">
          <strong>{descriptor.label}</strong>
          <span>{descriptor.shortLabel}</span>
        </span>
      </button>
      <div className="mobile-sidebar-card-actions">
        <button
          type="button"
          className="mobile-sidebar-drag-handle"
          aria-label={`Arrastar ${descriptor.label} para a ilha`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
        <button
          type="button"
          className={`mobile-sidebar-pin ${isPinned ? 'mobile-sidebar-pin-remove' : ''}`}
          onClick={isPinned ? onRemove : onPin}
          aria-label={isPinned ? `Remover ${descriptor.label} da ilha` : `Fixar ${descriptor.label} na ilha`}
        >
          {isPinned ? <X size={14} /> : '+'}
        </button>
      </div>
    </div>
  );
};

interface IslandChipProps {
  activePath: NavPath;
  forceRemoveHint: boolean;
  index: number;
  path: NavPath;
  shake: boolean;
  onMove: (targetIndex: number) => void;
  onNavigate: () => void;
  onRemove: () => void;
}

const IslandChip = ({
  activePath,
  forceRemoveHint,
  index,
  path,
  shake,
  onMove,
  onNavigate,
  onRemove,
}: IslandChipProps) => {
  const navItem = NAV_ITEMS.find((item) => item.to === path);
  const Icon = NAV_ICON_MAP[path];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: buildDragId(path, 'island'),
    data: { path, source: 'island' } satisfies DragPayload,
  });

  if (!navItem) return null;

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mobile-island-chip ${path === activePath ? 'mobile-island-chip-active' : ''} ${forceRemoveHint ? 'mobile-island-chip-danger' : ''} ${shake ? 'mobile-island-chip-shake' : ''} ${isDragging ? 'mobile-island-chip-dragging' : ''}`}
      data-testid={`island-chip-${path}`}
    >
      <button
        type="button"
        className="mobile-island-chip-main"
        onClick={onNavigate}
        aria-label={`Ir para ${navItem.label}`}
      >
        <span
          className="mobile-island-chip-drag"
          aria-label={`Mover ${navItem.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} />
        </span>
        <span className="mobile-island-chip-icon">
          <Icon size={15} />
        </span>
        <span className="mobile-island-chip-copy">
          <strong>{navItem.shortLabel}</strong>
          <span>fixado</span>
        </span>
      </button>

      <button
        type="button"
        className="mobile-island-chip-remove"
        onClick={onRemove}
        aria-label={`Remover ${navItem.label} da ilha`}
      >
        <X size={12} />
      </button>

      <button
        type="button"
        className="sr-only"
        onClick={() => onMove(Math.max(0, index - 1))}
        aria-label={`Mover ${navItem.label} para esquerda`}
      >
        mover para esquerda
      </button>
      <button
        type="button"
        className="sr-only"
        onClick={() => onMove(Math.min(MAX_MOBILE_PINNED_NAV_ITEMS - 1, index + 1))}
        aria-label={`Mover ${navItem.label} para direita`}
      >
        mover para direita
      </button>
    </div>
  );
};

interface IslandSlotProps {
  activePath: NavPath;
  activeDragPath: NavPath | null;
  forceRemoveHint: boolean;
  index: number;
  isProjected: boolean;
  overflowPreview: boolean;
  path?: NavPath;
  onMove: (path: NavPath, targetIndex: number) => void;
  onNavigate: (path: NavPath) => void;
  onRemove: (path: NavPath) => void;
}

const IslandSlot = ({
  activePath,
  activeDragPath,
  forceRemoveHint,
  index,
  isProjected,
  overflowPreview,
  path,
  onMove,
  onNavigate,
  onRemove,
}: IslandSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: buildSlotId(index),
  });

  return (
    <div
      ref={setNodeRef}
      className={`mobile-island-slot ${path ? 'mobile-island-slot-filled' : ''} ${isOver || isProjected ? 'mobile-island-slot-target' : ''} ${overflowPreview ? 'mobile-island-slot-overflow' : ''}`}
      data-testid={`island-slot-${index}`}
    >
      {path ? (
        <IslandChip
          activePath={activePath}
          forceRemoveHint={forceRemoveHint}
          index={index}
          path={path}
          shake={overflowPreview}
          onMove={(targetIndex) => onMove(path, targetIndex)}
          onNavigate={() => onNavigate(path)}
          onRemove={() => onRemove(path)}
        />
      ) : (
        <div className={`mobile-island-empty ${overflowPreview ? 'mobile-island-empty-alert' : ''}`}>
          {activeDragPath && isProjected ? 'Solte aqui' : 'Vaga'}
        </div>
      )}

      {(isOver || isProjected) && !overflowPreview ? <div className="mobile-island-slot-beacon" /> : null}
    </div>
  );
};

export const MobileNavigationChrome = ({
  activePath,
  isOpen,
  pinnedPaths,
  onClose,
  onNavigate,
  onPin,
  onRemove,
  onReorder,
}: MobileNavigationChromeProps) => {
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [projectedIndex, setProjectedIndex] = useState<number | null>(null);
  const [overflowFeedback, setOverflowFeedback] = useState(false);
  const [overflowPreview, setOverflowPreview] = useState(false);
  const overflowTimeoutRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 12 },
    }),
  );

  const pinnedItems = useMemo(
    () => NAV_ITEMS.filter((item) => pinnedPaths.includes(item.to)),
    [pinnedPaths],
  );
  const availableItems = useMemo(
    () => NAV_ITEMS.filter((item) => !pinnedPaths.includes(item.to)),
    [pinnedPaths],
  );
  const canAddMoreItems = pinnedPaths.length < MAX_MOBILE_PINNED_NAV_ITEMS;

  useEffect(() => {
    return () => {
      if (overflowTimeoutRef.current !== null) {
        window.clearTimeout(overflowTimeoutRef.current);
      }
    };
  }, []);

  const triggerOverflowFeedback = () => {
    if (overflowTimeoutRef.current !== null) {
      window.clearTimeout(overflowTimeoutRef.current);
    }

    setOverflowFeedback(true);
    overflowTimeoutRef.current = window.setTimeout(() => {
      setOverflowFeedback(false);
      overflowTimeoutRef.current = null;
    }, 1100);
  };

  const resetDragState = () => {
    setActiveDrag(null);
    setProjectedIndex(null);
    setOverflowPreview(false);
  };

  const requestPin = (path: NavPath, targetIndex?: number) => {
    if (!pinnedPaths.includes(path) && !canAddMoreItems) {
      triggerOverflowFeedback();
      return;
    }

    onPin(path, targetIndex);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const payload = event.active.data.current as DragPayload | undefined;
    if (!payload) return;

    setActiveDrag(payload);

    if (payload.source === 'island') {
      setProjectedIndex(pinnedPaths.indexOf(payload.path));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!activeDrag) return;

    const overId = event.over?.id ? String(event.over.id) : null;
    const slotIndex = getSlotIndex(overId);
    const wouldOverflow =
      activeDrag.source === 'sidebar' &&
      !pinnedPaths.includes(activeDrag.path) &&
      pinnedPaths.length >= MAX_MOBILE_PINNED_NAV_ITEMS;

    if (slotIndex !== null) {
      setOverflowPreview(wouldOverflow);
      setProjectedIndex(wouldOverflow ? null : slotIndex);
      return;
    }

    setOverflowPreview(false);
    setProjectedIndex(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const payload = event.active.data.current as DragPayload | undefined;
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!payload || !overId) {
      resetDragState();
      return;
    }

    const slotIndex = getSlotIndex(overId);
    const wouldOverflow =
      payload.source === 'sidebar' &&
      !pinnedPaths.includes(payload.path) &&
      pinnedPaths.length >= MAX_MOBILE_PINNED_NAV_ITEMS;

    if (slotIndex !== null) {
      if (wouldOverflow) {
        triggerOverflowFeedback();
      } else if (payload.source === 'island') {
        onReorder(payload.path, slotIndex);
      } else {
        onPin(payload.path, slotIndex);
      }
      resetDragState();
      return;
    }

    if (overId === SIDEBAR_DROPZONE_ID && payload.source === 'island') {
      onRemove(payload.path);
    }

    resetDragState();
  };

  const removeHintVisible = overflowFeedback || overflowPreview;

  return (
    <DndContext
      sensors={sensors}
      onDragCancel={resetDragState}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <div
        className={`mobile-nav-chrome ${isOpen ? 'mobile-nav-chrome-open' : ''} ${removeHintVisible ? 'mobile-nav-chrome-overflow' : ''}`}
        data-testid="mobile-nav-chrome"
      >
        <div className={`mobile-island-surface ${isOpen ? 'mobile-island-surface-open' : ''} ${overflowFeedback ? 'mobile-island-surface-danger' : ''}`}>
          <div className="mobile-island-head">
            <span>Ilha dinâmica</span>
            <span>{pinnedPaths.length}/{MAX_MOBILE_PINNED_NAV_ITEMS}</span>
          </div>
          <div className="mobile-island-grid">
            {Array.from({ length: MAX_MOBILE_PINNED_NAV_ITEMS }, (_, index) => (
              <IslandSlot
                key={index}
                activePath={activePath}
                activeDragPath={activeDrag?.path ?? null}
                forceRemoveHint={removeHintVisible}
                index={index}
                isProjected={projectedIndex === index && activeDrag !== null}
                overflowPreview={overflowPreview}
                path={pinnedPaths[index]}
                onMove={onReorder}
                onNavigate={onNavigate}
                onRemove={onRemove}
              />
            ))}
          </div>
          {removeHintVisible ? (
            <div className="mobile-island-warning" data-testid="mobile-island-warning">
              A ilha já está cheia. Remova um atalho pelo X para abrir espaço.
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={`mobile-nav-overlay ${isOpen ? 'mobile-nav-overlay-visible' : ''}`}
          data-testid="mobile-nav-overlay"
          aria-hidden={!isOpen}
          aria-label="Fechar menu lateral"
          onClick={onClose}
        />

        <SidebarDropZone isOpen={isOpen}>
          <div className="mobile-sidebar-shell-head">
            <div>
              <span className="mobile-sidebar-kicker">Concurso</span>
              <strong>Todas as áreas</strong>
            </div>
            <button type="button" className="mobile-sidebar-close" onClick={onClose} aria-label="Fechar menu lateral">
              <X size={16} />
            </button>
          </div>

          <section className="mobile-sidebar-section">
            <div className="mobile-sidebar-section-label">Fixados</div>
            <div className="mobile-sidebar-list">
              {pinnedItems.map((item) => (
                <SidebarCard
                  key={`pinned-${item.to}`}
                  activePath={activePath}
                  descriptor={item}
                  isPinned={true}
                  onNavigate={() => onNavigate(item.to)}
                  onPin={() => requestPin(item.to)}
                  onRemove={() => onRemove(item.to)}
                />
              ))}
            </div>
          </section>

          <section className="mobile-sidebar-section">
            <div className="mobile-sidebar-section-label">Todas as opções</div>
            <div className="mobile-sidebar-list">
              {availableItems.map((item) => (
                <SidebarCard
                  key={item.to}
                  activePath={activePath}
                  descriptor={item}
                  isPinned={false}
                  onNavigate={() => onNavigate(item.to)}
                  onPin={() => requestPin(item.to)}
                  onRemove={() => onRemove(item.to)}
                />
              ))}
            </div>
          </section>
        </SidebarDropZone>
      </div>

      <DragOverlay>
        {activeDrag ? <DragPreview path={activeDrag.path} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

const SidebarDropZone = ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: SIDEBAR_DROPZONE_ID,
  });

  return (
    <aside
      ref={setNodeRef}
      id="main-nav"
      className={`mobile-sidebar-shell ${isOpen ? 'mobile-sidebar-shell-open' : ''} ${isOver ? 'mobile-sidebar-shell-target' : ''}`}
      aria-hidden={!isOpen}
      data-testid="mobile-sidebar-shell"
    >
      {children}
    </aside>
  );
};
