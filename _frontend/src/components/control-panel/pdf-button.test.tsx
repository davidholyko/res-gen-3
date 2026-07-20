import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock, contextState } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    isModalOpen: false,
    editingContentId: null as string | null,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      togglePdfModal: togglePdfModalMock,
      items: contextState.items,
      layouts: contextState.layouts,
      isModalOpen: contextState.isModalOpen,
      editingContentId: contextState.editingContentId,
    }),
  };
});

const { default: PdfButton } = await import('./pdf-button');

beforeEach(() => {
  togglePdfModalMock.mockReset();
  contextState.items = [];
  contextState.layouts = [];
  contextState.isModalOpen = false;
  contextState.editingContentId = null;
});

describe('PdfButton', () => {
  it('is disabled when there are no items and no layouts', () => {
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toBeDisabled();
  });

  it('is enabled once there are items, and opens the modal on click', () => {
    contextState.items = [{ contentId: 'a' }];
    const { getByText } = render(<PdfButton />);
    const button = getByText('PDF');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(togglePdfModalMock).toHaveBeenCalledTimes(1);
  });

  it('is enabled once there are layouts, even with no items', () => {
    contextState.layouts = [{ layoutId: 'a' }];
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toBeEnabled();
  });

  it('reads as pressed while the plain PDF view is open', () => {
    contextState.items = [{ contentId: 'a' }];
    contextState.isModalOpen = true;
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is not pressed when the surface is the edit-with-preview flow', () => {
    contextState.items = [{ contentId: 'a' }];
    contextState.isModalOpen = true;
    contextState.editingContentId = 'a';
    const { getByText } = render(<PdfButton />);

    expect(getByText('PDF')).toHaveAttribute('aria-pressed', 'false');
  });
});
