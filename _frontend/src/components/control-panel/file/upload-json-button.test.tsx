import { fireEvent, render, waitFor } from '@testing-library/react';
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

const { default: UploadJsonButton } = await import('./upload-json-button');

beforeEach(() => {
  onImportFileMock.mockReset();
});

describe('UploadJsonButton', () => {
  it('imports a valid uploaded JSON file', async () => {
    const { getByLabelText } = render(<UploadJsonButton />);
    const input = getByLabelText('Upload JSON') as HTMLInputElement;
    const payload = { items: [{ contentId: 'a' }], layouts: [] };
    const file = new File([JSON.stringify(payload)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImportFileMock).toHaveBeenCalledWith(payload);
    });
  });

  it('logs an error and does not import when the file contains invalid JSON', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByLabelText } = render(<UploadJsonButton />);
    const input = getByLabelText('Upload JSON') as HTMLInputElement;
    const file = new File(['{ not valid json'], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Error parsing JSON:',
        expect.any(Error),
      );
    });
    expect(onImportFileMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('ignores files that are not application/json', async () => {
    const { getByLabelText } = render(<UploadJsonButton />);
    const input = getByLabelText('Upload JSON') as HTMLInputElement;
    const file = new File(['not json'], 'data.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    // Give any (incorrect) async read a tick to have fired before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onImportFileMock).not.toHaveBeenCalled();
  });

  it('activates the hidden file input when the label is clicked', () => {
    const { getByLabelText } = render(<UploadJsonButton />);
    const input = getByLabelText('Upload JSON') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.click(input.previousElementSibling as Element);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it('activates the hidden file input on Enter/Space and ignores other keys', () => {
    const { getByLabelText } = render(<UploadJsonButton />);
    const input = getByLabelText('Upload JSON') as HTMLInputElement;
    const label = input.previousElementSibling as HTMLLabelElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.keyDown(label, { key: 'a' });
    expect(clickSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(label, { key: 'Enter' });
    fireEvent.keyDown(label, { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();
  });
});
