import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  BLANK_CONTENT,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  LAYOUTS,
} from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';

type AddBlockControlProps = {
  layoutId?: string;
  layoutType: keyof typeof LAYOUTS;
  layoutParentId?: string | null;
};

// The per-zone "+ Add block" affordance (specs/editor-redesign.md,
// Design → Layout management): adding content happens *at* the layout
// you want it in, listing the five block types in plain language.
// Picking one inserts a blank block (BLANK_CONTENT -- required keys
// present but empty, no example data to overwrite) into this zone;
// onCreate's lastCreatedContentId then scrolls it into view and reveals
// its form via BaseMacro's existing focus-on-create behavior.
export default function AddBlockControl(props: AddBlockControlProps) {
  const { layoutId, layoutType, layoutParentId } = props;
  const { onCreate } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setIsOpen(false), []);

  // Mirrors BaseMenu's dismissal behavior (control-panel-base-menu.tsx):
  // clicking anywhere outside or pressing Escape closes the menu.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      // containerRef wraps this whole component and this listener only
      // exists while it's mounted, so `current` is always set here --
      // unlike BaseMenu's equivalent, whose ref points at the sometimes-
      // unmounted menu popup itself.
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
      // Fires only as this node's own onKeyDown handler, so
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

  const onPick = useCallback(
    (contentType: keyof typeof CONTENT_TYPES) => {
      onCreate({
        // onCreate generates its own fresh contentId; this one just
        // satisfies the ContentAll shape.
        contentId: uuidv4() as ContentId,
        content: { ...BLANK_CONTENT[contentType] },
        contentType,
        layoutId: layoutId as LayoutId,
        layoutType,
        layoutParentId: layoutParentId || undefined,
        // Same looseness as BaseEditor's onUpdate call: this component is
        // generic over every content type, so it can't prove the blank
        // content's shape correlates with `contentType`.
      } as ContentAll);
      close();
    },
    [onCreate, layoutId, layoutType, layoutParentId, close],
  );

  return (
    // Menu popup is a sibling of the trigger (aria-haspopup/aria-controls),
    // same WCAG 4.1.2 reasoning as BaseMenu.
    <div className="relative self-start" ref={containerRef}>
      <button
        type="button"
        // Deliberately low visual weight: a persistent affordance on
        // every zone must not compete with the resume content itself.
        // text-gray-600, not -500: -500 is ~4.4:1 against the page's
        // bg-gray-100 (needs 4.5:1) -- same real-browser axe catch as
        // layout-header.tsx (Finding 11).
        className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded px-2 py-1 m-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        + Add block
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          // z-30, matching BaseMenu: transient popups render above
          // ordinary page content.
          className="absolute z-30 flex flex-col bg-white border border-gray-300 rounded shadow-lg min-w-[11rem]"
        >
          {(
            Object.keys(CONTENT_TYPE_LABELS) as (keyof typeof CONTENT_TYPES)[]
          ).map((contentType) => (
            <button
              key={contentType}
              type="button"
              role="menuitem"
              tabIndex={0}
              className="text-left text-sm px-3 py-2 hover:bg-cyan-100"
              onClick={() => onPick(contentType)}
            >
              {CONTENT_TYPE_LABELS[contentType]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
