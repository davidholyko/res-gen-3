import c from 'classnames';

import CanvasEditPanel from '@/components/modals/canvas-edit-panel';
import RestructureView from '@/components/restructure/restructure-view';
import { useAppContext } from '@/context/app-context';
import LayoutManager from '@/managers/layout-manager';

// No Template ribbon above the canvas anymore (specs/editor-redesign.md,
// Phase 6): content is added via each zone's "+ Add block" control.
export default function Main() {
  const { canvasEditingContentId, isRestructuring } = useAppContext();
  const isPanelOpen = canvasEditingContentId !== null;

  // The restructure view takes over the whole editor area while open
  // (specs/restructure-view.md) -- it's a two-pane rebuild surface, not
  // something that sits beside the normal single canvas.
  if (isRestructuring) {
    return (
      <main className="flex flex-row justify-center">
        <RestructureView />
      </main>
    );
  }

  return (
    // overflow-x-clip, not overflow-x-hidden: hidden creates a scroll
    // container, which breaks the panel's sticky positioning; clip just
    // crops the panel while its gutter animates open, without doing
    // that.
    <main className="flex flex-row overflow-x-clip">
      {/* Mirrored spacers center the canvas while idle; when the panel
          opens, its region's flex-basis animates up, so the canvas
          slides left and the panel region absorbs the reserved width
          PLUS its half of the leftover space -- which is what lets the
          panel sit centered between the canvas and the viewport edge
          instead of pinned flush right (specs/canvas-edit-panel.md). */}
      <div className="grow basis-0" />
      <div className="flex flex-col items-center min-w-0">
        <LayoutManager />
      </div>
      <div
        data-testid="edit-panel-gutter"
        // min-w-0: without it, the fixed-width inner wrapper sets the
        // region's min-content floor and holds it at 506px even while
        // idle, shoving the canvas off-center.
        // flex flex-col: makes the inner wrapper a flex child so it can
        // stretch to the gutter's full (canvas) height -- the sticky
        // panel only travels within its own parent's box, so a wrapper
        // sized to the panel gives it nowhere to stick.
        className={c(
          'flex flex-col grow basis-0 min-w-0 transition-[flex-basis] duration-300 ease-out',
          { 'basis-[506px]': isPanelOpen },
        )}
      >
        {/* Fixed-width inner wrapper, matching the reserved basis: the
            panel sizes against this (95%), NOT the animating region --
            sizing against the animation resizes the form every frame
            and drops keystrokes typed mid-slide (see the panel).
            mx-auto centers it once the region exceeds it; auto margins
            never go negative, so mid-animation it overflows rightward
            (clipped by main) rather than over the canvas. */}
        <div className="w-[506px] mx-auto grow">
          <CanvasEditPanel />
        </div>
      </div>
    </main>
  );
}
