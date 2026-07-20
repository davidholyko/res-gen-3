import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProvider, useAppContext } from '@/context/app-context';
import { PdfInstanceProvider } from '@/context/pdf-instance-context';
import { PdfPreviewProvider } from '@/context/pdf-preview-context';
import { AllProviders } from '@/test-providers';

import Main from './main';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [
        {
          contentId: 'h1',
          contentType: 'HEADER',
          content: { header: 'Summary' },
          layoutId: 'a',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'a', layoutType: 'SINGLE' }],
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('Main', () => {
  it('renders the layout manager with a collapsed edit-panel gutter', () => {
    seedLocalStorage();
    const { container, getByTestId } = render(
      <AllProviders>
        <Main />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-single')).not.toBeNull();
    expect(getByTestId('edit-panel-gutter')).not.toHaveClass('basis-[506px]');
  });

  it('opens the gutter when a block gains canvas focus', () => {
    seedLocalStorage();
    const { getByText, getByTestId } = render(
      <AllProviders>
        <Main />
      </AllProviders>,
    );

    // mousedown, not click: block focus decisions moved to mousedown
    // (base-macro.tsx) so mid-click reflows can't misread the target.
    fireEvent.mouseDown(getByText('Summary'));

    expect(getByTestId('edit-panel-gutter')).toHaveClass('basis-[506px]');
  });

  it('swaps the canvas for the restructure view while restructuring', () => {
    seedLocalStorage();

    // A tiny harness to flip isRestructuring through the real provider,
    // since nothing inside Main itself toggles it.
    function Harness() {
      const { toggleRestructure } = useAppContext();
      return (
        <>
          <button onClick={() => toggleRestructure(true)}>go</button>
          <Main />
        </>
      );
    }

    const { getByText, getByLabelText, queryByTestId } = render(
      <AllProviders>
        <Harness />
      </AllProviders>,
    );

    expect(queryByTestId('edit-panel-gutter')).not.toBeNull();

    fireEvent.click(getByText('go'));

    expect(getByLabelText('Restructure resume')).not.toBeNull();
    expect(queryByTestId('edit-panel-gutter')).toBeNull();
  });

  it('swaps the canvas for the inline PDF view while the preview is open', () => {
    seedLocalStorage();

    function Harness() {
      const { togglePdfModal } = useAppContext();
      return (
        <>
          <button onClick={() => togglePdfModal(true)}>go</button>
          <Main />
        </>
      );
    }

    // The PDF view pulls from the shared PDF instance, so it needs the
    // same provider stack page.tsx wraps the app in -- more than the bare
    // AppProvider the other cases use.
    const { getByText, getByLabelText, queryByTestId } = render(
      <AppProvider>
        <PdfPreviewProvider>
          <PdfInstanceProvider>
            <Harness />
          </PdfInstanceProvider>
        </PdfPreviewProvider>
      </AppProvider>,
    );

    expect(queryByTestId('edit-panel-gutter')).not.toBeNull();

    fireEvent.click(getByText('go'));

    expect(getByLabelText('Exit PDF View Button')).not.toBeNull();
    expect(queryByTestId('edit-panel-gutter')).toBeNull();
  });
});
