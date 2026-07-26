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

// A minimal item that fills zone `layoutId` -- what makes a layout
// visible on the canvas now that empty layouts are hidden
// (specs/continuous-page-canvas.md, Later change).
function itemIn(layoutId: string) {
  return {
    contentId: `item-${layoutId}`,
    contentType: 'HEADER',
    content: { header: 'x' },
    layoutId,
    layoutType: 'SINGLE',
  };
}

describe('LayoutManager', () => {
  it('renders a LayoutSingle for a SINGLE layout with content', () => {
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    contextState.items = [itemIn('a')];
    const { container } = renderLayoutManager();

    expect(container.querySelector('.layout-single')).not.toBeNull();
  });

  it('renders a LayoutDouble as two columns when either half has content', () => {
    contextState.layouts = [
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    // Only the left half is filled -- the whole two-column row still
    // renders (the empty half is blank space, matching the PDF).
    contextState.items = [itemIn('l')];
    const { container } = renderLayoutManager();

    expect(container.querySelectorAll('.layout-single')).toHaveLength(2);
  });

  it('hides an empty SINGLE layout instead of drawing a placeholder', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      { layoutId: 'b', layoutType: 'SINGLE' },
    ];
    contextState.items = [itemIn('a')];
    const { container } = renderLayoutManager();

    // Only the filled layout renders; the empty one is skipped entirely
    // (it stays manageable in the restructure view).
    expect(container.querySelectorAll('.layout-single')).toHaveLength(1);
  });

  it('hides a DOUBLE layout whose halves are both empty', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      {
        layoutId: 'd',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    contextState.items = [itemIn('a')];
    const { container } = renderLayoutManager();

    expect(container.querySelector('.layout-double')).toBeNull();
    expect(container.querySelectorAll('.layout-single')).toHaveLength(1);
  });

  it('shows the empty-state placeholder when there are no layouts', () => {
    contextState.layouts = [];
    const { getByText, container } = renderLayoutManager();

    expect(getByText(/Your resume is empty/)).not.toBeNull();
    expect(container.querySelector('.layout-single')).toBeNull();
  });

  it('shows the empty-state placeholder when every layout is empty', () => {
    // Content-empty, not just layout-empty: with all layouts hidden the
    // canvas would otherwise be a blank page with no way forward.
    contextState.layouts = [{ layoutId: 'a', layoutType: 'SINGLE' }];
    contextState.items = [];
    const { getByText, container } = renderLayoutManager();

    expect(getByText(/Your resume is empty/)).not.toBeNull();
    expect(container.querySelector('.layout-single')).toBeNull();
    // The white page surface waits for visible content too.
    expect(container.querySelector('#layout-manager')?.className).not.toContain(
      'editor-page-surface',
    );
  });

  it('renders each layout in order with no add controls', () => {
    contextState.layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      { layoutId: 'b', layoutType: 'SINGLE' },
    ];
    contextState.items = [itemIn('a'), itemIn('b')];
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
