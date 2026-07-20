import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock, contextState } = vi.hoisted(() => ({
  addLayoutMock: vi.fn(),
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
    }),
  };
});

const { default: LayoutManager } = await import('./layout-manager');

function renderLayoutManager() {
  return render(<LayoutManager />);
}

beforeEach(() => {
  addLayoutMock.mockReset();
  contextState.layouts = [];
  contextState.items = [];
});

describe('LayoutManager', () => {
  it('renders a LayoutSingle for a SINGLE layout', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    const { container } = renderLayoutManager();

    expect(container.querySelector('.layout-single')).not.toBeNull();
  });

  it('renders a LayoutDouble as two columns for a DOUBLE layout with both ids present', () => {
    contextState.layouts = [
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    const { container } = renderLayoutManager();

    expect(container.querySelectorAll('.layout-single')).toHaveLength(2);
  });

  it('shows the empty-state placeholder when there are no layouts', () => {
    contextState.layouts = [];
    const { getByText, container } = renderLayoutManager();

    expect(getByText(/Your resume is empty/)).not.toBeNull();
    expect(container.querySelector('.layout-single')).toBeNull();
  });

  it('renders each layout in order with no add controls', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      { layoutId: 'b', layoutType: 'SINGLE' },
    ];
    const { container, queryByText } = renderLayoutManager();

    expect(container.querySelectorAll('.layout-single')).toHaveLength(2);
    // Add controls moved to the restructure view (specs/restructure-view.md).
    expect(queryByText('+ Add block')).toBeNull();
    expect(queryByText('+ Add layout')).toBeNull();
    expect(container.querySelector('[data-gap-index]')).toBeNull();
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
