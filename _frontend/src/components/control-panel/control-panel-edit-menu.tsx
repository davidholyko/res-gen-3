import React from 'react';

import BaseMenu from './control-panel-base-menu';
import AddLayoutDoubleButton from './edit/add-layout-double-button';
import AddLayoutSingleButton from './edit/add-layout-single-button';
import RemoveBottomLayoutButton from './edit/remove-bottom-layout-button';

export default function EditMenu() {
  return (
    <BaseMenu name="Edit">
      <AddLayoutSingleButton />
      <AddLayoutDoubleButton />
      <RemoveBottomLayoutButton />
    </BaseMenu>
  );
}
