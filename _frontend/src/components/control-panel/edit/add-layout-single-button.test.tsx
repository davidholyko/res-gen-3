import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock } = vi.hoisted(() => ({
  addLayoutMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      addLayout: addLayoutMock,
    }),
  };
});

const { default: AddLayoutSingleButton } =
  await import('./add-layout-single-button');

beforeEach(() => {
  addLayoutMock.mockReset();
});

describe('AddLayoutSingleButton', () => {
  it('adds a SINGLE layout with a generated id on click', () => {
    const { getByText } = render(<AddLayoutSingleButton />);

    fireEvent.click(getByText('Add Single Column Layout'));

    expect(addLayoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: 'SINGLE',
        layoutId: expect.any(String),
      }),
    );
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <AddLayoutSingleButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Add Single Column Layout');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
