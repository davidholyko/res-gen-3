import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onImportFileMock, pushUndoSnapshotMock } = vi.hoisted(() => ({
  onImportFileMock: vi.fn(),
  pushUndoSnapshotMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onImportFile: onImportFileMock,
      pushUndoSnapshot: pushUndoSnapshotMock,
    }),
  };
});

const { default: ResetResumeButton } = await import('./reset-resume-button');

beforeEach(() => {
  onImportFileMock.mockReset();
  pushUndoSnapshotMock.mockReset();
});

describe('ResetResumeButton', () => {
  it('pushes an undo snapshot and imports the example resume when confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByText } = render(<ResetResumeButton />);

    fireEvent.click(getByText('Reset to Example'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Reset to the example resume? This will replace everything.',
    );
    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Resume reset');

    // The example content wholesale: the prepopulated items in their
    // prepopulated layout.
    const imported = onImportFileMock.mock.calls[0][0];
    expect(imported.layouts).toHaveLength(1);
    expect(imported.items.length).toBeGreaterThan(0);
    expect(
      imported.items.every(
        (item: { layoutId: string }) =>
          item.layoutId === imported.layouts[0].layoutId,
      ),
    ).toBe(true);
    confirmSpy.mockRestore();
  });

  it('does nothing when the confirmation is declined', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getByText } = render(<ResetResumeButton />);

    fireEvent.click(getByText('Reset to Example'));

    expect(pushUndoSnapshotMock).not.toHaveBeenCalled();
    expect(onImportFileMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <ResetResumeButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('Reset to Example');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
