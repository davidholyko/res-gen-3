import { LAYOUTS } from '@/constants';
import type { LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';

export type LayoutDropZone = {
  key: string;
  label: string;
  layoutId: LayoutId;
  layoutType: keyof typeof LAYOUTS;
  layoutParentId?: LayoutId;
};

/**
 * Flattens `layouts` into the individual drop zones a user can place
 * content into -- one per SINGLE layout, two (left/right) per DOUBLE
 * layout -- matching what LayoutManager actually renders as separate
 * LayoutSingle instances. Used to give keyboard/non-drag users a way to
 * target any layout (not just the last one) when adding content, the
 * non-drag alternative WCAG SC 2.5.7 requires.
 */
export function getLayoutDropZones(layouts: LayoutItem[]): LayoutDropZone[] {
  return layouts.flatMap((layout, index): LayoutDropZone[] => {
    const position = index + 1;

    if (layout.layoutType !== LAYOUTS.DOUBLE) {
      return [
        {
          key: layout.layoutId,
          label: `Layout ${position}`,
          layoutId: layout.layoutId,
          layoutType: LAYOUTS.SINGLE,
          layoutParentId: undefined,
        },
      ];
    }

    return [
      {
        key: layout.layoutLeftId as string,
        label: `Layout ${position} (Left)`,
        layoutId: layout.layoutLeftId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_LEFT,
        layoutParentId: layout.layoutId,
      },
      {
        key: layout.layoutRightId as string,
        label: `Layout ${position} (Right)`,
        layoutId: layout.layoutRightId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_RIGHT,
        layoutParentId: layout.layoutId,
      },
    ];
  });
}
