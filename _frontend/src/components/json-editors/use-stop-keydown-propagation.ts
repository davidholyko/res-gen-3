import { useCallback } from 'react';

// A React onKeyDown prop (synthetic stopPropagation) does NOT protect a
// form field against BaseMacro's Backspace/Delete-deletes-the-block
// listener (base-macro.tsx): that listener is a native
// `document.addEventListener`, a peer of wherever React's own delegated
// dispatch lives, not a descendant of it -- stopPropagation only blocks
// the event from reaching *further* nodes, not other listeners already
// registered on the same node. Confirmed live during Phase 1: a
// synthetic onKeyDown still let Backspace delete the whole placed block
// while editing its field. The fix, shared here by every generated form
// field: a real `addEventListener('keydown', ...)` directly on the field
// itself, which fires -- and can stop propagation -- before the event
// ever reaches document at all, regardless of how many other listeners
// are sitting there.
export function useStopKeydownPropagationRef() {
  return useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      // React 19's ref-callback-with-cleanup contract calls this with the
      // element on mount and runs the returned cleanup on unmount -- it
      // doesn't call this again with `null` the way the pre-19 ref
      // pattern did. `null` is only reachable here if some future caller
      // passes this ref where that guarantee doesn't hold.
      /* v8 ignore next */
      if (!element) return;

      // `element` is a union of two DOM element types, which defeats
      // addEventListener's usual per-event-name overload resolution --
      // Event is all stopPropagation needs anyway.
      const handleKeyDown = (event: Event) => {
        event.stopPropagation();
      };

      element.addEventListener('keydown', handleKeyDown);
      return () => {
        element.removeEventListener('keydown', handleKeyDown);
      };
    },
    [],
  );
}
