import { render } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock, removeLayoutMock, contextState } = vi.hoisted(() => ({
  addLayoutMock: vi.fn(),
  removeLayoutMock: vi.fn(),
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
      removeLayout: removeLayoutMock,
    }),
  };
});

const { default: LayoutManager } = await import('./layout-manager');

function renderLayoutManager() {
  return render(
    <DndProvider backend={HTML5Backend}>
      <LayoutManager />
    </DndProvider>,
  );
}

beforeEach(() => {
  addLayoutMock.mockReset();
  removeLayoutMock.mockReset();
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
