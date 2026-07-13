import c from 'classnames';
import {
  FocusEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';

import EditorItem from '../content/editor-item';
import { MacroTopBar } from '../sub-components/macro-top-bar';

type BaseMacroProps = ContentAll & {
  children: ReactNode;
};

export default function BaseMacro(props: BaseMacroProps) {
  const { children, contentId } = props;

  const { onDelete } = useAppContext();

  const [isFocused, setIsFocused] = useState(false);

  const divRef = useRef<HTMLDivElement>(null);

  // Function to handle clicks outside of the div
  const handleClick = useCallback((event: MouseEvent) => {
    // The document click listener is only attached (see the effect below)
    // once this component -- and therefore divRef.current -- has mounted,
    // so this guard can't actually be false.
    /* v8 ignore next */
    if (!divRef.current) return;

    if (divRef.current?.contains(event.target as Node)) {
      setIsFocused(true);
    }

    if (!divRef.current?.contains(event.target as Node)) {
      setIsFocused(false);
    }
  }, []);

  // Attach the click event listener when the component mounts
  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => {
      // Clean up the event listener when the component unmounts
      document.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

  // The click listener above only reveals this macro's controls for mouse
  // users (a keyboard user tabbing onto the div never dispatches a click,
  // so isFocused would never flip and the delete/reorder/edit controls
  // would stay permanently unreachable without a mouse -- WCAG 2.1.1).
  // These focus/blur handlers give keyboard users the same reveal, while
  // treating focus moving to a child (e.g. into the revealed top bar or
  // inline editor) as still "inside".
  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (!divRef.current?.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // event.stopImmediatePropagation();
      // event.stopPropagation();

      if ((event.key === 'Backspace' || event.key === 'Delete') && isFocused) {
        onDelete({ contentId });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contentId, isFocused, onDelete]);

  const className = c({
    'mb-2': true,
    'border-2': isFocused,
    rounded: isFocused,
    'border-blue-700': isFocused,
    'p-2': isFocused,
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
      {isFocused && (
        <EditorItem {...props} mode={EDITOR_MODES.IN_LAYOUT_MANAGER} />
      )}
    </div>
  );
}
