import c from 'classnames';
import { useCallback, useId, useState } from 'react';
import { ZodError, ZodObject, ZodRecord } from 'zod';

import { CONTENT_TYPES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';
import type { FieldSpec } from '@/types/field-spec';

import { EditorTopBar } from '../sub-components/editor-top-bar';
import ContentForm from './content-form';

type BaseEditorProps = Partial<ContentAll> & {
  macro: string;
  className: string;
  // zod v4's ZodRecord defaults its key/value type params to "any valid
  // record schema" already, so no explicit (and unsafe) `any` is needed.
  schema: ZodObject<NonNullable<unknown>> | ZodRecord;
  contentType: keyof typeof CONTENT_TYPES;
  // Drives the generated <ContentForm> -- the only editing surface since
  // specs/editor-redesign.md retired the raw-JSON textarea (Phase 5) and
  // the Template ribbon (Phase 6). This editor now exists solely as a
  // focused block's inline form.
  fields: FieldSpec[];
};

export default function BaseEditor(props: BaseEditorProps) {
  const { content, macro, schema, fields, contentId } = props;

  const { onUpdate } = useAppContext();
  const [formValue, setFormValue] = useState<Record<string, unknown>>(
    // Every placed block carries content (blank blocks start from
    // BLANK_CONTENT) -- kept as a defensive fallback for BaseEditor as a
    // generically reusable component, not because it's reachable today.
    /* v8 ignore next */
    () => (content as Record<string, unknown>) ?? {},
  );
  // Per-field errors keyed by field name (specs/editor-redesign.md,
  // Validation UX) -- each renders inline under its own field inside
  // ContentForm; there is no whole-block error banner.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formId = useId();

  const validateContent = useCallback(
    (contentToValidate: unknown) => {
      try {
        schema.parse(contentToValidate);
        setFieldErrors({});
        return true;
      } catch (error) {
        // schema.parse only ever throws ZodError, and the form always
        // hands it a structured object, so every issue's path names the
        // offending field -- surfaced under that field alone instead of
        // one opaque message for the whole block (specs/editor-redesign.md,
        // Validation UX).
        const { issues, message } = error as ZodError;
        const nextFieldErrors: Record<string, string> = {};
        for (const issue of issues) {
          nextFieldErrors[String(issue.path[0])] = issue.message;
        }
        console.error(message);
        setFieldErrors(nextFieldErrors);
        return false;
      }
    },
    [schema],
  );

  const commitFormValue = useCallback(
    (next: Record<string, unknown>) => {
      setFormValue(next);

      // Saves live as you type -- there's no single "blur" event across
      // multiple fields to hang a save on. Invalid states stay local to
      // the form (flagged per field) and are never persisted.
      if (validateContent(next)) {
        onUpdate({
          contentId,
          content: next,
          contentType: props.contentType,
          layoutId: props.layoutId,
          layoutType: props.layoutType,
          layoutParentId: props.layoutParentId || undefined,
          // BaseEditor is generic over every content type and can't
          // itself prove `next`'s shape correlates with whichever
          // `contentType` this instance actually is.
        } as ContentAll);
      }
    },
    [validateContent, contentId, onUpdate, props],
  );

  const onFieldChange = useCallback(
    // `unknown`, not `string`: tags/list field kinds hand back a whole
    // string[] -- this only ever places the value into the content
    // object; the zod schema is what vouches for its shape.
    (name: string, value: unknown) => {
      commitFormValue({ ...formValue, [name]: value });
    },
    [formValue, commitFormValue],
  );

  return (
    <div className={c(props.className, 'cursor-text p-1')}>
      <EditorTopBar formId={formId} macro={macro} />
      <ContentForm
        fields={fields}
        value={formValue}
        onFieldChange={onFieldChange}
        onValueChange={commitFormValue}
        formId={formId}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
