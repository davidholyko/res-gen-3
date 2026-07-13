import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import FileMenu from './control-panel-file-menu';

describe('FileMenu', () => {
  it('opens to reveal the file actions', () => {
    const { getByText } = render(
      <AllProviders>
        <FileMenu />
      </AllProviders>,
    );

    fireEvent.click(getByText('File'));

    expect(getByText('New (Coming Soon)')).not.toBeNull();
    expect(getByText('Download PDF (Coming Soon)')).not.toBeNull();
    expect(getByText('Download JSON')).not.toBeNull();
    expect(getByText('Upload JSON')).not.toBeNull();
  });
});
