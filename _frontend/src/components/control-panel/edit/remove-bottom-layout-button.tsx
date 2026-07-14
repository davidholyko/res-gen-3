import c from 'classnames';
import { useCallback } from 'react';

import { useAppContext } from '@/context/app-context';

type RemoveBottomLayoutButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function RemoveBottomLayoutButton({
  className,
  role,
  tabIndex,
}: RemoveBottomLayoutButtonProps) {
  const { popLayout, isEditorVisible, pushUndoSnapshot } = useAppContext();

  // Undo, not window.confirm -- see specs/undo-destructive-actions.md.
  const handleClick = useCallback(() => {
    pushUndoSnapshot('Last layout removed');
    popLayout();
  }, [popLayout, pushUndoSnapshot]);

  if (isEditorVisible) {
    return null;
  }

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      onClick={handleClick}
      role={role}
      tabIndex={tabIndex}
    >
      Remove Last Layout
    </button>
  );
}
