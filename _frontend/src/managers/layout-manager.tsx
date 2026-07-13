import LayoutDouble from '@/components/layouts/layout-double';
import LayoutSingle from '@/components/layouts/layout-single';
import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

export default function LayoutManager() {
  const { layouts } = useAppContext();

  return (
    <div
      id="layout-manager"
      className="editor-page-container flex flex-col grow"
    >
      {layouts.map((layout) => {
        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <LayoutSingle //
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
