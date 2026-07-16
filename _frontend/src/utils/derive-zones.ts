import { LAYOUTS } from '@/constants';
import type { LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';

// A single editable "zone" on the canvas: a whole SINGLE layout, or one
// half of a DOUBLE layout. This is the one source of truth for what
// zones exist and how they're labelled, shared by the edit-panel's block
// picker (edit-panel.tsx) and the block toolbar's "Move to…" menu
// (move-to-control.tsx, specs/move-block-between-layouts.md). The
// layoutType/layoutId/layoutParentId triple matches exactly how
// AddBlockControl / layout-double.tsx tag a block for each zone, so a
// block reassigned to a zone renders there identically to one added
// there.
export type Zone = {
  key: string;
  label: string;
  layoutId: LayoutId;
  layoutType: keyof typeof LAYOUTS;
  layoutParentId?: LayoutId;
};

export function deriveZones(layouts: LayoutItem[]): Zone[] {
  return layouts.flatMap((layout, index) => {
    const position = index + 1;

    if (layout.layoutType !== LAYOUTS.DOUBLE) {
      return [
        {
          key: layout.layoutId,
          label: `Layout ${position}`,
          layoutId: layout.layoutId,
          layoutType: layout.layoutType,
        },
      ];
    }

    return [
      {
        key: layout.layoutLeftId,
        label: `Layout ${position} (Left)`,
        layoutId: layout.layoutLeftId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_LEFT,
        layoutParentId: layout.layoutId,
      },
      {
        key: layout.layoutRightId,
        label: `Layout ${position} (Right)`,
        layoutId: layout.layoutRightId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_RIGHT,
        layoutParentId: layout.layoutId,
      },
    ];
  });
}
