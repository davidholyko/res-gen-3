'use client';

import { useEffect, useMemo, useState } from 'react';

import { AppProvider } from '@/context/app-context';
import { PdfInstanceProvider } from '@/context/pdf-instance-context';
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
          <PdfInstanceProvider>
            <App />
          </PdfInstanceProvider>
        </PdfPreviewProvider>
      </AppProvider>
    </div>
  );
}
