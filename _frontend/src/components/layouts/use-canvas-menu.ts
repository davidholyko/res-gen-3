import { useCallback, useEffect, useId, useRef, useState } from 'react';

// The shared mechanics of the canvas's small dropdown menus
// ("+ Add block", "+ Add layout"): open/close state, BaseMenu-style
// dismissal (a click anywhere outside or Escape closes), and arrow-key
// movement between menu items. Extracted so the second menu didn't
// mean a second copy of the listeners.
export function useCanvasMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      // containerRef wraps the whole menu component and this listener
      // only exists while it's mounted, so `current` is always set here.
      /* v8 ignore next */
      if (containerRef.current?.contains(event.target as Node)) return;
      close();
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  // Arrow-key movement between menu items, same as BaseMenu.
  const onMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Fires only as the menu node's own onKeyDown handler, so
      // menuRef.current is always set; `|| []` just satisfies TS.
      /* v8 ignore next */
      const items = Array.from(
        menuRef.current?.querySelectorAll('[role="menuitem"]') || [],
      );
      const currentIndex = items.indexOf(document.activeElement as Element);

      if (event.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % items.length;
        (items[nextIndex] as HTMLElement).focus();
      } else if (event.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        (items[prevIndex] as HTMLElement).focus();
      }
    },
    [],
  );

  return {
    isOpen,
    setIsOpen,
    close,
    menuRef,
    containerRef,
    menuId,
    onMenuKeyDown,
  };
}
