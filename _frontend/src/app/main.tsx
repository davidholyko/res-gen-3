import CanvasEditPanel from '@/components/modals/canvas-edit-panel';
import LayoutManager from '@/managers/layout-manager';

// No Template ribbon above the canvas anymore (specs/editor-redesign.md,
// Phase 6): content is added via each zone's "+ Add block" control.
export default function Main() {
  return (
    <main className="flex flex-row">
      <div className="grow flex flex-col items-center">
        <LayoutManager />
      </div>
      {/* The gutter is reserved even while the panel is closed
          (specs/canvas-edit-panel.md): the canvas's position must not
          shift when a block is focused, and a fixed-position panel was
          tried and rejected -- it overlapped the canvas's own toolbar
          buttons at ordinary window widths and swallowed their clicks. */}
      <div className="w-[27rem] shrink-0 px-2">
        <CanvasEditPanel />
      </div>
    </main>
  );
}
