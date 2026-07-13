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
  const { onImportFile } = useAppContext();

  // Confirming here: this clears every layout and item with no way to get
  // it back, same reasoning as the other destructive-action confirms
  // (specs/app-ux-improvements.md, Finding 4/6).
  const handleClick = useCallback(() => {
    if (window.confirm('Start a new resume? This will clear everything.')) {
      onImportFile({ items: [], layouts: [] });
    }
  }, [onImportFile]);

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
