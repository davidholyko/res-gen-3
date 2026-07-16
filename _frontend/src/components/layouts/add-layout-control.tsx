import { v4 as uuidv4 } from 'uuid';

import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

import { useCanvasMenu } from './use-canvas-menu';

type AddLayoutControlProps = {
  // Where the new layout lands: directly below the layout hosting this
  // control (its index + 1).
  insertIndex: number;
};

// "+ Add layout", paired with each layout's "+ Add block"
// (specs/add-layout-beside-add-block.md): adding a layout happens where
// content editing already happens, not up in a control-bar menu. The
// gap inserters remain the insert-at-arbitrary-position affordance;
// this is the obvious "give me another section below this one" path.
export default function AddLayoutControl({
  insertIndex,
}: AddLayoutControlProps) {
  const { addLayoutAt } = useAppContext();
  const {
    isOpen,
    setIsOpen,
    close,
    menuRef,
    containerRef,
    menuId,
    onMenuKeyDown,
  } = useCanvasMenu();

  const onPickSingle = () => {
    addLayoutAt(
      { layoutId: uuidv4() as LayoutId, layoutType: LAYOUTS.SINGLE },
      insertIndex,
    );
    close();
  };

  const onPickDouble = () => {
    addLayoutAt(
      {
        layoutId: uuidv4() as LayoutId,
        layoutLeftId: uuidv4(),
        layoutRightId: uuidv4(),
        layoutType: LAYOUTS.DOUBLE,
      },
      insertIndex,
    );
    close();
  };

  return (
    // Menu popup is a sibling of the trigger (aria-haspopup/aria-controls),
    // same WCAG 4.1.2 reasoning as BaseMenu.
    <div className="relative self-start" ref={containerRef}>
      <button
        type="button"
        // Same low visual weight as "+ Add block" -- persistent canvas
        // affordances must not compete with the resume content.
        className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded px-2 py-1 m-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        + Add layout
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          className="absolute z-30 flex flex-col bg-white border border-gray-300 rounded shadow-lg min-w-[11rem]"
        >
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            className="text-left text-sm px-3 py-2 hover:bg-cyan-100"
            onClick={onPickSingle}
          >
            One column
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            className="text-left text-sm px-3 py-2 hover:bg-cyan-100"
            onClick={onPickDouble}
          >
            Two columns
          </button>
        </div>
      )}
    </div>
  );
}
