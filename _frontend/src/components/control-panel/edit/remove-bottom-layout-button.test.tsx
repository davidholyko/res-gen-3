import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { popLayoutMock, contextState } = vi.hoisted(() => ({
  popLayoutMock: vi.fn(),
  contextState: { isEditorVisible: false },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      popLayout: popLayoutMock,
      isEditorVisible: contextState.isEditorVisible,
    }),
  };
});

const { default: RemoveBottomLayoutButton } =
  await import('./remove-bottom-layout-button');

beforeEach(() => {
  popLayoutMock.mockReset();
  contextState.isEditorVisible = false;
});

describe('RemoveBottomLayoutButton', () => {
  it('calls popLayout when the confirmation is accepted', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByText } = render(<RemoveBottomLayoutButton />);

    fireEvent.click(getByText('Remove Last Layout'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Remove the last layout? This will delete any content in it.',
    );
    expect(popLayoutMock).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('does not call popLayout when the confirmation is declined', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getByText } = render(<RemoveBottomLayoutButton />);

    fireEvent.click(getByText('Remove Last Layout'));

    expect(popLayoutMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('renders nothing while the editor panel is visible', () => {
    contextState.isEditorVisible = true;
    const { container } = render(<RemoveBottomLayoutButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <RemoveBottomLayoutButton
        className="extra"
        role="menuitem"
        tabIndex={0}
      />,
    );
    const button = getByText('Remove Last Layout');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
