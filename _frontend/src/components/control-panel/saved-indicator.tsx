import c from 'classnames';
import { useEffect, useRef, useState } from 'react';

import { useAppContext } from '@/context/app-context';

const VISIBLE_DURATION_MS = 2000;

export default function SavedIndicator() {
  const { items, layouts, isEditorVisible } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);
  // Value snapshot, not a boolean "first render" flag -- a boolean flip
  // doesn't survive React StrictMode's dev-only double-invoke of the
  // mount effect (setup -> cleanup -> setup again, same refs), which
  // flipped the flag back to "not first" and flashed on every page load.
  // Comparing against the previous values instead is naturally correct
  // under double-invoke, since both invocations see the same (unchanged)
  // values and neither looks like a real change.
  const previousRef = useRef({ items, layouts, isEditorVisible });

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { items, layouts, isEditorVisible };

    if (
      previous.items === items &&
      previous.layouts === layouts &&
      previous.isEditorVisible === isEditorVisible
    ) {
      return;
    }

    setIsVisible(true);
    const timeoutId = setTimeout(
      () => setIsVisible(false),
      VISIBLE_DURATION_MS,
    );

    return () => clearTimeout(timeoutId);
  }, [items, layouts, isEditorVisible]);

  return (
    <span
      // text-cyan-800, not -700: this sits directly on the header's
      // bg-cyan-100 -- -700 landed at 4.4:1 (needs 4.5:1), caught by a
      // real-browser axe scan.
      className={c(
        'text-sm text-cyan-800 transition-opacity duration-300 self-center',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      {isVisible ? 'Saved' : ''}
    </span>
  );
}
