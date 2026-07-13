import c from 'classnames';
import { v4 as uuidv4 } from 'uuid';

import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

type AddLayoutSingleButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function AddLayoutSingleButton({
  className,
  role,
  tabIndex,
}: AddLayoutSingleButtonProps) {
  const { addLayout, isEditorVisible } = useAppContext();

  const handleClick = () => {
    addLayout({ layoutId: uuidv4(), layoutType: LAYOUTS.SINGLE });
  };

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
      Add Single Column Layout
    </button>
  );
}
