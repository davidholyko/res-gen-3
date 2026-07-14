import React, { useCallback, useEffect, useRef, useState } from 'react';

type BaseMenuProps = {
  children: React.ReactNode;
  name: string;
};

export default function BaseMenu({ children, name }: BaseMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleFileMenu = useCallback(() => {
    setIsMenuOpen((prevState) => !prevState);
  }, []);

  const closeFileMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close the menu if clicked outside or on Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeFileMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeFileMenu();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeFileMenu]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // handleKeyDown only ever fires as this same node's own onKeyDown
      // handler, so menuRef.current is always set by the time it runs;
      // the `|| []` fallback only exists to satisfy TS's optional chaining.
      /* v8 ignore next */
      const items = Array.from(
        menuRef.current?.querySelectorAll('.dropdown-item') || [],
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

  const ChildMenuItems = React.Children.map(
    children,
    (child: React.ReactNode) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          // @ts-expect-error 'className on child'
          className:
            'dropdown-item hover:bg-cyan-200 text-left p-2 cursor-auto',
          role: 'menuitem',
          tabIndex: 0,
        });
      }

      return child;
    },
  );

  return (
    // The menu popup is a sibling of the trigger, connected only via
    // aria-haspopup/aria-controls -- nesting role="menu" (and its
    // role="menuitem" children) inside role="button" is an axe-flagged
    // WCAG 4.1.2 violation (a focusable menu can't sensibly live inside
    // another focusable control).
    <div>
      <div
        className="base-menu"
        role="button"
        tabIndex={0}
        onClick={toggleFileMenu}
        onKeyDown={(e) => e.key === 'Enter' && toggleFileMenu()}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-controls={`${name.toLocaleLowerCase()}-menu`}
      >
        {name}
      </div>
      {isMenuOpen && (
        <div
          id={`${name.toLocaleLowerCase()}-menu`}
          // z-30: without an explicit z-index this stacked below the
          // ribbon's floating editor panels (z-20, specs/ribbon-layout.md)
          // in their shared stacking context, even collapsed/height-0 --
          // confirmed live, a real click-interception regression, not
          // hypothetical. A transient dropdown menu should always render
          // above ordinary page content regardless of DOM position.
          className="flex flex-col absolute z-30 bg-cyan-300 min-w-[100px] gap-1 mt-2 p-2 rounded"
          role="menu"
          tabIndex={-1}
          ref={menuRef}
          onKeyDown={handleKeyDown}
        >
          {ChildMenuItems}
        </div>
      )}
    </div>
  );
}
