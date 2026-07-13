import c from 'classnames';
import { useCallback, useRef } from 'react';

import { useAppContext } from '@/context/app-context';

type UploadJsonButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function UploadJsonButton({
  className,
  role,
  tabIndex,
}: UploadJsonButtonProps) {
  const { onImportFile } = useAppContext();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();

      if (!event.target.files) {
        return;
      }

      const file = event.target.files[0];

      if (file?.type === 'application/json') {
        const reader = new FileReader();

        reader.onload = (e) => {
          const contents = e?.target?.result as string;

          try {
            const json = JSON.parse(contents);
            onImportFile(json);
          } catch (err) {
            console.error('Error parsing JSON:', err);
          }
        };
        reader.readAsText(file);
      }
    },
    [onImportFile],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLLabelElement>) => {
      event.stopPropagation();
      inputRef.current?.click?.();
    },
    [],
  );

  // Native label-click-to-activate-input covers mouse/touch; this label is
  // also independently focusable (tabIndex passed in by menu-item callers),
  // so it needs its own keyboard activation too.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLLabelElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        inputRef.current?.click?.();
      }
    },
    [],
  );

  const classNames = c('unstyled', className);

  return (
    <>
      {/*
        eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions --
        role/tabIndex are always supplied at runtime by BaseMenu's
        React.cloneElement (see control-panel-base-menu.tsx), which static
        analysis can't trace across components; this isn't actually
        non-interactive when rendered.
      */}
      <label
        id="custom-label"
        className={classNames}
        role={role}
        tabIndex={tabIndex}
        htmlFor="res-gen-file-input"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        Upload JSON
      </label>
      <input
        id="res-gen-file-input"
        className="hidden"
        type="file"
        accept=".json"
        onChange={handleChange}
        ref={inputRef}
        aria-hidden={true}
      />
    </>
  );
}
