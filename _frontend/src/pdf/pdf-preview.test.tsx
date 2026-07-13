import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { usePDFMock, updateInstanceMock } = vi.hoisted(() => ({
  usePDFMock: vi.fn(),
  updateInstanceMock: vi.fn(),
}));
vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return { ...actual, usePDF: usePDFMock };
});

const { AppProvider } = await import('@/context/app-context');
const { PdfPreviewProvider } = await import('@/context/pdf-preview-context');
const { default: PdfPreview } = await import('./pdf-preview');

function renderPdfPreview() {
  return render(
    <AppProvider>
      <PdfPreviewProvider>
        <PdfPreview />
      </PdfPreviewProvider>
    </AppProvider>,
  );
}

beforeEach(() => {
  updateInstanceMock.mockReset();
  usePDFMock.mockReset();
});

describe('PdfPreview', () => {
  it('shows a loading state before the PDF has a url yet', () => {
    usePDFMock.mockReturnValue([
      { loading: false, url: null },
      updateInstanceMock,
    ]);
    const { getByRole, container } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows a loading state while instance.loading is true, even with a stale url', () => {
    usePDFMock.mockReturnValue([
      { loading: true, url: 'blob:stale-url' },
      updateInstanceMock,
    ]);
    const { getByRole, container } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders a full-size iframe with the toolbar suffix once the PDF is ready', () => {
    usePDFMock.mockReturnValue([
      { loading: false, url: 'blob:mock-url' },
      updateInstanceMock,
    ]);
    const { container } = renderPdfPreview();

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveStyle({ height: '100%', width: '100%' });
    expect(iframe).toHaveAttribute('src', 'blob:mock-url#toolbar=1');
  });

  it('gives the iframe an accessible title', () => {
    usePDFMock.mockReturnValue([
      { loading: false, url: 'blob:mock-url' },
      updateInstanceMock,
    ]);
    const { container } = renderPdfPreview();

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('title')).toMatch(/\.pdf$/);
  });

  it('updates the PDF instance when the underlying document inputs change', () => {
    usePDFMock.mockReturnValue([
      { loading: false, url: 'blob:mock-url' },
      updateInstanceMock,
    ]);
    renderPdfPreview();

    expect(updateInstanceMock).toHaveBeenCalled();
  });
});
