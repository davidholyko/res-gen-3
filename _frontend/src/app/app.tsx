import React from 'react';

import ControlPanel from '@/components/control-panel/control-panel';
import ResumeModal from '@/components/modals/resume-modal';
import UndoToast from '@/components/undo-toast';
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
      <UndoToast />
    </>
  );
}
