import c from 'classnames';
import { Fragment } from 'react';

import EmptyLayoutState from '@/components/layouts/empty-layout-state';
import LayoutDouble from '@/components/layouts/layout-double';
import LayoutGapInserter from '@/components/layouts/layout-gap-inserter';
import LayoutSingle from '@/components/layouts/layout-single';
import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

export default function LayoutManager() {
  const { layouts } = useAppContext();

  return (
    <div
      id="layout-manager"
      // editor-page-surface only once there's a layout: the empty state
      // keeps its own card, so the white "paper" would look wrong wrapped
      // around it (specs/continuous-page-canvas.md).
      className={c('editor-page-container flex flex-col', {
        'editor-page-surface': layouts.length > 0,
      })}
    >
      {layouts.length === 0 && <EmptyLayoutState />}
      {layouts.map((layout, index) => {
        // Each layout is wrapped in a `group` shell so its hover-revealed
        // add controls (LayoutSingle / LayoutDouble's "+ Add block" /
        // "+ Add layout") can key off `group-hover` / `group-focus-within`
        // without disturbing the continuous page flow
        // (specs/continuous-page-canvas.md). The page padding lives on the
        // container itself, so wrapping layouts no longer risks dropping
        // the old `> .layout-single` padding rule.
        //
        // There's no per-layout header/remove toolbar here anymore -- the
        // hover-revealed LayoutHeader (label + "Remove layout") was
        // removed; a replacement layout-management affordance will land
        // separately.
        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <Fragment key={layout.layoutId}>
                <LayoutGapInserter index={index} />
                <div className="group">
                  <LayoutSingle
                    layoutId={layout.layoutId}
                    layoutType={layout.layoutType}
                    addLayoutIndex={index + 1}
                  />
                </div>
              </Fragment>
            );
          }
          case LAYOUTS.DOUBLE: {
            if (!layout.layoutLeftId)
              throw new Error(`layout missing property 'layoutLeftId`);
            if (!layout.layoutRightId)
              throw new Error(`layout missing property 'layoutRightId`);

            return (
              <Fragment key={layout.layoutId}>
                <LayoutGapInserter index={index} />
                <div className="group">
                  <LayoutDouble
                    layoutId={layout.layoutId}
                    layoutLeftId={layout.layoutLeftId}
                    layoutRightId={layout.layoutRightId}
                    addLayoutIndex={index + 1}
                  />
                </div>
              </Fragment>
            );
          }
          default:
            throw new Error(`Unsupported layout ${layout}`);
        }
      })}
      {layouts.length > 0 && <LayoutGapInserter index={layouts.length} />}
    </div>
  );
}
