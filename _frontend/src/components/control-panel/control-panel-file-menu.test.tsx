import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfPreviewProvider } from '@/context/pdf-preview-context';
import { AllProviders } from '@/test-providers';

import FileMenu from './control-panel-file-menu';

describe('FileMenu', () => {
  it('opens to reveal the file actions', () => {
    const { getByText } = render(
      <AllProviders>
        <PdfPreviewProvider>
          <FileMenu />
        </PdfPreviewProvider>
      </AllProviders>,
    );

    fireEvent.click(getByText('File'));

    expect(getByText('New')).not.toBeNull();
    expect(getByText('Download PDF')).not.toBeNull();
    expect(getByText('Download JSON')).not.toBeNull();
    expect(getByText('Upload JSON')).not.toBeNull();
  });
});
