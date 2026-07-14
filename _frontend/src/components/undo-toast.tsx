import { useCallback, useEffect, useRef } from 'react';

import { useAppContext } from '@/context/app-context';

const AUTO_DISMISS_MS = 8000;

export default function UndoToast() {
  const { undoSnapshot, performUndo, dismissUndo } = useAppContext();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimeout = useCallback(() => {
    clearPendingTimeout();
    timeoutRef.current = setTimeout(dismissUndo, AUTO_DISMISS_MS);
  }, [clearPendingTimeout, dismissUndo]);

  // Pausing on hover/focus (resumed on mouseleave/blur below) is the
  // practical answer to WCAG 2.2 SC 2.2.1 (Timing Adjustable) here --
  // anyone who needs more time to notice/react keeps the toast alive
  // indefinitely just by hovering or tabbing to it
  // (specs/undo-destructive-actions.md).
  useEffect(() => {
    if (!undoSnapshot) {
      clearPendingTimeout();
      return;
    }

    startTimeout();

    return clearPendingTimeout;
  }, [undoSnapshot, startTimeout, clearPendingTimeout]);

  const onUndoClick = useCallback(() => {
    clearPendingTimeout();
    performUndo();
  }, [clearPendingTimeout, performUndo]);

  if (!undoSnapshot) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      // bottom-right, not bottom-left: a live-browser check caught
      // `next dev`'s own devtools indicator (bottom-left by default)
      // overlapping and partially covering a bottom-left toast -- since
      // `end-to-end/` runs against `next dev`, not a production build,
      // that collision would have been real, not just a dev-mode
      // cosmetic issue.
      className="fixed bottom-4 right-4 z-50 flex items-center gap-4 bg-gray-800 text-white rounded px-4 py-3 shadow-lg"
      onMouseEnter={clearPendingTimeout}
      onMouseLeave={startTimeout}
      onFocus={clearPendingTimeout}
      onBlur={startTimeout}
    >
      <span>{undoSnapshot.description}</span>
      <button
        type="button"
        className="font-bold text-cyan-300 hover:text-cyan-200 hover:underline"
        onClick={onUndoClick}
      >
        Undo
      </button>
    </div>
  );
}
