import c from 'classnames';

import EmptyLayoutState from '@/components/layouts/empty-layout-state';
import LayoutDouble from '@/components/layouts/layout-double';
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
      {/* Display-only canvas: adding/removing/reordering layouts and blocks
          all happen in the restructure view now (specs/restructure-view.md),
          so there are no gap inserters or per-layout add controls here. */}
      {layouts.map((layout) => {
        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <LayoutSingle
                key={layout.layoutId}
                layoutId={layout.layoutId}
                layoutType={layout.layoutType}
              />
            );
          }
          case LAYOUTS.DOUBLE: {
            if (!layout.layoutLeftId)
              throw new Error(`layout missing property 'layoutLeftId`);
            if (!layout.layoutRightId)
              throw new Error(`layout missing property 'layoutRightId`);

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
