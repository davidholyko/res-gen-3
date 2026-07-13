import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock, contextState } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
  contextState: { isModalOpen: false },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      isModalOpen: contextState.isModalOpen,
      togglePdfModal: togglePdfModalMock,
    }),
  };
});

const { default: ResumeModal } = await import('./resume-modal');

beforeEach(() => {
  togglePdfModalMock.mockReset();
  contextState.isModalOpen = false;
});

afterEach(() => {
  // react-modal portals content onto document.body directly; make sure a
  // leftover open modal from one test doesn't bleed into the next.
  document.body.innerHTML = '';
});

describe('ResumeModal', () => {
  it('renders nothing when closed', () => {
    render(<ResumeModal>modal content</ResumeModal>);

    expect(screen.queryByText('modal content')).toBeNull();
  });

  it('renders its children and the top bar when open', () => {
    contextState.isModalOpen = true;
    render(<ResumeModal>modal content</ResumeModal>);

    expect(screen.getByText('modal content')).not.toBeNull();
    expect(screen.getByLabelText('Exit PDF View Button')).not.toBeNull();
  });

  it('closes on Escape while open', () => {
    contextState.isModalOpen = true;
    render(<ResumeModal>modal content</ResumeModal>);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });

  it('removes the Escape listener once closed', () => {
    contextState.isModalOpen = true;
    const { rerender } = render(<ResumeModal>modal content</ResumeModal>);

    contextState.isModalOpen = false;
    rerender(<ResumeModal>modal content</ResumeModal>);
    togglePdfModalMock.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys while open', () => {
    contextState.isModalOpen = true;
    render(<ResumeModal>modal content</ResumeModal>);

    fireEvent.keyDown(document, { key: 'a' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it("closes via react-modal's own onRequestClose (e.g. an overlay click)", () => {
    contextState.isModalOpen = true;
    render(<ResumeModal>modal content</ResumeModal>);

    const overlay = document.querySelector('.ReactModal__Overlay');
    fireEvent.click(overlay as Element);

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });
});
