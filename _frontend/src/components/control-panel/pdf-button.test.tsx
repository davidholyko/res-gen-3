import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock, contextState } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    isRestructuring: false,
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
      isRestructuring: contextState.isRestructuring,
    }),
  };
});

const { default: PdfButton } = await import('./pdf-button');

beforeEach(() => {
  togglePdfModalMock.mockReset();
  contextState.items = [];
  contextState.layouts = [];
  contextState.isRestructuring = false;
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

  it('renders nothing while restructuring', () => {
    contextState.items = [{ contentId: 'a' }];
    contextState.isRestructuring = true;
    const { queryByText } = render(<PdfButton />);

    expect(queryByText('PDF')).toBeNull();
  });
});
