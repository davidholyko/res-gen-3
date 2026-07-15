import c from 'classnames';
import { FocusEvent, ReactNode, useCallback, useEffect, useRef } from 'react';

import { CANVAS_EDIT_PANEL_ID } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';

import { MacroTopBar } from '../sub-components/macro-top-bar';

type BaseMacroProps = ContentAll & {
  children: ReactNode;
};

// The canvas-side edit panel counts as an extension of the focused
// block (specs/canvas-edit-panel.md): clicking or tabbing into it must
// not read as "clicked outside", or the first keystroke's target would
// close the panel out from under the cursor.
function isInsideEditPanel(target: EventTarget | null): boolean {
  return Boolean(
    target instanceof Element && target.closest(`#${CANVAS_EDIT_PANEL_ID}`),
  );
}

export default function BaseMacro(props: BaseMacroProps) {
  const { children, contentId } = props;

  const {
    onDelete,
    lastCreatedContentId,
    pushUndoSnapshot,
    canvasEditingContentId,
    focusCanvasBlock,
    blurCanvasBlock,
  } = useAppContext();

  // Derived from app state, not a local flag (specs/canvas-edit-panel.md):
  // the docked panel, a click on another block, and the panel's own Done
  // button all have to agree on which block is focused.
  const isFocused = canvasEditingContentId === contentId;

  const divRef = useRef<HTMLDivElement>(null);

  // Scrolls a newly-added block into view and reveals its edit controls
  // (via the existing focus-triggered reveal below) -- without this, a
  // block added into an off-screen layout gives no indication anything
  // happened at all. preventScroll on focus() avoids double-scrolling
  // against the smooth scrollIntoView already doing that job.
  useEffect(() => {
    if (lastCreatedContentId !== contentId) return;

    divRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    divRef.current?.focus({ preventScroll: true });
  }, [lastCreatedContentId, contentId]);

  // mousedown, not click (same convention as BaseMenu's outside-close):
  // a click's target is the common ancestor of where the mouse went DOWN
  // and where it came UP -- and this app's own reactions to the
  // mousedown (the focused block growing its toolbar, the previously
  // focused block collapsing, the browser scrolling the newly focused
  // block into view) reflow the page between those two moments. With a
  // real mouse (which always travels a few pixels and holds for
  // ~100ms), the click target could resolve to a container outside
  // every block, reading as "clicked outside" and closing the panel
  // that the very same gesture had just opened. At mousedown time the
  // layout is still pristine and the target unambiguous.
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      // This listener is only attached (see the effect below) once this
      // component -- and therefore divRef.current -- has mounted, so
      // this guard can't actually be false.
      /* v8 ignore next */
      if (!divRef.current) return;

      if (divRef.current.contains(event.target as Node)) {
        focusCanvasBlock(contentId);
      } else if (!isInsideEditPanel(event.target)) {
        blurCanvasBlock(contentId);
      }
    },
    [contentId, focusCanvasBlock, blurCanvasBlock],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseDown]);

  // The mousedown listener above only reveals this macro's controls for
  // mouse users (a keyboard user tabbing onto the div never presses the
  // mouse, so focus would never move and the delete/reorder/edit controls
  // would stay permanently unreachable without a mouse -- WCAG 2.1.1). These
  // focus/blur handlers give keyboard users the same reveal, while
  // treating focus moving to a child (e.g. into the revealed top bar) or
  // into the docked edit panel as still "inside".
  const onFocus = useCallback(
    () => focusCanvasBlock(contentId),
    [contentId, focusCanvasBlock],
  );
  const onBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (
        !divRef.current?.contains(event.relatedTarget as Node) &&
        !isInsideEditPanel(event.relatedTarget)
      ) {
        blurCanvasBlock(contentId);
      }
    },
    [contentId, blurCanvasBlock],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && isFocused) {
        // The same snapshot the toolbar delete pushes (macro-top-bar.tsx)
        // -- both delete paths are equally destructive, so both get the
        // same undo (specs/plain-language-labels-and-move-undo.md).
        pushUndoSnapshot('Block deleted');
        onDelete({ contentId });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contentId, isFocused, onDelete, pushUndoSnapshot]);

  const className = c('mb-2 rounded', {
    'border-2': isFocused,
    'border-blue-700': isFocused,
    'p-2': isFocused,
    // Hover affordance (specs/editor-redesign.md, The user's journey →
    // Journey-driven additions): nothing else signals a block is
    // clickable until it's already been clicked. outline, not border, so
    // the hint never shifts layout.
    'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300':
      !isFocused,
  });

  return (
    // Not role="button": this div doesn't perform an action when
    // "activated" (no onClick/Enter/Space behavior of its own), it just
    // reveals contextual controls on focus -- a button role would promise
    // activation semantics that don't exist (WCAG 4.1.2). role="group" is
    // the accurate ARIA role for "a focusable container of controls", but
    // jsx-a11y's isInteractiveRole check only allows ARIA "widget" roles
    // with tabIndex, and "group" is a structural role, not a widget --
    // hence the disable below despite this being intentional and correct.
    //
    // No inline editor anymore: the focused block's form renders in the
    // canvas-side edit panel (specs/canvas-edit-panel.md), so opening it
    // never reflows the preview.
    <div
      className={className}
      role="group"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      ref={divRef}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {isFocused && <MacroTopBar contentId={contentId} />}
      {children}
    </div>
  );
}
