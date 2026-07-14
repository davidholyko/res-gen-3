import c from 'classnames';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EDITOR_MODES } from '@/constants';

type TagsFieldProps = {
  fieldId: string;
  name: string;
  label: string;
  value: string[];
  isOpen: boolean;
  mode: keyof typeof EDITOR_MODES;
  error: string;
  errorId: string;
  onChange: (next: string[]) => void;
};

// Chip/pill entry for a string[] (specs/editor-redesign.md, `tags` field
// kind): committed chips render as the same black pills the Experience
// macro itself draws (experience-macro.tsx) -- the input looks like what
// it produces. Type text, Enter or comma commits it, a chip's × removes
// it.
export default function TagsField(props: TagsFieldProps) {
  const { fieldId, name, label, value, isOpen, mode, error, errorId } = props;
  const { onChange } = props;

  // The not-yet-committed chip text -- deliberately local state, not part
  // of the content: it only becomes content when committed.
  const [pending, setPending] = useState('');

  const onPendingChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPending(event.target.value);
    },
    [],
  );

  // One native keydown listener does double duty: it stops propagation
  // (see use-stop-keydown-propagation.ts for why that must be native and
  // on the field itself) AND handles Enter/comma commits. The two can't
  // be split across a native listener + a React onKeyDown prop: stopping
  // propagation at the element keeps the event from ever reaching
  // React's root-delegated dispatch, so a React onKeyDown here would
  // simply never fire. Routed through a ref so the mounted-once listener
  // always sees the current pending/value instead of its mount-time
  // closure.
  // The noop initializer can never run: the effect below replaces it
  // post-mount, before any user keydown can possibly be delivered.
  /* v8 ignore next */
  const keydownRef = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keydownRef.current = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key !== 'Enter' && event.key !== ',') return;

      // Enter would otherwise submit the surrounding <form>; a literal
      // comma would end up inside the next chip's text.
      event.preventDefault();
      const tag = pending.trim();
      if (!tag) return;

      onChange([...value, tag]);
      setPending('');
    };
  }, [pending, value, onChange]);

  const inputRef = useCallback((element: HTMLInputElement | null) => {
    // Same React 19 ref-callback-with-cleanup contract as
    // use-stop-keydown-propagation.ts: null is unreachable in practice.
    /* v8 ignore next */
    if (!element) return;

    const listener = (event: KeyboardEvent) => keydownRef.current(event);
    element.addEventListener('keydown', listener);
    return () => {
      element.removeEventListener('keydown', listener);
    };
  }, []);

  const onRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  // Mirrors ContentForm's text-field chrome: the chip container is the
  // visual "input box", so it carries the mode background/width, while
  // the inner input stays transparent inside it.
  const containerClassName = c(
    'flex flex-row flex-wrap items-center gap-1 p-2',
    {
      'w-auto': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'w-[60ch]': mode !== EDITOR_MODES.IN_LAYOUT_MANAGER,
      'bg-emerald-100': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'bg-sky-100': mode === EDITOR_MODES.IN_EDITOR_MANAGER,
      'outline outline-2 outline-red-700': !!error,
    },
  );

  return (
    <>
      <label className="text-xs font-bold text-gray-600" htmlFor={fieldId}>
        {label}
      </label>
      <div className={containerClassName}>
        {value.map((tag, index) => (
          <span
            // Not a stable identity, but chips are never edited in place
            // (only appended/removed), so an index key can't misassociate
            // any state.
            key={`${tag}-${index}`}
            className="bg-black text-white font-bold py-1 px-1 rounded text-xs"
          >
            {tag}
            <button
              type="button"
              className="ml-1 px-1 rounded hover:bg-gray-700"
              aria-label={`Remove ${label} ${tag}`}
              title={`Remove ${tag}`}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => onRemove(index)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          id={fieldId}
          name={name}
          className="grow min-w-[12ch] bg-transparent p-1"
          placeholder="Type a tag, press Enter"
          spellCheck="false"
          value={pending}
          onChange={onPendingChange}
          ref={inputRef}
          tabIndex={isOpen ? 0 : -1}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
    </>
  );
}
