import c from 'classnames';
import { forwardRef, type Ref, useCallback, useMemo } from 'react';

import { MOVE_ACTION, useAppContext } from '@/context/app-context';
import { ContentId } from '@/types/content-base-item';

import ArrowDownIcon from '../icons/arrow-down-icon';
import ArrowUpIcon from '../icons/arrow-up-icon';
import DeleteIcon from '../icons/delete-icon';

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
    const { onMove, onDelete } = useAppContext();
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

    const onDestroy = useCallback(() => {
      onDelete({ contentId });
    }, [contentId, onDelete]);

    return (
      <div className={editorDragContainerClassName} draggable="true">
        <button
          aria-label="Move Macro Up Button"
          type="button"
          onClick={onMoveUp}
        >
          <ArrowUpIcon className="m-1 p-1" />
        </button>
        <button
          aria-label="Move Macro Down Button"
          type="button"
          onClick={onMoveDown}
        >
          <ArrowDownIcon className="m-1 p-1" />
        </button>
        <button
          className="ml-auto p-1 bg-red-400 hover:bg-red-500 rounded"
          aria-label="Delete Macro Button"
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
