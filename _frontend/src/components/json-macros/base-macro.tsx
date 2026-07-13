import c from 'classnames';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';

import EditorItem from '../content/editor-item';
import { MacroTopBar } from '../sub-components/macro-top-bar';

type BaseMacroProps = ContentAll & {
  children: ReactNode;
};

export default function BaseMacro(props: BaseMacroProps) {
  const { children, contentId } = props;

  const { onDelete } = useAppContext();

  const [isFocused, setIsFocused] = useState(false);

  const divRef = useRef<HTMLDivElement>(null);

  // Function to handle clicks outside of the div
  const handleClick = useCallback((event: MouseEvent) => {
    if (!divRef.current) return;

    if (divRef.current?.contains(event.target as Node)) {
      setIsFocused(true);
    }

    if (!divRef.current?.contains(event.target as Node)) {
      setIsFocused(false);
    }
  }, []);

  // Attach the click event listener when the component mounts
  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => {
      // Clean up the event listener when the component unmounts
      document.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // event.stopImmediatePropagation();
      // event.stopPropagation();

      if ((event.key === 'Backspace' || event.key === 'Delete') && isFocused) {
        onDelete({ contentId });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contentId, isFocused, onDelete]);

  const className = c({
    'mb-2': true,
    'border-2': isFocused,
    rounded: isFocused,
    'border-blue-700': isFocused,
    'p-2': isFocused,
  });

  return (
    <div className={className} role="button" tabIndex={0} ref={divRef}>
      {isFocused && <MacroTopBar contentId={contentId} />}
      {children}
      {isFocused && (
        <EditorItem {...props} mode={EDITOR_MODES.IN_LAYOUT_MANAGER} />
      )}
    </div>
  );
}
