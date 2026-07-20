import React from 'react';

import ControlPanel from '@/components/control-panel/control-panel';
import UndoToast from '@/components/undo-toast';

import Main from './main';

// The PDF preview is no longer a floating modal here -- it's an inline
// view Main swaps in for the canvas while `isPdfViewOpen` (see main.tsx),
// the same way it swaps in the restructure view.
export default function App() {
  return (
    <>
      <ControlPanel />
      <Main />
      <UndoToast />
    </>
  );
}
