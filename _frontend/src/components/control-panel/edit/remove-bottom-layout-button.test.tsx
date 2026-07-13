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
  it('calls popLayout on click', () => {
    const { getByText } = render(<RemoveBottomLayoutButton />);

    fireEvent.click(getByText('Remove Last Layout'));

    expect(popLayoutMock).toHaveBeenCalledTimes(1);
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
