import React from 'react';

import BaseMenu from './control-panel-base-menu';
import OpenPdfViewButton from './view/open-pdf-view-button';

// "Toggle Editor" retired with the Template ribbon it toggled
// (specs/editor-redesign.md, Phase 6).
export default function ViewMenu() {
  return (
    <BaseMenu name="View">
      <OpenPdfViewButton />
    </BaseMenu>
  );
}
