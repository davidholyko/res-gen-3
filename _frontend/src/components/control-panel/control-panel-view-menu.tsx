import React from 'react';

import BaseMenu from './control-panel-base-menu';
import OpenPdfViewButton from './view/open-pdf-view-button';
import ToggleEditorPanelButton from './view/toggle-editor-panel-button';

export default function ViewMenu() {
  return (
    <BaseMenu name="View">
      <OpenPdfViewButton />
      <ToggleEditorPanelButton />
    </BaseMenu>
  );
}
