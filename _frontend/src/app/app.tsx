import React from 'react';

import ControlPanel from '@/components/control-panel/control-panel';
import ResumeModal from '@/components/modals/resume-modal';
import PdfPreview from '@/pdf/pdf-preview';

import Main from './main';

export default function App() {
  return (
    <>
      <ResumeModal>
        <PdfPreview />
      </ResumeModal>
      <ControlPanel />
      <Main />
    </>
  );
}
