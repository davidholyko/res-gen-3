import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { contextState } = vi.hoisted(() => ({
  contextState: {
    instance: { loading: false, url: null as string | null },
  },
}));
vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({ instance: contextState.instance }),
  };
});

const { AppProvider } = await import('@/context/app-context');
const { default: PdfPreview } = await import('./pdf-preview');

function renderPdfPreview() {
  return render(
    <AppProvider>
      <PdfPreview />
    </AppProvider>,
  );
}

beforeEach(() => {
  contextState.instance = { loading: false, url: null };
});

describe('PdfPreview', () => {
  it('shows a loading state before the PDF has a url yet', () => {
    const { getByRole, container } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows a loading state while instance.loading is true, even with a stale url', () => {
    contextState.instance = { loading: true, url: 'blob:stale-url' };
    const { getByRole, container } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders a full-size iframe with the toolbar suffix once the PDF is ready', () => {
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveStyle({ height: '100%', width: '100%' });
    expect(iframe).toHaveAttribute('src', 'blob:mock-url#toolbar=1');
  });

  it('gives the iframe an accessible title', () => {
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('title')).toMatch(/\.pdf$/);
  });
});
