import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfViewMock, contextState } = vi.hoisted(() => ({
  togglePdfViewMock: vi.fn(),
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    isPdfViewOpen: false,
    editingContentId: null as string | null,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      togglePdfView: togglePdfViewMock,
      items: contextState.items,
      layouts: contextState.layouts,
      isPdfViewOpen: contextState.isPdfViewOpen,
      editingContentId: contextState.editingContentId,
    }),
  };
});

const { default: PdfButton } = await import('./pdf-button');

beforeEach(() => {
  togglePdfViewMock.mockReset();
  contextState.items = [];
  contextState.layouts = [];
  contextState.isPdfViewOpen = false;
  contextState.editingContentId = null;
});

describe('PdfButton', () => {
  it('is disabled when there are no items and no layouts', () => {
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toBeDisabled();
  });

  it('is enabled once there are items, and opens the PDF view on click', () => {
    contextState.items = [{ contentId: 'a' }];
    const { getByText } = render(<PdfButton />);
    const button = getByText('PDF');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(togglePdfViewMock).toHaveBeenCalledTimes(1);
  });

  it('is enabled once there are layouts, even with no items', () => {
    contextState.layouts = [{ layoutId: 'a' }];
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toBeEnabled();
  });

  it('reads as pressed while the plain PDF view is open', () => {
    contextState.items = [{ contentId: 'a' }];
    contextState.isPdfViewOpen = true;
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is not pressed when the surface is the edit-with-preview flow', () => {
    contextState.items = [{ contentId: 'a' }];
    contextState.isPdfViewOpen = true;
    contextState.editingContentId = 'a';
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toHaveAttribute('aria-pressed', 'false');
  });
});
