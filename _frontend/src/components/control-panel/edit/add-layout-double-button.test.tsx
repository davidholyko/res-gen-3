import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock, contextState } = vi.hoisted(() => ({
  addLayoutMock: vi.fn(),
  contextState: { isEditorVisible: false },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      addLayout: addLayoutMock,
      isEditorVisible: contextState.isEditorVisible,
    }),
  };
});

const { default: AddLayoutDoubleButton } =
  await import('./add-layout-double-button');

beforeEach(() => {
  addLayoutMock.mockReset();
  contextState.isEditorVisible = false;
});

describe('AddLayoutDoubleButton', () => {
  it('adds a DOUBLE layout with generated ids for both columns on click', () => {
    const { getByText } = render(<AddLayoutDoubleButton />);

    fireEvent.click(getByText('Add Double Column Layout'));

    expect(addLayoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: 'DOUBLE',
        layoutId: expect.any(String),
        layoutLeftId: expect.any(String),
        layoutRightId: expect.any(String),
      }),
    );
  });

  it('renders nothing while the editor panel is visible', () => {
    contextState.isEditorVisible = true;
    const { container } = render(<AddLayoutDoubleButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <AddLayoutDoubleButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Add Double Column Layout');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
