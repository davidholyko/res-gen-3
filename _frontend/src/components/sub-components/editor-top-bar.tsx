import c from 'classnames';
import { forwardRef, Ref, useCallback, useMemo } from 'react';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import { ContentId } from '@/types/content-base-item';

import CollapseIcon from '../icons/collapse-icon';
import DragHandleIcon from '../icons/drag-handle-icon';
import PlusIcon from '../icons/plus-icon';
import UncollapseIcon from '../icons/uncollapse-icon';

type EditorTopBarProps = {
  contentId: ContentId;
  contentType: keyof typeof CONTENT_TYPES;
  errorMessage: string;
  formId: string;
  isOpen: boolean;
  macro: string;
  mode: keyof typeof EDITOR_MODES;
  text: string;
  setIsOpen: (value: boolean) => void;
};

export const EditorTopBar = forwardRef<HTMLDivElement, EditorTopBarProps>(
  (props: EditorTopBarProps, ref: Ref<HTMLDivElement>) => {
    const { onCreate, layouts } = useAppContext();
    const {
      macro,
      errorMessage,
      text,
      formId,
      contentType,
      contentId,
      isOpen,
      setIsOpen,
      mode,
    } = props;

    const isInEditor = useMemo(
      () => mode === EDITOR_MODES.IN_EDITOR_MANAGER,
      [mode],
    );

    const onAdd = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        const [layout] = layouts.slice(-1);

        onCreate({
          contentId,
          content: { ...JSON.parse(text) },
          contentType,
          layoutId: layout.layoutId,
          layoutType: layout.layoutType,
          // TODO: this could be a bug
          // because if we click "+" button when last is a double layout
          // it does have a parent
          layoutParentId: undefined,
        });
      },
      [contentType, layouts, contentId, text, onCreate],
    );

    const onClickTopBar = useCallback(() => {
      if (isInEditor) {
        setIsOpen(!isOpen);
      }
    }, [setIsOpen, isOpen, isInEditor]);

    const onKeyDownTopBar = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Enter' || event.key === ' ') && isInEditor) {
          event.preventDefault();
          setIsOpen(!isOpen);
        }
      },
      [setIsOpen, isOpen, isInEditor],
    );

    const editorDragContainerClassName = useMemo(() => {
      return c('flex bg-gray-600 rounded text-white justify-between p-2', {
        'cursor-grab': !errorMessage && isInEditor,
        'opacity-50': !!errorMessage,
      });
    }, [errorMessage, isInEditor]);

    const labelClassName = useMemo(() => {
      return c('grow p-1 font-bold', {
        'cursor-grab': !errorMessage && isInEditor,
      });
    }, [errorMessage, isInEditor]);

    return (
      <>
        <div
          className={editorDragContainerClassName}
          draggable="true"
          role="button"
          tabIndex={0}
          onClick={onClickTopBar}
          onKeyDown={onKeyDownTopBar}
          ref={ref} //
        >
          {isInEditor && <DragHandleIcon className="m-1 p-1" />}
          <label
            className={labelClassName}
            htmlFor={`editor-textarea-${formId}`}
          >
            {macro} {!isInEditor && '(Edit Mode)'}
          </label>

          {isInEditor && (
            <>
              <button
                className="mx-4 p-1 bg-green-300 hover:bg-green-500 rounded"
                aria-label="Add Macro Button"
                type="button"
                onClick={onAdd}
                disabled={!!errorMessage}
              >
                <PlusIcon />
              </button>
              <button
                aria-label="Toggle Editor Visibility Button"
                type="button"
              >
                {isOpen ? <CollapseIcon /> : <UncollapseIcon />}
              </button>
            </>
          )}
        </div>
        {errorMessage && (
          <p className="text-white bg-red-400 rounded p-2">
            <span className="border-black border-2 rounded bg-white p-1 m-1">
              ❗
            </span>
            {errorMessage}
          </p>
        )}
      </>
    );
  },
);

EditorTopBar.displayName = 'EditorTopBar';
