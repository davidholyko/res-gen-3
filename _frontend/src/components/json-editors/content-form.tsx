import c from 'classnames';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import { EDITOR_MODES } from '@/constants';
import type { FieldSpec } from '@/types/field-spec';

type ContentFormProps = {
  fields: FieldSpec[];
  value: Record<string, unknown>;
  onFieldChange: (name: string, value: string) => void;
  formId: string;
  isOpen: boolean;
  mode: keyof typeof EDITOR_MODES;
  // Validation problems keyed by field name (specs/editor-redesign.md,
  // Validation UX): each one renders as an inline message under just the
  // offending field, not a single banner for the whole block.
  fieldErrors: Record<string, string>;
};

// The generic form renderer for specs/editor-redesign.md: each content
// type supplies a declarative field spec instead of BaseEditor rendering
// a raw-JSON textarea for it. Only `text`/`textarea` kinds exist so far
// (Phases 1/3, proven against Header/Paragraph/Contact); `tags`/`list`/
// `record-of-lists` land as later phases migrate Experience/AnyList off
// the JSON editor.
export default function ContentForm(props: ContentFormProps) {
  const { fields, value, onFieldChange, formId, isOpen, mode, fieldErrors } =
    props;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldChange(event.target.name, event.target.value);
    },
    [onFieldChange],
  );

  // A React onKeyDown prop (synthetic stopPropagation) does NOT protect
  // against this: BaseMacro's Backspace/Delete-deletes-the-block listener
  // (base-macro.tsx) is a native `document.addEventListener`, a peer of
  // wherever React's own delegated dispatch lives, not a descendant of
  // it -- stopPropagation only blocks the event from reaching *further*
  // nodes, not other listeners already registered on the same node.
  // Confirmed live: a synthetic onKeyDown here still let Backspace delete
  // the whole placed block while editing its field. The old raw-JSON
  // textarea (base-editor.tsx) sidesteps this the same way: a real
  // `addEventListener('keydown', ...)` directly on the field itself,
  // which fires -- and can stop propagation -- before the event ever
  // reaches document at all, regardless of how many other listeners are
  // sitting there.
  const stopPropagationRef = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      // React 19's ref-callback-with-cleanup contract calls this with the
      // element on mount and runs the returned cleanup on unmount -- it
      // doesn't call this again with `null` the way the pre-19 ref
      // pattern did. `null` is only reachable here if some future caller
      // passes this ref where that guarantee doesn't hold.
      /* v8 ignore next */
      if (!element) return;

      // `element` is a union of two DOM element types, which defeats
      // addEventListener's usual per-event-name overload resolution
      // (works fine against a single concrete element type, as in
      // base-editor.tsx's equivalent listener) -- Event is all
      // stopPropagation needs anyway.
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

  const fieldClassName = c('p-2', {
    'w-auto': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
    'w-[60ch]': mode !== EDITOR_MODES.IN_LAYOUT_MANAGER,
    'bg-emerald-100': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
    'bg-sky-100': mode === EDITOR_MODES.IN_EDITOR_MANAGER,
  });

  return (
    <form id={`editor-collapse-${formId}`} className="flex flex-col gap-2 p-2">
      {fields.map((field, index) => {
        // The first field reuses the id the old raw-JSON textarea had
        // (`editor-textarea-${formId}`) -- EditorTopBar's macro-name
        // <label> and its htmlFor wiring already point at that id and
        // are untouched by this change. Every field here already has its
        // own explicit label regardless.
        const fieldId =
          index === 0
            ? `editor-textarea-${formId}`
            : `editor-field-${formId}-${field.name}`;
        const fieldValue = (value[field.name] as string | undefined) ?? '';
        const error = fieldErrors[field.name] ?? '';
        const errorId = `${fieldId}-error`;
        const sharedProps = {
          id: fieldId,
          name: field.name,
          value: fieldValue,
          onChange,
          ref: stopPropagationRef,
          spellCheck: 'false' as const,
          // Same rationale as the old textarea: Collapse only hides its
          // wrapper visually (height 0), so a still-focusable field would
          // remain in the tab order while collapsed.
          tabIndex: isOpen ? 0 : -1,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : undefined,
        };
        // outline, not border: a border would change the field's box size
        // and nudge the rest of the form down a pixel each time an error
        // appears/clears.
        const errorOutlineClassName = c({
          'outline outline-2 outline-red-700': !!error,
        });

        return (
          <div key={field.name} className="flex flex-col">
            <label
              className="text-xs font-bold text-gray-600"
              htmlFor={fieldId}
            >
              {field.label}
            </label>
            {field.kind === 'textarea' ? (
              <textarea
                className={c(
                  fieldClassName,
                  errorOutlineClassName,
                  'h-[9ch] font-mono resize-none',
                )}
                {...sharedProps}
              />
            ) : (
              <input
                type="text"
                className={c(fieldClassName, errorOutlineClassName)}
                {...sharedProps}
              />
            )}
            {error && (
              // text-red-700, matching layout-header.tsx's precedent for
              // red text that must clear 4.5:1 on this page's light
              // backgrounds.
              <p
                id={errorId}
                role="alert"
                className="text-xs font-bold text-red-700 mt-1"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
    </form>
  );
}
