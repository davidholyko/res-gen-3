'use client';

import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { AppProvider } from '@/context/app-context';
import { PdfPreviewProvider } from '@/context/pdf-preview-context';
import loadFonts from '@/utils/pdf-font-loader-util';

import App from './app';

export default function Page() {
  const [stylesLoaded, setStylesLoaded] = useState(false);

  const styleSheets = useMemo(() => {
    return stylesLoaded && window.document.styleSheets;
  }, [stylesLoaded]);

  useEffect(() => {
    loadFonts();

    const interval = setInterval(() => {
      if (window.document.styleSheets.length) {
        setStylesLoaded(true);
        clearInterval(interval);
      }
    }, 10);
  }, []);

  if (!stylesLoaded || !styleSheets) {
    return <p>Loading...</p>;
  }

  return (
    <div id="res-gen">
      <AppProvider>
        <PdfPreviewProvider>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </PdfPreviewProvider>
      </AppProvider>
    </div>
  );
}
