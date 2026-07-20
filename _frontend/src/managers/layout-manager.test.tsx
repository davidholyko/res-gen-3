import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock, removeLayoutMock, pushUndoSnapshotMock, contextState } =
  vi.hoisted(() => ({
    addLayoutMock: vi.fn(),
    removeLayoutMock: vi.fn(),
    pushUndoSnapshotMock: vi.fn(),
    contextState: {
      layouts: [] as unknown[],
      items: [] as unknown[],
    },
  }));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      layouts: contextState.layouts,
      items: contextState.items,
      addLayout: addLayoutMock,
      addLayoutAt: vi.fn(),
      onCreate: vi.fn(),
      pushUndoSnapshot: pushUndoSnapshotMock,
      removeLayout: removeLayoutMock,
    }),
  };
});

const { default: LayoutManager } = await import('./layout-manager');

function renderLayoutManager() {
  return render(<LayoutManager />);
}

beforeEach(() => {
  addLayoutMock.mockReset();
  removeLayoutMock.mockReset();
  pushUndoSnapshotMock.mockReset();
  contextState.layouts = [];
  contextState.items = [];
});

describe('LayoutManager', () => {
  it('renders a LayoutSingle for a SINGLE layout, labelled "Layout 1"', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    const { container, getByText } = renderLayoutManager();

    expect(container.querySelector('.layout-single')).not.toBeNull();
    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('renders a LayoutDouble for a DOUBLE layout with both ids present, labelled once', () => {
    contextState.layouts = [
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    const { container, getByText } = renderLayoutManager();

    expect(container.querySelectorAll('.layout-single')).toHaveLength(2);
    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('numbers multiple layouts by position', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      { layoutId: 'b', layoutType: 'SINGLE' },
    ];
    const { getByText } = renderLayoutManager();

    expect(getByText('Layout 1')).not.toBeNull();
    expect(getByText('Layout 2')).not.toBeNull();
  });

  it('shows the empty-state placeholder when there are no layouts', () => {
    contextState.layouts = [];
    const { getByText, container } = renderLayoutManager();

    expect(getByText(/Your resume is empty/)).not.toBeNull();
    expect(container.querySelector('.layout-single')).toBeNull();
  });

  it('renders a gap inserter above every layout plus one after the last, and none when empty', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      { layoutId: 'b', layoutType: 'SINGLE' },
    ];
    const { container, rerender } = renderLayoutManager();
    expect(container.querySelectorAll('[data-gap-index]')).toHaveLength(3);

    // No inserters in the empty state -- EmptyLayoutState's CTA is the
    // one add-affordance there.
    contextState.layouts = [];
    rerender(<LayoutManager />);
    expect(container.querySelectorAll('[data-gap-index]')).toHaveLength(0);
  });

  it('removing a layout is a two-step confirm: first click highlights, Delete removes', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    const { container, getByLabelText } = renderLayoutManager();

    const wrapper = () => container.querySelector('.group.relative') as Element;
    expect(wrapper().className).not.toContain('ring-red-400');

    // First click only asks -- nothing is removed, and the layout's
    // region lights up so it's clear what will be deleted.
    fireEvent.click(getByLabelText('Remove Layout 1 Button'));
    expect(removeLayoutMock).not.toHaveBeenCalled();
    expect(wrapper().className).toContain('ring-red-400');

    // Confirming pushes the undo snapshot, then removes.
    fireEvent.click(getByLabelText('Confirm removing Layout 1 Button'));
    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Layout 1 removed');
    expect(removeLayoutMock).toHaveBeenCalledWith('a');
  });

  it('cancelling a remove clears the highlight and deletes nothing', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    const { container, getByLabelText } = renderLayoutManager();

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));
    expect(
      (container.querySelector('.group.relative') as Element).className,
    ).toContain('ring-red-400');

    fireEvent.click(getByLabelText('Cancel removing Layout 1'));
    expect(removeLayoutMock).not.toHaveBeenCalled();
    expect(
      (container.querySelector('.group.relative') as Element).className,
    ).not.toContain('ring-red-400');
  });

  it('throws if a DOUBLE layout is missing layoutLeftId', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'DOUBLE', layoutRightId: 'r' },
    ];

    expect(() => renderLayoutManager()).toThrow(
      "layout missing property 'layoutLeftId",
    );
  });

  it('throws if a DOUBLE layout is missing layoutRightId', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'DOUBLE', layoutLeftId: 'l' },
    ];

    expect(() => renderLayoutManager()).toThrow(
      "layout missing property 'layoutRightId",
    );
  });

  it('throws for an unsupported layout type', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'TRIPLE' }];

    expect(() => renderLayoutManager()).toThrow(/Unsupported layout/);
  });
});
