import { Fragment } from 'react';

import EmptyLayoutState from '@/components/layouts/empty-layout-state';
import LayoutDouble from '@/components/layouts/layout-double';
import LayoutHeader from '@/components/layouts/layout-header';
import LayoutSingle from '@/components/layouts/layout-single';
import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

export default function LayoutManager() {
  const { layouts } = useAppContext();

  return (
    <div id="layout-manager" className="editor-page-container flex flex-col">
      {layouts.length === 0 && <EmptyLayoutState />}
      {layouts.map((layout, index) => {
        // Not a wrapping <div>: `.editor-page-container > .layout-single`
        // (src/css/editor.css) is a direct-child selector that gives a
        // standalone SINGLE layout its WYSIWYG page padding -- wrapping it
        // would make it a grandchild instead and silently drop that rule.
        // A Fragment keeps LayoutHeader and LayoutSingle/LayoutDouble as
        // siblings, both still direct children of .editor-page-container.
        const label = `Layout ${index + 1}`;

        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <Fragment key={layout.layoutId}>
                <LayoutHeader label={label} layoutId={layout.layoutId} />
                <LayoutSingle
                  layoutId={layout.layoutId}
                  layoutType={layout.layoutType}
                />
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
                <LayoutHeader label={label} layoutId={layout.layoutId} />
                <LayoutDouble
                  layoutId={layout.layoutId}
                  layoutLeftId={layout.layoutLeftId}
                  layoutRightId={layout.layoutRightId}
                />
              </Fragment>
            );
          }
          default:
            throw new Error(`Unsupported layout ${layout}`);
        }
      })}
    </div>
  );
}
