import c from 'classnames';
import { v4 as uuidv4 } from 'uuid';

import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

type AddLayoutDoubleButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function AddLayoutDoubleButton({
  className,
  role,
  tabIndex,
}: AddLayoutDoubleButtonProps) {
  const { addLayout, isEditorVisible } = useAppContext();

  const handleClick = () => {
    addLayout({
      layoutId: uuidv4(),
      layoutLeftId: uuidv4(),
      layoutRightId: uuidv4(),
      layoutType: LAYOUTS.DOUBLE,
    });
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
      Add Double Column Layout
    </button>
  );
}
