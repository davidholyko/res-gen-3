import React from 'react';

import BaseMenu from './control-panel-base-menu';
import DownloadJsonButton from './file/download-json-button';
import DownloadPdfButton from './file/download-pdf-button';
import NewResumeButton from './file/new-resume-button';
import ResetResumeButton from './file/reset-resume-button';
import UploadJsonButton from './file/upload-json-button';

export default function FileMenu() {
  return (
    <BaseMenu name="File">
      <NewResumeButton />
      <ResetResumeButton />
      <DownloadPdfButton />
      <DownloadJsonButton />
      <UploadJsonButton />
    </BaseMenu>
  );
}
