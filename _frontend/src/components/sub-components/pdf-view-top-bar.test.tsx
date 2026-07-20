import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { togglePdfViewMock, contextState } = vi.hoisted(() => ({
  togglePdfViewMock: vi.fn(),
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
      togglePdfView: togglePdfViewMock,
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

const { default: PdfViewTopBar } = await import('./pdf-view-top-bar');

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    anchorPage: 1,
    onAnchorPageChange: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  togglePdfViewMock.mockReset();
  contextState.editingContentId = null;
  contextState.pageCount = null;
});

describe('PdfViewTopBar', () => {
  it('closes the PDF view when the exit button is clicked', () => {
    const { getByLabelText } = render(<PdfViewTopBar {...baseProps()} />);

    fireEvent.click(getByLabelText('Exit PDF View Button'));

    expect(togglePdfViewMock).toHaveBeenCalledWith();
  });

  it('shows no page stepper in view-only mode, even on a multi-page document', () => {
    contextState.pageCount = 3;
    const { queryByLabelText } = render(<PdfViewTopBar {...baseProps()} />);

    expect(queryByLabelText('Previous page')).toBeNull();
  });

  it('shows no page stepper while editing a single-page document', () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 1;
    const { queryByLabelText } = render(<PdfViewTopBar {...baseProps()} />);

    expect(queryByLabelText('Previous page')).toBeNull();
  });

  it('steps the anchor page forward and back while editing a multi-page document', () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 3;
    const onAnchorPageChange = vi.fn();
    const { getByLabelText, getByText } = render(
      <PdfViewTopBar {...baseProps({ anchorPage: 2, onAnchorPageChange })} />,
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
      <PdfViewTopBar {...baseProps({ anchorPage: 1 })} />,
    );

    expect(getByLabelText('Previous page')).toBeDisabled();
    expect(getByLabelText('Next page')).not.toBeDisabled();

    rerender(<PdfViewTopBar {...baseProps({ anchorPage: 2 })} />);
    expect(getByLabelText('Previous page')).not.toBeDisabled();
    expect(getByLabelText('Next page')).toBeDisabled();
  });

  it('has no automatically detectable accessibility violations, stepper included', async () => {
    contextState.editingContentId = 'c1';
    contextState.pageCount = 3;
    const { container } = render(<PdfViewTopBar {...baseProps()} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
