import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DownloadJsonButton from './download-json-button';

describe('DownloadJsonButton', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    window.localStorage.setItem(
      'res-gen-data',
      JSON.stringify({
        items: [{ contentId: 'a' }],
        layouts: [],
        isEditorVisible: false,
      }),
    );
  });

  afterEach(() => {
    clickSpy.mockRestore();
    window.localStorage.clear();
  });

  it('creates and downloads a JSON blob of the current localStorage data', async () => {
    const { getByText } = render(<DownloadJsonButton />);

    fireEvent.click(getByText('Download JSON'));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');

    const text = await blob.text();
    expect(JSON.parse(text)).toEqual(
      expect.objectContaining({ items: [{ contentId: 'a' }] }),
    );

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <DownloadJsonButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Download JSON');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
