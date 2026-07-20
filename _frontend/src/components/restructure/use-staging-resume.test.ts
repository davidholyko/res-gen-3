import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';
import type { Zone } from '@/utils/derive-zones';

import { useStagingResume } from './use-staging-resume';

const SINGLE: LayoutItem = {
  layoutId: 'L1' as LayoutId,
  layoutType: 'SINGLE',
};

function macro(id: string, layoutId: string): ContentAll {
  return {
    contentId: id as ContentId,
    contentType: 'HEADER',
    content: { header: id },
    layoutId: layoutId as LayoutId,
    layoutType: 'SINGLE',
  } as ContentAll;
}

const zoneFor = (layoutId: string): Zone => ({
  key: layoutId,
  label: layoutId,
  layoutId: layoutId as LayoutId,
  layoutType: 'SINGLE',
});

function setup(initial?: { layouts: LayoutItem[]; items: ContentAll[] }) {
  return renderHook(() =>
    useStagingResume(initial ?? { layouts: [SINGLE], items: [] }),
  );
}

describe('useStagingResume', () => {
  it('seeds from a deep copy, not the passed arrays', () => {
    const layouts = [SINGLE];
    const { result } = setup({ layouts, items: [] });
    expect(result.current.layouts).toEqual(layouts);
    expect(result.current.layouts).not.toBe(layouts);
  });

  it('adds a SINGLE and a DOUBLE box, the DOUBLE carrying both half ids', () => {
    const { result } = setup({ layouts: [], items: [] });

    act(() => result.current.addLayout('SINGLE'));
    act(() => result.current.addLayout('DOUBLE'));

    expect(result.current.layouts).toHaveLength(2);
    expect(result.current.layouts[0].layoutType).toBe('SINGLE');
    const dbl = result.current.layouts[1];
    expect(dbl.layoutType).toBe('DOUBLE');
    expect(dbl.layoutLeftId).toBeTruthy();
    expect(dbl.layoutRightId).toBeTruthy();
  });

  it('removes a box and drops the blocks that lived in it', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1')],
    });

    act(() => result.current.removeLayout('L1' as LayoutId));

    expect(result.current.layouts).toHaveLength(0);
    expect(result.current.items).toHaveLength(0);
  });

  it('removes a DOUBLE box and drops blocks from both halves', () => {
    const dbl: LayoutItem = {
      layoutId: 'D1' as LayoutId,
      layoutType: 'DOUBLE',
      layoutLeftId: 'DL',
      layoutRightId: 'DR',
    };
    const { result } = setup({
      layouts: [dbl],
      items: [macro('l', 'DL'), macro('r', 'DR'), macro('keep', 'other')],
    });

    act(() => result.current.removeLayout('D1' as LayoutId));

    expect(result.current.layouts).toHaveLength(0);
    expect(result.current.items.map((i) => i.contentId)).toEqual(['keep']);
  });

  it('removing an unknown box id is a no-op', () => {
    const { result } = setup({ layouts: [SINGLE], items: [macro('a', 'L1')] });

    act(() => result.current.removeLayout('nope' as LayoutId));

    expect(result.current.layouts).toHaveLength(1);
    expect(result.current.items).toHaveLength(1);
  });

  it('moves a box up and down, and no-ops at the ends or for unknown ids', () => {
    const second: LayoutItem = {
      layoutId: 'L2' as LayoutId,
      layoutType: 'SINGLE',
    };
    const { result } = setup({ layouts: [SINGLE, second], items: [] });

    act(() => result.current.moveLayout('L2' as LayoutId, -1));
    expect(result.current.layouts.map((l) => l.layoutId)).toEqual(['L2', 'L1']);

    act(() => result.current.moveLayout('L2' as LayoutId, -1)); // already first
    expect(result.current.layouts.map((l) => l.layoutId)).toEqual(['L2', 'L1']);

    act(() => result.current.moveLayout('L2' as LayoutId, 1));
    expect(result.current.layouts.map((l) => l.layoutId)).toEqual(['L1', 'L2']);

    act(() => result.current.moveLayout('unknown' as LayoutId, 1));
    expect(result.current.layouts.map((l) => l.layoutId)).toEqual(['L1', 'L2']);
  });

  it('places a copy of a macro with a fresh id and the zone fields', () => {
    const source = macro('orig', 'somewhere');
    const { result } = setup({ layouts: [SINGLE], items: [] });

    act(() => result.current.placeMacro(source, zoneFor('L1')));

    expect(result.current.items).toHaveLength(1);
    const placed = result.current.items[0];
    expect(placed.contentId).not.toBe('orig');
    expect(placed.layoutId).toBe('L1');
    expect(placed.content).toEqual(source.content);
  });

  it('adds a new blank block of a chosen type to a zone', () => {
    const { result } = setup({ layouts: [SINGLE], items: [] });

    act(() => result.current.addBlock(zoneFor('L1'), 'HEADER'));

    expect(result.current.items).toHaveLength(1);
    const added = result.current.items[0];
    expect(added.contentType).toBe('HEADER');
    expect(added.content).toEqual({ header: '' });
    expect(added.layoutId).toBe('L1');
    expect(added.contentId).toBeTruthy();
  });

  it('removes a placed macro by id', () => {
    const { result } = setup({ layouts: [SINGLE], items: [macro('a', 'L1')] });

    act(() => result.current.removeItem('a' as ContentId));

    expect(result.current.items).toHaveLength(0);
  });

  it('reorders a macro within its zone, skipping items in other zones', () => {
    // Flat order [a(L1), x(L2), b(L1)] -- b's same-zone neighbour is a,
    // not the adjacent x.
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('x', 'L2'), macro('b', 'L1')],
    });

    act(() => result.current.moveItem('b' as ContentId, -1));

    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'b',
      'x',
      'a',
    ]);
  });

  it('is a no-op moving a macro with no same-zone neighbour, or an unknown id', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('x', 'L2')],
    });

    act(() => result.current.moveItem('a' as ContentId, -1)); // nothing above in L1
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'x']);

    act(() => result.current.moveItem('missing' as ContentId, 1));
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'x']);
  });

  it('reorders a block before another, and to the end of its zone', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1'), macro('c', 'L1')],
    });

    // Move c before a (drop into a's gap).
    act(() => result.current.reorderItem('c' as ContentId, 'a' as ContentId));
    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'c',
      'a',
      'b',
    ]);

    // Move c to the end of its zone (trailing gap -> beforeId null).
    act(() => result.current.reorderItem('c' as ContentId, null));
    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('reorders a zone’s only block to the end (empty-zone insertion path)', () => {
    // 'a' is the sole block in L1; with no L1 neighbour, it lands at the end
    // of the flat array (after the L2 block). Within its own zone -- all the
    // preview groups by -- it's still the only block, so the render is
    // unchanged; only the flat position moves.
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('x', 'L2')],
    });

    act(() => result.current.reorderItem('a' as ContentId, null));

    expect(result.current.items.map((i) => i.contentId)).toEqual(['x', 'a']);
  });

  it('ignores a reorder of an unknown block, or before an unknown target', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1')],
    });

    // Dragged id isn't in staging (e.g. already removed) -> no change.
    act(() =>
      result.current.reorderItem('ghost' as ContentId, 'a' as ContentId),
    );
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'b']);

    // Target id isn't in staging -> leave the order alone.
    act(() =>
      result.current.reorderItem('a' as ContentId, 'ghost' as ContentId),
    );
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'b']);
  });

  it('clears all boxes and macros', () => {
    const { result } = setup({ layouts: [SINGLE], items: [macro('a', 'L1')] });

    act(() => result.current.clear());

    expect(result.current.layouts).toHaveLength(0);
    expect(result.current.items).toHaveLength(0);
  });
});
