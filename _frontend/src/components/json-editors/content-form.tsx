import c from 'classnames';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import { EDITOR_MODES } from '@/constants';
import type { FieldSpec } from '@/types/field-spec';

import ListField from './list-field';
import RecordOfListsField from './record-of-lists-field';
import TagsField from './tags-field';
import { useStopKeydownPropagationRef } from './use-stop-keydown-propagation';

type ContentFormProps = {
  fields: FieldSpec[];
  value: Record<string, unknown>;
  onFieldChange: (name: string, value: string | string[]) => void;
  // Whole-value replacement, for the one field kind (record-of-lists)
  // whose keys are themselves user data rather than a fixed field name.
  onValueChange: (next: Record<string, unknown>) => void;
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
// a raw-JSON textarea for it. `text`/`textarea` landed in Phase 1
// (Header/Paragraph, then Contact), `tags`/`list` in Phase 4
// (Experience), and `record-of-lists` in Phase 5 (AnyList) -- all 5
// content types edit through generated forms now.
export default function ContentForm(props: ContentFormProps) {
  const { fields, value, onFieldChange, formId, isOpen, mode, fieldErrors } =
    props;
  const { onValueChange } = props;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldChange(event.target.name, event.target.value);
    },
    [onFieldChange],
  );

  // See use-stop-keydown-propagation.ts for why this must be a native
  // listener on the field itself, not a React onKeyDown prop.
  const stopKeydownPropagationRef = useStopKeydownPropagationRef();

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
        const error = fieldErrors[field.name] ?? '';
        const errorId = `${fieldId}-error`;

        let control;
        if (field.kind === 'record-of-lists') {
          control = (
            <RecordOfListsField
              fieldId={fieldId}
              label={field.label}
              value={value as Record<string, string[]>}
              isOpen={isOpen}
              mode={mode}
              error={error}
              errorId={errorId}
              onChange={onValueChange}
            />
          );
        } else if (field.kind === 'tags' || field.kind === 'list') {
          const arrayValue = (value[field.name] as string[] | undefined) ?? [];
          const ArrayField = field.kind === 'tags' ? TagsField : ListField;
          control = (
            <ArrayField
              fieldId={fieldId}
              name={field.name}
              label={field.label}
              value={arrayValue}
              isOpen={isOpen}
              mode={mode}
              error={error}
              errorId={errorId}
              onChange={(next) => onFieldChange(field.name, next)}
            />
          );
        } else {
          const fieldValue = (value[field.name] as string | undefined) ?? '';
          const sharedProps = {
            id: fieldId,
            name: field.name,
            value: fieldValue,
            onChange,
            ref: stopKeydownPropagationRef,
            spellCheck: 'false' as const,
            // Same rationale as the old textarea: Collapse only hides its
            // wrapper visually (height 0), so a still-focusable field
            // would remain in the tab order while collapsed.
            tabIndex: isOpen ? 0 : -1,
            'aria-invalid': !!error,
            'aria-describedby': error ? errorId : undefined,
          };
          // outline, not border: a border would change the field's box
          // size and nudge the rest of the form down a pixel each time an
          // error appears/clears.
          const errorOutlineClassName = c({
            'outline outline-2 outline-red-700': !!error,
          });

          control = (
            <>
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
            </>
          );
        }

        return (
          <div key={field.name} className="flex flex-col">
            {control}
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
