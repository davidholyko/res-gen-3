import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ togglePdfModal: togglePdfModalMock }),
  };
});

const { default: PdfModalTopBar } = await import('./pdf-modal-top-bar');

beforeEach(() => {
  togglePdfModalMock.mockReset();
});

describe('PdfModalTopBar', () => {
  it('closes the PDF modal when the exit button is clicked', () => {
    const { getByLabelText } = render(<PdfModalTopBar />);

    fireEvent.click(getByLabelText('Exit PDF View Button'));

    expect(togglePdfModalMock).toHaveBeenCalledWith();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<PdfModalTopBar />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
