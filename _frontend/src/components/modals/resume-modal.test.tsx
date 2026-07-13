import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
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

// Mirrors src/app/page.tsx's real DOM: ResumeModal only ever mounts inside
// the app's #res-gen root, which is what Modal.setAppElement('#res-gen')
// targets to aria-hide the background while the modal is open.
function renderModal(children: React.ReactNode) {
  return render(<div id="res-gen">{children}</div>);
}

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
    renderModal(<ResumeModal>modal content</ResumeModal>);

    expect(screen.queryByText('modal content')).toBeNull();
  });

  it('renders its children and the top bar when open', () => {
    contextState.isModalOpen = true;
    renderModal(<ResumeModal>modal content</ResumeModal>);

    expect(screen.getByText('modal content')).not.toBeNull();
    expect(screen.getByLabelText('Exit PDF View Button')).not.toBeNull();
  });

  it('aria-hides the app root once opened, matching Modal.setAppElement', () => {
    // Mirrors real usage: AppProvider's isModalOpen always starts false, so
    // ResumeModal's setAppElement effect has already registered #res-gen
    // by the time anything can flip isModalOpen to true. Mounting this
    // test already-open would race that registration against react-modal's
    // own mount-time open(), which isn't a case the real app can hit.
    const { rerender } = renderModal(<ResumeModal>modal content</ResumeModal>);

    contextState.isModalOpen = true;
    rerender(
      <div id="res-gen">
        <ResumeModal>modal content</ResumeModal>
      </div>,
    );

    expect(document.querySelector('#res-gen')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('closes on Escape while open', () => {
    contextState.isModalOpen = true;
    renderModal(<ResumeModal>modal content</ResumeModal>);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });

  it('removes the Escape listener once closed', () => {
    contextState.isModalOpen = true;
    const { rerender } = renderModal(<ResumeModal>modal content</ResumeModal>);

    contextState.isModalOpen = false;
    rerender(
      <div id="res-gen">
        <ResumeModal>modal content</ResumeModal>
      </div>,
    );
    togglePdfModalMock.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys while open', () => {
    contextState.isModalOpen = true;
    renderModal(<ResumeModal>modal content</ResumeModal>);

    fireEvent.keyDown(document, { key: 'a' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it("closes via react-modal's own onRequestClose (e.g. an overlay click)", () => {
    contextState.isModalOpen = true;
    renderModal(<ResumeModal>modal content</ResumeModal>);

    const overlay = document.querySelector('.ReactModal__Overlay');
    fireEvent.click(overlay as Element);

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });

  it('has no automatically detectable accessibility violations while open', async () => {
    contextState.isModalOpen = true;
    renderModal(<ResumeModal>modal content</ResumeModal>);

    // react-modal portals its content directly onto document.body, outside
    // testing-library's own render container, so scan the whole body.
    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});
