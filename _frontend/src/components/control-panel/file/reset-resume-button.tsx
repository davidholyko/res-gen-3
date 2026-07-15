import c from 'classnames';
import { useCallback } from 'react';

import { useAppContext } from '@/context/app-context';
import { prepopulateUtil } from '@/utils/prepopulate-util';

type ResetResumeButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

// Restores the prepopulated example resume (specs/reset-to-example.md)
// -- File → New's sibling: both replace the whole resume, one with
// nothing, this one with the demo content a first visit shows.
export default function ResetResumeButton({
  className,
  role,
  tabIndex,
}: ResetResumeButtonProps) {
  const { onImportFile, pushUndoSnapshot } = useAppContext();

  // window.confirm on top of the undo toast, matching "New": replacing
  // the entire resume is a big enough blast radius to keep both guards
  // (specs/undo-destructive-actions.md).
  const handleClick = useCallback(() => {
    if (
      window.confirm(
        'Reset to the example resume? This will replace everything.',
      )
    ) {
      pushUndoSnapshot('Resume reset');
      onImportFile({
        items: prepopulateUtil.items,
        layouts: prepopulateUtil.layouts,
      });
    }
  }, [onImportFile, pushUndoSnapshot]);

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      onClick={handleClick}
      role={role}
      tabIndex={tabIndex}
    >
      Reset to Example
    </button>
  );
}
