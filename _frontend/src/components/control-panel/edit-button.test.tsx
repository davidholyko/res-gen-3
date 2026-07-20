import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { openEditingViewMock, contextState } = vi.hoisted(() => ({
  openEditingViewMock: vi.fn(),
  contextState: {
    items: [] as { contentId: string; layoutId?: string }[],
    layouts: [] as { layoutId: string; layoutType: string }[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      openEditingView: openEditingViewMock,
      items: contextState.items,
      layouts: contextState.layouts,
    }),
  };
});

const { default: EditButton } = await import('./edit-button');

beforeEach(() => {
  openEditingViewMock.mockReset();
  contextState.items = [];
  contextState.layouts = [];
});

describe('EditButton', () => {
  it('is disabled when there are no blocks', () => {
    const { getByText } = render(<EditButton />);

    expect(getByText('Edit')).toBeDisabled();
  });

  it('opens the editing view on the first block in document order', () => {
    // items[0] sits in the *second* layout; the first macro in reading
    // order is the block in the first layout, so that is what opens.
    contextState.items = [
      { contentId: 'second-layout', layoutId: 'L2' },
      { contentId: 'first-layout', layoutId: 'L1' },
    ];
    contextState.layouts = [
      { layoutId: 'L1', layoutType: 'SINGLE' },
      { layoutId: 'L2', layoutType: 'SINGLE' },
    ];
    const { getByText } = render(<EditButton />);
    const button = getByText('Edit');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(openEditingViewMock).toHaveBeenCalledTimes(1);
    expect(openEditingViewMock).toHaveBeenCalledWith('first-layout');
  });

  it('falls back to items[0] for a block not yet placed in any zone', () => {
    contextState.items = [{ contentId: 'orphan' }];
    contextState.layouts = [];
    const { getByText } = render(<EditButton />);

    fireEvent.click(getByText('Edit'));

    expect(openEditingViewMock).toHaveBeenCalledWith('orphan');
  });
});
