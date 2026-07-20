import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUTS } from '@/constants';

const { addLayoutAtMock } = vi.hoisted(() => ({
  addLayoutAtMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      addLayoutAt: addLayoutAtMock,
    }),
  };
});

const { default: LayoutGapInserter } = await import('./layout-gap-inserter');

beforeEach(() => {
  addLayoutAtMock.mockReset();
});

describe('LayoutGapInserter', () => {
  it('offers one- and two-column inserters labelled with this gap position', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={2} />);

    expect(
      getByLabelText('Insert one-column layout at position 3'),
    ).not.toBeNull();
    expect(
      getByLabelText('Insert two-column layout at position 3'),
    ).not.toBeNull();
  });

  it('inserts a SINGLE layout at this gap index', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={1} />);

    fireEvent.click(getByLabelText('Insert one-column layout at position 2'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.SINGLE,
        layoutId: expect.any(String),
      }),
      1,
    );
  });

  it('inserts a DOUBLE layout with distinct left/right zone ids', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={0} />);

    fireEvent.click(getByLabelText('Insert two-column layout at position 1'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: expect.any(String),
        layoutRightId: expect.any(String),
      }),
      0,
    );
    const [layout] = addLayoutAtMock.mock.calls[0];
    expect(layout.layoutLeftId).not.toBe(layout.layoutRightId);
  });

  it('keeps the inserter buttons hidden until the gap is hovered', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={0} />);

    expect(
      getByLabelText('Insert one-column layout at position 1'),
    ).toHaveClass('opacity-0', 'group-hover:opacity-100');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<LayoutGapInserter index={0} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
