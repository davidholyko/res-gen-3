import c from 'classnames';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import { EDITOR_MODES } from '@/constants';

import { useStopKeydownPropagationRef } from './use-stop-keydown-propagation';

type ListFieldProps = {
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

// Repeating single-line rows for a string[] (specs/editor-redesign.md,
// `list` field kind): each row edits one entry, with per-row remove and
// reorder-by-button controls plus an append control at the end
// (Experience's `descriptions`, the macro's bulleted list).
export default function ListField(props: ListFieldProps) {
  const { fieldId, name, label, value, isOpen, mode, error, errorId } = props;
  const { onChange } = props;

  const stopKeydownPropagationRef = useStopKeydownPropagationRef();

  const onRowChange = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      onChange(
        value.map((entry, i) => (i === index ? event.target.value : entry)),
      );
    },
    [value, onChange],
  );

  const onAdd = useCallback(() => {
    onChange([...value, '']);
  }, [value, onChange]);

  const onRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  const onMove = useCallback(
    (index: number, delta: -1 | 1) => {
      const next = [...value];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      onChange(next);
    },
    [value, onChange],
  );

  const rowInputClassName = c('grow p-2', {
    'bg-emerald-100': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
    'bg-sky-100': mode === EDITOR_MODES.IN_EDITOR_MANAGER,
    'outline outline-2 outline-red-700': !!error,
  });

  const rowButtonClassName =
    'px-2 py-1 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-40';

  const containerClassName = c('flex flex-col gap-1', {
    'w-auto': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
    'w-[60ch]': mode !== EDITOR_MODES.IN_LAYOUT_MANAGER,
  });

  return (
    // fieldset/legend, not a <label>: a label must point at a single form
    // control, but this group is N inputs -- each row gets its own
    // aria-label instead.
    <fieldset>
      <legend className="text-xs font-bold text-gray-600">{label}</legend>
      <div className={containerClassName}>
        {value.map((entry, index) => (
          // Index keys are safe here: rows carry no local state (the
          // input value comes straight from props), so a removed row
          // can't leak state into its successor.
          <div key={index} className="flex flex-row items-center gap-1">
            <input
              type="text"
              id={index === 0 ? fieldId : `${fieldId}-${index}`}
              name={`${name}-${index}`}
              className={rowInputClassName}
              spellCheck="false"
              aria-label={`${label} ${index + 1}`}
              value={entry}
              onChange={(event) => onRowChange(index, event)}
              ref={stopKeydownPropagationRef}
              tabIndex={isOpen ? 0 : -1}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <button
              type="button"
              className={rowButtonClassName}
              aria-label={`Move ${label} ${index + 1} up`}
              title="Move up"
              tabIndex={isOpen ? 0 : -1}
              disabled={index === 0}
              onClick={() => onMove(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className={rowButtonClassName}
              aria-label={`Move ${label} ${index + 1} down`}
              title="Move down"
              tabIndex={isOpen ? 0 : -1}
              disabled={index === value.length - 1}
              onClick={() => onMove(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className={rowButtonClassName}
              aria-label={`Remove ${label} ${index + 1}`}
              title="Remove"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => onRemove(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="self-start px-2 py-1 rounded text-sm text-gray-700 hover:bg-gray-200"
          aria-label={`Add ${label} entry`}
          tabIndex={isOpen ? 0 : -1}
          onClick={onAdd}
        >
          + Add entry
        </button>
      </div>
    </fieldset>
  );
}
