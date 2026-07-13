import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { removeLayoutMock } = vi.hoisted(() => ({
  removeLayoutMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ removeLayout: removeLayoutMock }),
  };
});

const { default: LayoutHeader } = await import('./layout-header');

beforeEach(() => {
  removeLayoutMock.mockReset();
});

describe('LayoutHeader', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('removes the layout when the remove button is clicked and confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByLabelText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Remove Layout 1? This will delete any content in it.',
    );
    expect(removeLayoutMock).toHaveBeenCalledWith('a');
    confirmSpy.mockRestore();
  });

  it('does not remove the layout when the confirmation is declined', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getByLabelText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(removeLayoutMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
