import c from 'classnames';
import { forwardRef, type Ref, useCallback, useMemo } from 'react';

import { MOVE_ACTION, useAppContext } from '@/context/app-context';
import { ContentId } from '@/types/content-base-item';

import ArrowDownIcon from '../icons/arrow-down-icon';
import ArrowUpIcon from '../icons/arrow-up-icon';
import DeleteIcon from '../icons/delete-icon';
import MoveToControl from './move-to-control';

type MacroTopBarProps = {
  contentId: ContentId;
};

// forwardRef requires a render function with exactly two parameters
// structurally (React warns at runtime if the second is omitted), even
// though no caller currently passes a ref. Preserved as-is from the
// res-gen-2 port.
export const MacroTopBar = forwardRef<HTMLDivElement, MacroTopBarProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (props: MacroTopBarProps, _ref: Ref<HTMLDivElement>) => {
    const { onMove, onDelete, pushUndoSnapshot, openEditingView } =
      useAppContext();
    const { contentId } = props;

    const editorDragContainerClassName = useMemo(() => {
      return c('flex bg-gray-600 rounded text-white p-2');
    }, []);

    const onMoveUp = useCallback(
      () => onMove(MOVE_ACTION.MACRO_UP, contentId),
      [contentId, onMove],
    );

    const onMoveDown = useCallback(
      () => onMove(MOVE_ACTION.MACRO_DOWN, contentId),
      [contentId, onMove],
    );

    // Undo, not window.confirm: a confirm dialog stops an accidental
    // click but is a dead end if you actually meant to delete something
    // else -- pushing an undo snapshot first lets the toast's Undo
    // button fully restore this block (specs/undo-destructive-actions.md).
    const onDestroy = useCallback(() => {
      pushUndoSnapshot('Block deleted');
      onDelete({ contentId });
    }, [contentId, onDelete, pushUndoSnapshot]);

    return (
      <div className={editorDragContainerClassName} draggable="true">
        <button
          aria-label="Move block up"
          title="Move up"
          type="button"
          onClick={onMoveUp}
        >
          <ArrowUpIcon className="m-1 p-1" />
        </button>
        <button
          aria-label="Move block down"
          title="Move down"
          type="button"
          onClick={onMoveDown}
        >
          <ArrowDownIcon className="m-1 p-1" />
        </button>
        <MoveToControl contentId={contentId} />
        <button
          // The way into the docked-form-beside-live-preview editing
          // view (specs/edit-with-live-pdf-preview.md); the inline form
          // below stays the quick-fix path.
          className="ml-auto mr-3 px-2 text-sm underline-offset-2 hover:underline"
          type="button"
          onClick={() => openEditingView(contentId)}
        >
          Edit with preview
        </button>
        <button
          className="p-1 bg-red-400 hover:bg-red-500 rounded"
          aria-label="Delete block"
          title="Delete this block"
          type="button"
          onClick={onDestroy}
        >
          <DeleteIcon />
        </button>
      </div>
    );
  },
);

MacroTopBar.displayName = 'MacroTopBar';
