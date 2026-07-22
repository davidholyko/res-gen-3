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

  it('moves a block to another zone, retagged and appended at its end', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L2'), macro('c', 'L2')],
    });

    act(() => result.current.moveItemTo('a' as ContentId, zoneFor('L2')));

    // Same block (same id -- a move, not a copy), new zone tag, at the
    // end of the destination zone.
    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(result.current.items[2].layoutId).toBe('L2');
    expect(result.current.items).toHaveLength(3);
  });

  it('moves a block into an empty zone (lands at the end of the array)', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1')],
    });

    act(() => result.current.moveItemTo('a' as ContentId, zoneFor('L9')));

    expect(result.current.items[0].layoutId).toBe('L9');
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

  it('moves a block just before another (a gap drop), cross-zone included', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1'), macro('c', 'L2')],
    });

    // Drop c into the gap above b: exact position, retagged into L1.
    act(() =>
      result.current.moveItemTo(
        'c' as ContentId,
        zoneFor('L1'),
        'b' as ContentId,
      ),
    );

    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'a',
      'c',
      'b',
    ]);
    expect(result.current.items[1].layoutId).toBe('L1');
  });

  it('moves a block to the end of its own zone (trailing gap -> beforeId null)', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1'), macro('c', 'L1')],
    });

    act(() => result.current.moveItemTo('a' as ContentId, zoneFor('L1'), null));

    expect(result.current.items.map((i) => i.contentId)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('ignores a move of an unknown block, before an unknown target, or before itself', () => {
    const { result } = setup({
      layouts: [SINGLE],
      items: [macro('a', 'L1'), macro('b', 'L1')],
    });

    // Dragged id isn't in staging (e.g. a stale drag payload) -> no change.
    act(() =>
      result.current.moveItemTo(
        'ghost' as ContentId,
        zoneFor('L1'),
        'a' as ContentId,
      ),
    );
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'b']);

    // Target id isn't in staging -> leave the order alone.
    act(() =>
      result.current.moveItemTo(
        'a' as ContentId,
        zoneFor('L1'),
        'ghost' as ContentId,
      ),
    );
    expect(result.current.items.map((i) => i.contentId)).toEqual(['a', 'b']);

    // Dropping a card "before itself" is a no-op, not a self-splice.
    act(() =>
      result.current.moveItemTo(
        'a' as ContentId,
        zoneFor('L1'),
        'a' as ContentId,
      ),
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
