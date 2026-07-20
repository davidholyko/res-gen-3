import { useCanvasMenu } from '@/components/layouts/use-canvas-menu';
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '@/constants';

type RestructureAddBlockProps = {
  onAdd: (contentType: keyof typeof CONTENT_TYPES) => void;
};

// The per-zone "+ Add block" menu inside a restructure staging box
// (specs/restructure-view.md). It moved here from the canvas: picking a
// type inserts a *blank* block of it into this zone, filled in on the
// canvas after Apply. Same plain-language type list and menu mechanics as
// the old canvas AddBlockControl (shared useCanvasMenu).
export default function RestructureAddBlock({
  onAdd,
}: RestructureAddBlockProps) {
  const {
    isOpen,
    setIsOpen,
    close,
    menuRef,
    containerRef,
    menuId,
    onMenuKeyDown,
  } = useCanvasMenu();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
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
          className="absolute z-30 flex flex-col rounded border border-gray-300 bg-white shadow-lg min-w-[11rem]"
        >
          {(
            Object.keys(CONTENT_TYPE_LABELS) as (keyof typeof CONTENT_TYPES)[]
          ).map((contentType) => (
            <button
              key={contentType}
              type="button"
              role="menuitem"
              tabIndex={0}
              className="px-3 py-2 text-left text-sm hover:bg-cyan-100"
              onClick={() => {
                onAdd(contentType);
                close();
              }}
            >
              {CONTENT_TYPE_LABELS[contentType]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
