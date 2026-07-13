import c from 'classnames';

import { useAppContext } from '@/context/app-context';

type ToggleEditorPanelButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function ToggleEditorPanelButton({
  className,
  role,
  tabIndex,
}: ToggleEditorPanelButtonProps) {
  const { toggleEditor } = useAppContext();

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      onClick={() => toggleEditor()}
      role={role}
      tabIndex={tabIndex}
    >
      Toggle Editor
    </button>
  );
}
