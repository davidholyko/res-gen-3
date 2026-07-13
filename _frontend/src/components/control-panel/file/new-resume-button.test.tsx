import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onImportFileMock } = vi.hoisted(() => ({
  onImportFileMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ onImportFile: onImportFileMock }),
  };
});

const { default: NewResumeButton } = await import('./new-resume-button');

beforeEach(() => {
  onImportFileMock.mockReset();
});

describe('NewResumeButton', () => {
  it('clears items and layouts when the confirmation is accepted', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByText } = render(<NewResumeButton />);

    fireEvent.click(getByText('New'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Start a new resume? This will clear everything.',
    );
    expect(onImportFileMock).toHaveBeenCalledWith({ items: [], layouts: [] });
    confirmSpy.mockRestore();
  });

  it('does not clear anything when the confirmation is declined', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getByText } = render(<NewResumeButton />);

    fireEvent.click(getByText('New'));

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
