import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toggleEditorMock } = vi.hoisted(() => ({
  toggleEditorMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ toggleEditor: toggleEditorMock }),
  };
});

const { default: ToggleEditorPanelButton } =
  await import('./toggle-editor-panel-button');

beforeEach(() => {
  toggleEditorMock.mockReset();
});

describe('ToggleEditorPanelButton', () => {
  it('calls toggleEditor on click', () => {
    const { getByText } = render(<ToggleEditorPanelButton />);

    fireEvent.click(getByText('Toggle Editor'));

    expect(toggleEditorMock).toHaveBeenCalledTimes(1);
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <ToggleEditorPanelButton
        className="extra"
        role="menuitem"
        tabIndex={0}
      />,
    );
    const button = getByText('Toggle Editor');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
