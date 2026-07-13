import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toBlobMock, pdfMock } = vi.hoisted(() => {
  const toBlobMock = vi.fn();
  const pdfMock = vi.fn(() => ({ toBlob: toBlobMock }));
  return { toBlobMock, pdfMock };
});
vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return { ...actual, pdf: pdfMock };
});

const { contextState } = vi.hoisted(() => ({
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    title: '2026-01-01-your-name.pdf',
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      layouts: contextState.layouts,
      title: contextState.title,
    }),
  };
});
vi.mock('@/context/pdf-preview-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-preview-context')>();
  return {
    ...actual,
    usePdfPreviewContext: () => ({ styles: {} }),
  };
});

const { default: DownloadPdfButton } = await import('./download-pdf-button');

describe('DownloadPdfButton', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    pdfMock.mockClear();
    toBlobMock.mockReset();
    toBlobMock.mockResolvedValue(
      new Blob(['pdf-bytes'], { type: 'application/pdf' }),
    );
    contextState.items = [];
    contextState.layouts = [];
    contextState.title = '2026-01-01-your-name.pdf';

    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  it('is disabled when there are no items and no layouts', () => {
    const { getByText } = render(<DownloadPdfButton />);

    expect(getByText('Download PDF')).toBeDisabled();
  });

  it('generates and downloads a PDF blob once there are items', async () => {
    contextState.items = [{ contentId: 'a' }];
    const { getByText } = render(<DownloadPdfButton />);
    const button = getByText('Download PDF');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

    expect(pdfMock).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/pdf');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('is enabled once there are layouts, even with no items', () => {
    contextState.layouts = [{ layoutId: 'a' }];
    const { getByText } = render(<DownloadPdfButton />);

    expect(getByText('Download PDF')).toBeEnabled();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <DownloadPdfButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Download PDF');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
