import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  const titleId = useId();
  const startYRef = useRef<number | null>(null);
  const CLOSE_THRESHOLD_PX = 120;

  // Toggle body scroll lock via class to centralize style management in CSS.
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('bottom-sheet-open');
    } else {
      document.body.classList.remove('bottom-sheet-open');
    }

    return () => {
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const startY = startYRef.current;
    if (startY === null) return;

    const currentY = e.touches[0]?.clientY ?? startY;
    const diff = currentY - startY;

    // Swipe down to close
    if (diff > CLOSE_THRESHOLD_PX) {
      onClose();
      startYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="bottom-sheet-backdrop"
        data-testid="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="bottom-sheet-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet-handle" />

        <div className="bottom-sheet-header">
          <h3 id={titleId} className="bottom-sheet-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="mobile-touch-target"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
};
