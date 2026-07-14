import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { appContextState, pdfInstanceState } = vi.hoisted(() => ({
  appContextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    title: '2026-01-01-your-name.pdf',
  },
  pdfInstanceState: {
    blob: null as Blob | null,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: appContextState.items,
      layouts: appContextState.layouts,
      title: appContextState.title,
    }),
  };
});
vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({
      instance: { blob: pdfInstanceState.blob },
    }),
  };
});

const { default: DownloadPdfButton } = await import('./download-pdf-button');

describe('DownloadPdfButton', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    appContextState.items = [];
    appContextState.layouts = [];
    appContextState.title = '2026-01-01-your-name.pdf';
    pdfInstanceState.blob = null;

    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  it('is disabled when there are no items and no layouts', () => {
    pdfInstanceState.blob = new Blob(['pdf-bytes'], {
      type: 'application/pdf',
    });
    const { getByText } = render(<DownloadPdfButton />);

    expect(getByText('Download PDF')).toBeDisabled();
  });

  it('is disabled while the shared PDF instance has not rendered a blob yet, even with content', () => {
    appContextState.items = [{ contentId: 'a' }];
    pdfInstanceState.blob = null;
    const { getByText } = render(<DownloadPdfButton />);

    expect(getByText('Download PDF')).toBeDisabled();
  });

  it('downloads the shared instance blob once there are items and it has rendered', () => {
    appContextState.items = [{ contentId: 'a' }];
    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    pdfInstanceState.blob = blob;
    const { getByText } = render(<DownloadPdfButton />);
    const button = getByText('Download PDF');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('is enabled once there are layouts, even with no items, once the instance has rendered', () => {
    appContextState.layouts = [{ layoutId: 'a' }];
    pdfInstanceState.blob = new Blob(['pdf-bytes'], {
      type: 'application/pdf',
    });
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
