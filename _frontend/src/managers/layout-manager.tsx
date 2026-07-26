import c from 'classnames';

import EmptyLayoutState from '@/components/layouts/empty-layout-state';
import LayoutDouble from '@/components/layouts/layout-double';
import LayoutSingle from '@/components/layouts/layout-single';
import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

export default function LayoutManager() {
  const { layouts, items } = useAppContext();

  // Zones that actually hold content. Empty layouts are hidden from the
  // canvas entirely (specs/continuous-page-canvas.md, Later change): the
  // dashed "section to fill" placeholder read as a rendering glitch
  // sitting in the middle of an otherwise-real resume (user report), and
  // empty layouts stay visible and manageable in the restructure view --
  // the only place they can be filled or removed anyway.
  const filledZoneIds = new Set(items.map((item) => item.layoutId as string));
  const hasVisibleLayout = layouts.some((layout) =>
    layout.layoutType === LAYOUTS.DOUBLE
      ? filledZoneIds.has(layout.layoutLeftId as string) ||
        filledZoneIds.has(layout.layoutRightId as string)
      : filledZoneIds.has(layout.layoutId),
  );

  return (
    <div
      id="layout-manager"
      // editor-page-surface only once something renders: the empty state
      // keeps its own card, so the white "paper" would look wrong wrapped
      // around it (specs/continuous-page-canvas.md).
      className={c('editor-page-container flex flex-col', {
        'editor-page-surface': hasVisibleLayout,
      })}
    >
      {/* Content-empty, not just layout-empty: a resume whose layouts are
          all empty renders nothing on the canvas, so it gets the same CTA
          as one with no layouts at all. */}
      {!hasVisibleLayout && <EmptyLayoutState />}
      {/* Display-only canvas: adding/removing/reordering layouts and blocks
          all happen in the restructure view now (specs/restructure-view.md),
          so there are no gap inserters or per-layout add controls here. */}
      {layouts.map((layout) => {
        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            if (!filledZoneIds.has(layout.layoutId)) return null;
            return (
              <LayoutSingle
                key={layout.layoutId}
                layoutId={layout.layoutId}
                layoutType={layout.layoutType}
              />
            );
          }
          case LAYOUTS.DOUBLE: {
            // Validate before hiding: a malformed DOUBLE should fail
            // loudly even while empty, not be silently skipped.
            if (!layout.layoutLeftId)
              throw new Error(`layout missing property 'layoutLeftId`);
            if (!layout.layoutRightId)
              throw new Error(`layout missing property 'layoutRightId`);
            if (
              !filledZoneIds.has(layout.layoutLeftId) &&
              !filledZoneIds.has(layout.layoutRightId)
            )
              return null;

            return (
              <LayoutDouble
                key={layout.layoutId}
                layoutId={layout.layoutId}
                layoutLeftId={layout.layoutLeftId}
                layoutRightId={layout.layoutRightId}
              />
            );
          }
          default:
            throw new Error(`Unsupported layout ${layout}`);
        }
      })}
    </div>
  );
}
