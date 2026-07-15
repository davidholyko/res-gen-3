import c from 'classnames';

import CanvasEditPanel from '@/components/modals/canvas-edit-panel';
import { useAppContext } from '@/context/app-context';
import LayoutManager from '@/managers/layout-manager';

// No Template ribbon above the canvas anymore (specs/editor-redesign.md,
// Phase 6): content is added via each zone's "+ Add block" control.
export default function Main() {
  const { canvasEditingContentId } = useAppContext();
  const isPanelOpen = canvasEditingContentId !== null;

  return (
    // overflow-x-clip, not overflow-x-hidden: hidden creates a scroll
    // container, which breaks the panel's sticky positioning; clip just
    // crops the panel while its gutter animates open, without doing
    // that.
    <main className="flex flex-row justify-center overflow-x-clip">
      <div className="flex flex-col items-center min-w-0">
        <LayoutManager />
      </div>
      {/* The panel's gutter animates open on focus: the canvas sits
          centered while idle and slides left to make room
          (specs/canvas-edit-panel.md). A permanently reserved gutter and
          a fixed-position panel were both tried first -- see the spec's
          findings for why each was rejected. */}
      <div
        data-testid="edit-panel-gutter"
        className={c('shrink-0 transition-[width] duration-300 ease-out', {
          // 30rem panel + 18px canvas-side gap + 8px edge margin.
          'w-[506px]': isPanelOpen,
          'w-0': !isPanelOpen,
        })}
      >
        <CanvasEditPanel />
      </div>
    </main>
  );
}
