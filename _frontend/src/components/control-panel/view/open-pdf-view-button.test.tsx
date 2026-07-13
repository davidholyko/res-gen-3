import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock, contextState } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
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
    }),
  };
});

const { default: OpenPdfViewButton } = await import('./open-pdf-view-button');

beforeEach(() => {
  togglePdfModalMock.mockReset();
  contextState.items = [];
  contextState.layouts = [];
});

describe('OpenPdfViewButton', () => {
  it('is disabled when there are no items and no layouts', () => {
    const { getByText } = render(<OpenPdfViewButton />);

    expect(getByText('Open PDF View')).toBeDisabled();
  });

  it('is enabled once there are items, and calls togglePdfModal on click', () => {
    contextState.items = [{ contentId: 'a' }];
    const { getByText } = render(<OpenPdfViewButton />);
    const button = getByText('Open PDF View');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(togglePdfModalMock).toHaveBeenCalledTimes(1);
  });

  it('is enabled once there are layouts, even with no items', () => {
    contextState.layouts = [{ layoutId: 'a' }];
    const { getByText } = render(<OpenPdfViewButton />);

    expect(getByText('Open PDF View')).toBeEnabled();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <OpenPdfViewButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Open PDF View');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
