import c from 'classnames';
import { useCallback } from 'react';

import { useAppContext } from '@/context/app-context';

type NewResumeButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function NewResumeButton({
  className,
  role,
  tabIndex,
}: NewResumeButtonProps) {
  const { onImportFile, pushUndoSnapshot } = useAppContext();

  // Keeps window.confirm on top of the undo toast (unlike the two
  // finer-grained actions, which dropped confirm entirely): this clears
  // the *entire* resume at once, a big enough blast radius to keep both
  // guards rather than relying on undo alone
  // (specs/undo-destructive-actions.md).
  const handleClick = useCallback(() => {
    if (window.confirm('Start a new resume? This will clear everything.')) {
      pushUndoSnapshot('Resume cleared');
      onImportFile({ items: [], layouts: [] });
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
      New
    </button>
  );
}
