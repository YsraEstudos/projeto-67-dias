import { useEffect, useRef } from 'react';

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  // Buttons/links already react to Space natively; avoid double toggles
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A';
};

/** Space toggles start/pause of the timer when focus is not inside a form field or control. */
export function useTimerKeyboardShortcut(onToggle: () => void, enabled = true) {
  const onToggleRef = useRef(onToggle);
  useEffect(() => { onToggleRef.current = onToggle; }, [onToggle]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      event.preventDefault();
      onToggleRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
