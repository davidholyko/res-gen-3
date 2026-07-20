import { render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProvider } from '@/context/app-context';
import { PdfInstanceProvider } from '@/context/pdf-instance-context';
import { PdfPreviewProvider } from '@/context/pdf-preview-context';

import App from './app';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [{ contentId: 'placeholder' }],
      layouts: [{ layoutId: 'a', layoutType: 'SINGLE' }],
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('App', () => {
  it('renders the resume modal, control panel, and main editor area together', () => {
    seedLocalStorage();
    // Mirrors the exact provider nesting (and #res-gen root id, which
    // ResumeModal's Modal.setAppElement('#res-gen') call depends on)
    // page.tsx wraps App in.
    const { container, getByText } = render(
      <div id="res-gen">
        <AppProvider>
          <PdfPreviewProvider>
            <PdfInstanceProvider>
              <App />
            </PdfInstanceProvider>
          </PdfPreviewProvider>
        </AppProvider>
      </div>,
    );

    expect(getByText('Res Gen 3')).not.toBeNull();
    expect(container.querySelector('.layout-single')).not.toBeNull();
    // ResumeModal is closed by default, so it doesn't portal any content.
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('has no automatically detectable accessibility violations across the whole composed app', async () => {
    seedLocalStorage();
    const { container } = render(
      <div id="res-gen">
        <AppProvider>
          <PdfPreviewProvider>
            <PdfInstanceProvider>
              <App />
            </PdfInstanceProvider>
          </PdfPreviewProvider>
        </AppProvider>
      </div>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
