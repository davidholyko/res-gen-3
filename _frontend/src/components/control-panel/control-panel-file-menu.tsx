import React from 'react';

import BaseMenu from './control-panel-base-menu';
import DownloadJsonButton from './file/download-json-button';
import UploadJsonButton from './file/upload-json-button';

export default function FileMenu() {
  return (
    <BaseMenu name="File">
      <div>New {`(Coming Soon)`}</div>
      <div>Download PDF {`(Coming Soon)`}</div>
      <DownloadJsonButton />
      <UploadJsonButton />
    </BaseMenu>
  );
}
