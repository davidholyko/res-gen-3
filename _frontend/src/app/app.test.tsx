import { render } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProvider } from '@/context/app-context';
import { PdfPreviewProvider } from '@/context/pdf-preview-context';

import App from './app';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [{ contentId: 'placeholder' }],
      layouts: [{ layoutId: 'a', layoutType: 'SINGLE' }],
      isEditorVisible: false,
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('App', () => {
  it('renders the resume modal, control panel, and main editor area together', () => {
    seedLocalStorage();
    // Mirrors the exact provider nesting page.tsx wraps App in.
    const { container, getByText } = render(
      <AppProvider>
        <PdfPreviewProvider>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </PdfPreviewProvider>
      </AppProvider>,
    );

    expect(getByText('ResGen 2.0')).not.toBeNull();
    expect(container.querySelector('#editor-manager')).not.toBeNull();
    expect(container.querySelector('.layout-single')).not.toBeNull();
    // ResumeModal is closed by default, so it doesn't portal any content.
    expect(container.querySelector('iframe')).toBeNull();
  });
});
