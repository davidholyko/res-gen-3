import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentId } from '@/types/content-base-item';

const { togglePdfViewMock, openEditingViewMock, contextState } = vi.hoisted(
  () => ({
    togglePdfViewMock: vi.fn(),
    openEditingViewMock: vi.fn(),
    contextState: {
      isPdfViewOpen: false,
      editingContentId: null as string | null,
      pageCount: null as number | null,
    },
  }),
);
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      isPdfViewOpen: contextState.isPdfViewOpen,
      editingContentId: contextState.editingContentId as ContentId | null,
      togglePdfView: togglePdfViewMock,
      openEditingView: openEditingViewMock,
      onUpdate: vi.fn(),
      title: '2026-01-01-test.pdf',
      items: [
        {
          contentId: 'h1',
          contentType: 'HEADER',
          content: { header: 'Summary' },
          layoutId: 'l1',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'l1', layoutType: 'SINGLE' }],
    }),
  };
});

vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({
      instance: { loading: false, url: 'blob:mock-url', blob: null },
      pageCount: contextState.pageCount,
    }),
  };
});

const { default: PdfView } = await import('./pdf-view');

beforeEach(() => {
  togglePdfViewMock.mockReset();
  openEditingViewMock.mockReset();
  contextState.isPdfViewOpen = false;
  contextState.editingContentId = null;
  contextState.pageCount = null;
});

describe('PdfView', () => {
  it('renders nothing when closed', () => {
    render(<PdfView />);

    expect(
      document.querySelector('[data-testid="pdf-frame-staging"]'),
    ).toBeNull();
  });

  it('renders the preview area when open, with no edit panel in view mode', () => {
    contextState.isPdfViewOpen = true;
    render(<PdfView />);

    // The staged preview frame is present (double-buffered load).
    expect(
      document.querySelector('[data-testid="pdf-frame-staging"]'),
    ).not.toBeNull();
    expect(screen.queryByLabelText('Blocks')).toBeNull();
  });

  it('docks the edit panel beside the preview while a block is being edited', () => {
    contextState.isPdfViewOpen = true;
    contextState.editingContentId = 'h1';
    render(<PdfView />);

    // The panel's form and picker are both present...
    expect(document.querySelector('input[name="header"]')).not.toBeNull();
    expect(screen.getByLabelText('Blocks')).not.toBeNull();
    // ...and the preview frame is still mounted, not covered/replaced.
    expect(
      document.querySelector('[data-testid="pdf-frame-staging"]'),
    ).not.toBeNull();
  });

  it('closes on Escape while open', () => {
    contextState.isPdfViewOpen = true;
    render(<PdfView />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfViewMock).toHaveBeenCalledWith(false);
  });

  it('removes the Escape listener once closed', () => {
    contextState.isPdfViewOpen = true;
    const { rerender } = render(<PdfView />);

    contextState.isPdfViewOpen = false;
    rerender(<PdfView />);
    togglePdfViewMock.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfViewMock).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys while open', () => {
    contextState.isPdfViewOpen = true;
    render(<PdfView />);

    fireEvent.keyDown(document, { key: 'a' });

    expect(togglePdfViewMock).not.toHaveBeenCalled();
  });

  it('has no automatically detectable accessibility violations while open, editing included', async () => {
    contextState.isPdfViewOpen = true;
    contextState.editingContentId = 'h1';
    contextState.pageCount = 2;
    const { container } = render(<PdfView />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
