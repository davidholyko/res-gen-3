import c from 'classnames';
import type { ChangeEvent } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Collapse } from 'react-collapse';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { ZodObject, ZodRecord } from 'zod';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';
import { ContentId } from '@/types/content-base-item';
import type { DropResult } from '@/types/drop-result';

import { EditorTopBar } from '../sub-components/editor-top-bar';

type BaseEditorProps = Partial<ContentAll> & {
  macro: string;
  className: string;
  // zod v4's ZodRecord defaults its key/value type params to "any valid
  // record schema" already, so no explicit (and unsafe) `any` is needed.
  schema: ZodObject<NonNullable<unknown>> | ZodRecord;
  contentType: keyof typeof CONTENT_TYPES;
  mode?: keyof typeof EDITOR_MODES;
};

const DEFAULT_CONTENT_ID = '' as ContentId;

export default function BaseEditor(props: BaseEditorProps) {
  const {
    contentType,
    content,
    macro,
    schema,
    mode = EDITOR_MODES.IN_EDITOR_MANAGER,
  } = props;

  const { onCreate, onUpdate } = useAppContext();
  const [text, setText] = useState(JSON.stringify(content, null, 2));
  const [isOpen, setIsOpen] = useState(mode === EDITOR_MODES.IN_LAYOUT_MANAGER);
  const [errorMessage, setErrorMessage] = useState('');
  const [contentId, setContentId] = useState<ContentId>(
    props.contentId || DEFAULT_CONTENT_ID,
  );
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const formId = useId();

  const [{ isDragging }, ref] = useDrag({
    type: contentType,
    item: { contentType, contentId },
    canDrag: !errorMessage && mode === EDITOR_MODES.IN_EDITOR_MANAGER,
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

  const adjustTextareaHeight = () => {
    // Only ever called from the effect below, which runs post-mount, so
    // textAreaRef.current is always set by the time this executes.
    /* v8 ignore next */
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
    const contentId = uuidv4() as ContentId;
    // Regenerating contentId here (not in onChange) is deliberate: this
    // also needs to fire on `mode` changes, not just `text` changes.
    // Preserved as-is during the res-gen-2 port; revisit once PR 2's
    // tests can verify a render-time-derivation refactor is safe.
    if (mode === EDITOR_MODES.IN_EDITOR_MANAGER) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContentId(contentId);
    }
  }, [text, mode]);

  const validateJsonSchema = useCallback(
    (jsonString: string) => {
      try {
        const jsonData = JSON.parse(jsonString);
        schema.parse(jsonData);
        setErrorMessage('');
        return true;
      } catch (error) {
        const e = error as Error;
        console.error(e.message);
        setErrorMessage(e.message);
        return false;
      }
    },
    [schema],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      // prevent backspace from bubbling up to remove the macro
      event.stopPropagation();

      const jsonValue = event.target.value;
      setText(jsonValue);
      validateJsonSchema(jsonValue);
    },
    [validateJsonSchema],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // prevent Delete or Backspace key from deleting the ContentItem
      // in WYSIWYG editor when editting textarea element text
      event.stopPropagation();
    };

    const element = textAreaRef.current;

    element?.addEventListener('keydown', handleKeyDown);

    return () => {
      element?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onBlur = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (mode === EDITOR_MODES.IN_EDITOR_MANAGER) {
        return;
      }

      if (validateJsonSchema(event.target.value)) {
        onUpdate({
          contentId,
          content: { ...JSON.parse(text) },
          contentType: props.contentType,
          layoutId: props.layoutId,
          layoutType: props.layoutType,
          layoutParentId: props.layoutParentId || undefined,
        });
      }
    },
    [contentId, mode, onUpdate, props, text, validateJsonSchema],
  );

  const textAreaClassName = useMemo(() => {
    const defaultClassName = c('h-[9ch]', 'p-2', 'font-mono', 'resize-none');
    const overrideClassName = c('grow', {
      'w-auto': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'w-[60ch]': mode !== EDITOR_MODES.IN_LAYOUT_MANAGER,
      'bg-emerald-100': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'bg-sky-100': mode === EDITOR_MODES.IN_EDITOR_MANAGER,
    });

    return c(defaultClassName, overrideClassName);
  }, [mode]);

  const containerClassName = useMemo(() => {
    const className = c(props.className, {
      'cursor-text': mode === EDITOR_MODES.IN_LAYOUT_MANAGER,
      'opacity-50': isDragging,
      'p-1': true,
    });

    return className;
  }, [isDragging, mode, props.className]);

  return (
    <div className={containerClassName}>
      <EditorTopBar
        formId={formId}
        mode={mode}
        macro={macro}
        errorMessage={errorMessage}
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
        to live on the form inside instead.
      */}
      <Collapse isOpened={isOpen}>
        <form id={`editor-collapse-${formId}`} className="flex">
          <textarea
            id={`editor-textarea-${formId}`}
            className={textAreaClassName}
            name={contentType}
            spellCheck="false"
            onBlur={onBlur}
            onChange={onChange}
            value={text}
            ref={textAreaRef}
            tabIndex={0}
            aria-invalid={!!errorMessage}
            aria-describedby={
              errorMessage ? `error-message-${formId}` : undefined
            }
          />
        </form>
      </Collapse>
    </div>
  );
}
