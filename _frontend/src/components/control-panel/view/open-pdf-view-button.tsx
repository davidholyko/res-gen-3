import c from 'classnames';
import { useMemo } from 'react';

import { useAppContext } from '@/context/app-context';

type OpenPdfViewButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function OpenPdfViewButton({
  className,
  role,
  tabIndex,
}: OpenPdfViewButtonProps) {
  const { togglePdfModal, items, layouts } = useAppContext();

  const disabled = useMemo(() => {
    return !(items.length || layouts.length);
  }, [items, layouts]);

  const classNames = c('unstyled', className);

  return (
    <button
      type="button"
      disabled={disabled}
      className={classNames}
      onClick={() => togglePdfModal()}
      role={role}
      tabIndex={tabIndex}
    >
      Open PDF View
    </button>
  );
}
