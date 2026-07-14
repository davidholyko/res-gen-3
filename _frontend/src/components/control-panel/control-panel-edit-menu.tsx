import React from 'react';

import BaseMenu from './control-panel-base-menu';
import AddLayoutDoubleButton from './edit/add-layout-double-button';
import AddLayoutSingleButton from './edit/add-layout-single-button';

// "Remove Last Layout" retired (specs/editor-redesign.md, Design →
// Layout management): every layout has carried its own "Remove layout"
// link since specs/app-ux-improvements.md Finding 9, which covers the
// same case from anywhere -- not just the bottom.
export default function EditMenu() {
  return (
    <BaseMenu name="Edit">
      <AddLayoutSingleButton />
      <AddLayoutDoubleButton />
    </BaseMenu>
  );
}
