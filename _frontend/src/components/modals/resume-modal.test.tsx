import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentId } from '@/types/content-base-item';

const { togglePdfModalMock, openEditingViewMock, contextState } = vi.hoisted(
  () => ({
    togglePdfModalMock: vi.fn(),
    openEditingViewMock: vi.fn(),
    contextState: {
      isModalOpen: false,
      editingContentId: null as string | null,
      pageCount: null as number | null,
    },
  }),
);
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      isModalOpen: contextState.isModalOpen,
      editingContentId: contextState.editingContentId as ContentId | null,
      togglePdfModal: togglePdfModalMock,
      openEditingView: openEditingViewMock,
      onUpdate: vi.fn(),
      title: '2026-01-01-test.pdf',
      items: [
        {
          contentId: 'h1',
          contentType: 'HEADER',
          content: { header: 'Summary' },
          layoutId: 'l1',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'l1', layoutType: 'SINGLE' }],
    }),
  };
});

vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({
      instance: { loading: false, url: 'blob:mock-url', blob: null },
      pageCount: contextState.pageCount,
    }),
  };
});

const { default: ResumeModal } = await import('./resume-modal');

// Mirrors src/app/page.tsx's real DOM: ResumeModal only ever mounts inside
// the app's #res-gen root, which is what Modal.setAppElement('#res-gen')
// targets to aria-hide the background while the modal is open.
function renderModal() {
  return render(
    <div id="res-gen">
      <ResumeModal />
    </div>,
  );
}

function rerenderModal(rerender: (ui: React.ReactElement) => void) {
  rerender(
    <div id="res-gen">
      <ResumeModal />
    </div>,
  );
}

beforeEach(() => {
  togglePdfModalMock.mockReset();
  openEditingViewMock.mockReset();
  contextState.isModalOpen = false;
  contextState.editingContentId = null;
  contextState.pageCount = null;
});

afterEach(() => {
  // react-modal portals content onto document.body directly; make sure a
  // leftover open modal from one test doesn't bleed into the next.
  document.body.innerHTML = '';
});

describe('ResumeModal', () => {
  it('renders nothing when closed', () => {
    renderModal();

    expect(screen.queryByLabelText('Exit PDF View Button')).toBeNull();
  });

  it('renders the preview area and top bar when open, with no edit panel in view mode', () => {
    contextState.isModalOpen = true;
    renderModal();

    expect(screen.getByLabelText('Exit PDF View Button')).not.toBeNull();
    // The staged preview frame is present (double-buffered load).
    expect(
      document.querySelector('[data-testid="pdf-frame-staging"]'),
    ).not.toBeNull();
    expect(screen.queryByLabelText('Blocks')).toBeNull();
  });

  it('docks the edit panel beside the preview while a block is being edited', () => {
    contextState.isModalOpen = true;
    contextState.editingContentId = 'h1';
    renderModal();

    // The panel's form and picker are both present...
    expect(document.querySelector('input[name="header"]')).not.toBeNull();
    expect(screen.getByLabelText('Blocks')).not.toBeNull();
    // ...and the preview frame is still mounted, not covered/replaced.
    expect(
      document.querySelector('[data-testid="pdf-frame-staging"]'),
    ).not.toBeNull();
  });

  it('resets the page anchor to 1 on each fresh open', () => {
    contextState.isModalOpen = true;
    contextState.editingContentId = 'h1';
    contextState.pageCount = 3;
    const { rerender } = renderModal();

    fireEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText('Page 2 of 3')).not.toBeNull();

    contextState.isModalOpen = false;
    rerenderModal(rerender);
    contextState.isModalOpen = true;
    rerenderModal(rerender);

    expect(screen.getByText('Page 1 of 3')).not.toBeNull();
  });

  it('clamps the anchor when the document shrinks below it mid-session', () => {
    contextState.isModalOpen = true;
    contextState.editingContentId = 'h1';
    contextState.pageCount = 3;
    const { rerender } = renderModal();

    fireEvent.click(screen.getByLabelText('Next page'));
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText('Page 3 of 3')).not.toBeNull();

    contextState.pageCount = 2;
    rerenderModal(rerender);

    expect(screen.getByText('Page 2 of 2')).not.toBeNull();
  });

  it('aria-hides the app root once opened, matching Modal.setAppElement', () => {
    // Mirrors real usage: AppProvider's isModalOpen always starts false, so
    // ResumeModal's setAppElement effect has already registered #res-gen
    // by the time anything can flip isModalOpen to true. Mounting this
    // test already-open would race that registration against react-modal's
    // own mount-time open(), which isn't a case the real app can hit.
    const { rerender } = renderModal();

    contextState.isModalOpen = true;
    rerenderModal(rerender);

    expect(document.querySelector('#res-gen')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('closes on Escape while open', () => {
    contextState.isModalOpen = true;
    renderModal();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });

  it('removes the Escape listener once closed', () => {
    contextState.isModalOpen = true;
    const { rerender } = renderModal();

    contextState.isModalOpen = false;
    rerenderModal(rerender);
    togglePdfModalMock.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys while open', () => {
    contextState.isModalOpen = true;
    renderModal();

    fireEvent.keyDown(document, { key: 'a' });

    expect(togglePdfModalMock).not.toHaveBeenCalled();
  });

  it("closes via react-modal's own onRequestClose (e.g. an overlay click)", () => {
    contextState.isModalOpen = true;
    renderModal();

    const overlay = document.querySelector('.ReactModal__Overlay');
    fireEvent.click(overlay as Element);

    expect(togglePdfModalMock).toHaveBeenCalledWith(false);
  });

  it('has no automatically detectable accessibility violations while open, editing included', async () => {
    contextState.isModalOpen = true;
    contextState.editingContentId = 'h1';
    contextState.pageCount = 2;
    renderModal();

    // react-modal portals its content directly onto document.body, outside
    // testing-library's own render container, so scan the whole body.
    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});
