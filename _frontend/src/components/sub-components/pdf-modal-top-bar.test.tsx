import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfModalMock, contextState } = vi.hoisted(() => ({
  togglePdfModalMock: vi.fn(),
  contextState: {
    editingContentId: null as string | null,
    pageCount: null as number | null,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      togglePdfModal: togglePdfModalMock,
      editingContentId: contextState.editingContentId,
    }),
  };
});
vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({ pageCount: contextState.pageCount }),
  };
});

const { default: PdfModalTopBar } = await import('./pdf-modal-top-bar');

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    anchorPage: 1,
    onAnchorPageChange: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  togglePdfModalMock.mockReset();
  contextState.editingContentId = null;
  contextState.pageCount = null;
});

describe('PdfModalTopBar', () => {
  it('closes the PDF modal when the exit button is clicked', () => {
    const { getByLabelText } = render(<PdfModalTopBar {...baseProps()} />);

    fireEvent.click(getByLabelText('Exit PDF View Button'));

    expect(togglePdfModalMock).toHaveBeenCalledWith();
  });

  it('shows no page stepper in view-only mode, even on a multi-page document', () => {
    contextState.pageCount = 3;
    const { queryByLabelText } = render(<PdfModalTopBar {...baseProps()} />);

    expect(queryByLabelText('Previous page')).toBeNull();
  });

  it('shows no page stepper while editing a single-page document', () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 1;
    const { queryByLabelText } = render(<PdfModalTopBar {...baseProps()} />);

    expect(queryByLabelText('Previous page')).toBeNull();
  });

  it('steps the anchor page forward and back while editing a multi-page document', () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 3;
    const onAnchorPageChange = vi.fn();
    const { getByLabelText, getByText } = render(
      <PdfModalTopBar {...baseProps({ anchorPage: 2, onAnchorPageChange })} />,
    );

    expect(getByText('Page 2 of 3')).not.toBeNull();

    fireEvent.click(getByLabelText('Next page'));
    expect(onAnchorPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(getByLabelText('Previous page'));
    expect(onAnchorPageChange).toHaveBeenCalledWith(1);
  });

  it('disables stepping past either end of the document', () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 2;
    const { getByLabelText, rerender } = render(
      <PdfModalTopBar {...baseProps({ anchorPage: 1 })} />,
    );

    expect(getByLabelText('Previous page')).toBeDisabled();
    expect(getByLabelText('Next page')).not.toBeDisabled();

    rerender(<PdfModalTopBar {...baseProps({ anchorPage: 2 })} />);
    expect(getByLabelText('Previous page')).not.toBeDisabled();
    expect(getByLabelText('Next page')).toBeDisabled();
  });

  it('has no automatically detectable accessibility violations, stepper included', async () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 3;
    const { container } = render(<PdfModalTopBar {...baseProps()} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
