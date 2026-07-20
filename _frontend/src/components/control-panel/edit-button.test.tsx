import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { openEditingViewMock, contextState } = vi.hoisted(() => ({
  openEditingViewMock: vi.fn(),
  contextState: {
    items: [] as { contentId: string }[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      openEditingView: openEditingViewMock,
      items: contextState.items,
    }),
  };
});

const { default: EditButton } = await import('./edit-button');

beforeEach(() => {
  openEditingViewMock.mockReset();
  contextState.items = [];
});

describe('EditButton', () => {
  it('is disabled when there are no blocks', () => {
    const { getByText } = render(<EditButton />);

    expect(getByText('Edit')).toBeDisabled();
  });

  it('opens the editing view on the first block when clicked', () => {
    contextState.items = [{ contentId: 'first' }, { contentId: 'second' }];
    const { getByText } = render(<EditButton />);
    const button = getByText('Edit');

    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(openEditingViewMock).toHaveBeenCalledTimes(1);
    expect(openEditingViewMock).toHaveBeenCalledWith('first');
  });
});
