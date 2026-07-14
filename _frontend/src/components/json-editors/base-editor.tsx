import c from 'classnames';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Collapse } from 'react-collapse';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { ZodError, ZodObject, ZodRecord } from 'zod';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';
import { ContentId } from '@/types/content-base-item';
import type { DropResult } from '@/types/drop-result';
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
  mode?: keyof typeof EDITOR_MODES;
  // Drives the generated <ContentForm>. Required since Phase 5 of
  // specs/editor-redesign.md: every content type has a field spec, and
  // the raw-JSON textarea path this used to fall back to is gone (the
  // spec's "raw-JSON fallback: removed, not kept" decision).
  fields: FieldSpec[];
};

const DEFAULT_CONTENT_ID = '' as ContentId;

export default function BaseEditor(props: BaseEditorProps) {
  const {
    contentType,
    content,
    macro,
    schema,
    fields,
    mode = EDITOR_MODES.IN_EDITOR_MANAGER,
  } = props;

  const { onCreate, onUpdate } = useAppContext();
  const [formValue, setFormValue] = useState<Record<string, unknown>>(
    // Every editor defaults its own `content` prop (e.g. HeaderEditor's
    // `content = EXAMPLE_HEADER`), so `content` is never actually
    // undefined here in practice -- kept as a defensive fallback for
    // BaseEditor as a generically reusable component, not because it's
    // reachable today.
    /* v8 ignore next */
    () => (content as Record<string, unknown>) ?? {},
  );
  // Everything downstream of the form (EditorTopBar's add button, the
  // drag payload) still reads a single JSON string, exactly as the old
  // textarea path produced.
  const text = JSON.stringify(formValue, null, 2);
  const [isOpen, setIsOpen] = useState(mode === EDITOR_MODES.IN_LAYOUT_MANAGER);
  // Per-field errors keyed by field name (specs/editor-redesign.md,
  // Validation UX) -- each renders inline under its own field inside
  // ContentForm; there is no whole-block error banner anymore.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const [contentId, setContentId] = useState<ContentId>(
    props.contentId || DEFAULT_CONTENT_ID,
  );
  const formId = useId();

  const [{ isDragging }, ref] = useDrag({
    type: contentType,
    item: { contentType, contentId },
    canDrag: !hasFieldErrors && mode === EDITOR_MODES.IN_EDITOR_MANAGER,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();

      if (dropResult) {
        onCreate({
          contentId,
          content: { ...JSON.parse(text) },
          contentType: item.contentType,
          layoutId: dropResult.layoutId,
          layoutType: dropResult.layoutType,
          layoutParentId: dropResult.layoutParentId || undefined,
        });
      }
    },
  });

  useEffect(() => {
    const contentId = uuidv4() as ContentId;
    // Regenerating contentId here (not in a change handler) is
    // deliberate: this also needs to fire on `mode` changes, not just
    // `text` changes. Preserved as-is during the res-gen-2 port; revisit
    // once PR 2's tests can verify a render-time-derivation refactor is
    // safe.
    if (mode === EDITOR_MODES.IN_EDITOR_MANAGER) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContentId(contentId);
    }
  }, [text, mode]);

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
      const isValid = validateContent(next);

      // IN_EDITOR_MANAGER's ribbon/template forms aren't persisted until
      // dragged/added (a new item is created from whatever the form
      // currently holds); IN_LAYOUT_MANAGER's focused-block form saves
      // live as you type, since there's no single "blur" event across
      // multiple fields to hang a save on.
      if (isValid && mode === EDITOR_MODES.IN_LAYOUT_MANAGER) {
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
    [validateContent, mode, contentId, onUpdate, props],
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

  const containerClassName = useMemo(() => {
    const className = c(props.className, {
      'cursor-text': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'opacity-50': isDragging,
      'p-1': true,
      // Anchors the floating panel below (see collapseWrapperClassName)
      // to this specific ribbon item, not the whole ribbon row
      // (specs/ribbon-layout.md).
      relative: mode === EDITOR_MODES.IN_EDITOR_MANAGER,
    });

    return className;
  }, [isDragging, mode, props.className]);

  const collapseWrapperClassName = useMemo(() => {
    // Only in IN_EDITOR_MANAGER mode (the ribbon) -- IN_LAYOUT_MANAGER's
    // inline editor (a focused block's own form) stays in normal flow,
    // unrelated to this ribbon redesign (specs/ribbon-layout.md).
    return c({
      'absolute top-full left-0 z-20 shadow-lg rounded':
        mode === EDITOR_MODES.IN_EDITOR_MANAGER,
    });
  }, [mode]);

  return (
    <div className={containerClassName}>
      <EditorTopBar
        formId={formId}
        mode={mode}
        macro={macro}
        hasFieldErrors={hasFieldErrors}
        text={text}
        contentType={contentType}
        contentId={contentId}
        // react-dnd's ConnectDragSource return type predates React 19's
        // stricter ref-callback typing (must return void, not ReactElement).
        // No behavior change, just satisfying the type.
        ref={(node) => {
          ref(node);
        }}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      {/*
        react-collapse's Collapse doesn't forward arbitrary props (like
        `id`) to its rendered div despite its types claiming to extend
        React.HTMLProps -- the id EditorTopBar's aria-controls needs has
        to live on the form inside instead. The outer div here (not
        Collapse itself) carries the floating-panel positioning for the
        same reason -- safer than relying on prop forwarding that's
        already known to be unreliable on this component.
      */}
      <div className={collapseWrapperClassName}>
        <Collapse isOpened={isOpen}>
          <ContentForm
            fields={fields}
            value={formValue}
            onFieldChange={onFieldChange}
            onValueChange={commitFormValue}
            formId={formId}
            isOpen={isOpen}
            mode={mode}
            fieldErrors={fieldErrors}
          />
        </Collapse>
      </div>
    </div>
  );
}
