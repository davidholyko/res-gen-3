import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function renderPdfPreview(anchorPage?: number) {
  return render(
    <AppProvider>
      <PdfPreview anchorPage={anchorPage} />
    </AppProvider>,
  );
}

function stagingFrame(container: HTMLElement) {
  return container.querySelector('[data-testid="pdf-frame-staging"]');
}

function visibleFrame(container: HTMLElement) {
  return container.querySelector('[data-testid="pdf-frame-visible"]');
}

beforeEach(() => {
  contextState.instance = { loading: false, url: null };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PdfPreview', () => {
  it('shows a loading state before the PDF has a url yet', () => {
    const { getByRole, container } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows a loading state while instance.loading is true and nothing is displayed yet', () => {
    contextState.instance = { loading: true, url: 'blob:stale-url' };
    const { getByRole } = renderPdfPreview();

    expect(getByRole('status')).toHaveTextContent(/generating pdf preview/i);
  });

  it('stages the ready PDF invisibly, then promotes it to the visible frame on load', () => {
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();

    // Double-buffered (specs/edit-with-live-pdf-preview.md): nothing is
    // visible until the frame has actually loaded.
    expect(visibleFrame(container)).toBeNull();
    const staging = stagingFrame(container);
    expect(staging).toHaveAttribute('src', 'blob:mock-url#toolbar=1&page=1');
    expect(staging).toHaveAttribute('aria-hidden', 'true');

    fireEvent.load(staging as Element);

    expect(visibleFrame(container)).toHaveAttribute(
      'src',
      'blob:mock-url#toolbar=1&page=1',
    );
    expect(stagingFrame(container)).toBeNull();
  });

  it('keeps the current frame visible while a new blob URL loads, then swaps', () => {
    contextState.instance = { loading: false, url: 'blob:first' };
    const { container, rerender } = renderPdfPreview();
    fireEvent.load(stagingFrame(container) as Element);

    // A re-render mints a new blob URL...
    contextState.instance = { loading: false, url: 'blob:second' };
    rerender(
      <AppProvider>
        <PdfPreview />
      </AppProvider>,
    );

    // ...but the old frame stays visible (no white flash) until the new
    // one loads.
    expect(visibleFrame(container)).toHaveAttribute(
      'src',
      'blob:first#toolbar=1&page=1',
    );
    fireEvent.load(stagingFrame(container) as Element);
    expect(visibleFrame(container)).toHaveAttribute(
      'src',
      'blob:second#toolbar=1&page=1',
    );
  });

  it('anchors the frame to the requested page', () => {
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview(3);

    expect(stagingFrame(container)).toHaveAttribute(
      'src',
      'blob:mock-url#toolbar=1&page=3',
    );
  });

  it('promotes the staged frame by fallback timer when no load event ever fires', () => {
    // Headless Chromium never fires load for PDF frames (see the
    // component) -- the fallback must promote on its own.
    vi.useFakeTimers();
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();

    expect(visibleFrame(container)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(visibleFrame(container)).toHaveAttribute(
      'src',
      'blob:mock-url#toolbar=1&page=1',
    );
  });

  it('cancels the fallback once the load event promotes the frame first', () => {
    vi.useFakeTimers();
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();

    fireEvent.load(stagingFrame(container) as Element);
    const promoted = visibleFrame(container);
    expect(promoted).not.toBeNull();

    // Nothing left pending: advancing time changes nothing.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(visibleFrame(container)).toBe(promoted);
  });

  it('gives the visible iframe an accessible title', () => {
    contextState.instance = { loading: false, url: 'blob:mock-url' };
    const { container } = renderPdfPreview();
    fireEvent.load(stagingFrame(container) as Element);

    expect(visibleFrame(container)?.getAttribute('title')).toMatch(/\.pdf$/);
  });
});
