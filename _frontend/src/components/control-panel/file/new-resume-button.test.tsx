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

const { default: NewResumeButton } = await import('./new-resume-button');

beforeEach(() => {
  onImportFileMock.mockReset();
  pushUndoSnapshotMock.mockReset();
});

describe('NewResumeButton', () => {
  it('pushes an undo snapshot and clears items/layouts when the confirmation is accepted', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByText } = render(<NewResumeButton />);

    fireEvent.click(getByText('New'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Start a new resume? This will clear everything.',
    );
    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Resume cleared');
    expect(onImportFileMock).toHaveBeenCalledWith({ items: [], layouts: [] });
    confirmSpy.mockRestore();
  });

  it('does not clear anything when the confirmation is declined', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getByText } = render(<NewResumeButton />);

    fireEvent.click(getByText('New'));

    expect(pushUndoSnapshotMock).not.toHaveBeenCalled();
    expect(onImportFileMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('forwards className, role, and tabIndex', () => {
    const { getByText } = render(
      <NewResumeButton className="extra" role="menuitem" tabIndex={0} />,
    );
    const button = getByText('New');

    expect(button).toHaveClass('extra');
    expect(button).toHaveAttribute('role', 'menuitem');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
