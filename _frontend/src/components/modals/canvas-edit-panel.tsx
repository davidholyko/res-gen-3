import { useCallback, useEffect, useRef } from 'react';

import EditorItem from '@/components/content/editor-item';
import { CANVAS_EDIT_PANEL_ID } from '@/constants';
import { useAppContext } from '@/context/app-context';

// The everyday editing surface (specs/canvas-edit-panel.md): the focused
// block's form, docked to the right of the canvas instead of injected
// inline beneath the block -- opening it never reflows the preview. The
// id is load-bearing: BaseMacro's outside-click/blur logic uses it to
// treat clicks and focus in here as "inside the focused block".
export default function CanvasEditPanel() {
  const { items, canvasEditingContentId, blurCanvasBlock } = useAppContext();

  const editingItem = items.find(
    (item) => item.contentId === canvasEditingContentId,
  );

  // Same treatment as the modal's panel: focus lands in the form.
  // Deferred a tick so it runs after the block's own focus() (the
  // lastCreatedContentId reveal) has settled.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!canvasEditingContentId) return;

    const timeoutId = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('form input, form textarea')
        ?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [canvasEditingContentId]);

  const onDone = useCallback(() => {
    // The guard inside blurCanvasBlock makes this a no-op if focus
    // already moved elsewhere.
    /* v8 ignore next */
    if (!editingItem) return;
    blurCanvasBlock(editingItem.contentId);
  }, [editingItem, blurCanvasBlock]);

  if (!editingItem) {
    return null;
  }

  return (
    <aside
      id={CANVAS_EDIT_PANEL_ID}
      ref={panelRef}
      aria-label="Edit block"
      // Sticky inside the permanently reserved gutter (see main.tsx):
      // the panel follows the viewport while the (much taller) canvas
      // scrolls past, and its appearance never moves or covers the
      // canvas.
      className="sticky top-2 w-full max-h-[calc(100vh-1rem)] overflow-y-auto bg-white border border-gray-300 rounded shadow-lg p-3 flex flex-col gap-3"
    >
      <EditorItem key={editingItem.contentId} {...editingItem} />
      <button
        type="button"
        className="self-end text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded px-3 py-1"
        onClick={onDone}
      >
        Done
      </button>
    </aside>
  );
}
