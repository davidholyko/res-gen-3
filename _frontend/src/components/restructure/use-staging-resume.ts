import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { BLANK_CONTENT, CONTENT_TYPES, LAYOUTS } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';
import type { Zone } from '@/utils/derive-zones';

// Local, isolated working copy of the resume for the restructure view
// (specs/restructure-view.md). Nothing here touches the live resume until
// the view calls its Apply -- this hook only owns the *staging* layouts
// and items, seeded as a deep copy of the resume when the view opens
// ("copy of current" start, the resolved Open question). All operations
// are pure array rebuilds so React sees new references.

export type StagingResume = { layouts: LayoutItem[]; items: ContentAll[] };

// JSON round-trip clone: layouts/items are plain serializable data (it's
// exactly what localStorage stores), so this fully detaches the staging
// copy from the live arrays -- edits here can never mutate the resume.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeLayout(type: 'SINGLE' | 'DOUBLE'): LayoutItem {
  if (type === LAYOUTS.DOUBLE) {
    return {
      layoutId: uuidv4() as LayoutId,
      layoutType: LAYOUTS.DOUBLE,
      layoutLeftId: uuidv4(),
      layoutRightId: uuidv4(),
    };
  }
  return { layoutId: uuidv4() as LayoutId, layoutType: LAYOUTS.SINGLE };
}

// Every zone (layoutId) a layout owns: a SINGLE owns its own id, a DOUBLE
// owns both halves. Used to drop a layout's items when the layout itself
// is removed.
function zoneIdsOf(layout: LayoutItem): string[] {
  if (layout.layoutType === LAYOUTS.DOUBLE) {
    // layoutType isn't a literal discriminant, so the union doesn't
    // narrow to LayoutDouble; the half-ids are declared on it, cast past
    // the `string | undefined` the union view reports.
    return [layout.layoutLeftId as string, layout.layoutRightId as string];
  }
  return [layout.layoutId];
}

export function useStagingResume(initial: StagingResume) {
  const [layouts, setLayouts] = useState<LayoutItem[]>(() =>
    clone(initial.layouts),
  );
  const [items, setItems] = useState<ContentAll[]>(() => clone(initial.items));

  const addLayout = (type: 'SINGLE' | 'DOUBLE') => {
    setLayouts((prev) => [...prev, makeLayout(type)]);
  };

  const removeLayout = (layoutId: LayoutId) => {
    setLayouts((prev) => {
      const target = prev.find((l) => l.layoutId === layoutId);
      if (target) {
        const owned = new Set(zoneIdsOf(target));
        // Drop the removed layout's blocks too -- they have nowhere to
        // live once their zone is gone (mirrors the live app dropping
        // orphaned items).
        setItems((prevItems) =>
          prevItems.filter((item) => !owned.has(item.layoutId as string)),
        );
      }
      return prev.filter((l) => l.layoutId !== layoutId);
    });
  };

  // Reorder a layout box by one step. dir -1 is up, +1 is down; a no-op
  // at the ends.
  const moveLayout = (layoutId: LayoutId, dir: -1 | 1) => {
    setLayouts((prev) => {
      const index = prev.findIndex((l) => l.layoutId === layoutId);
      const target = index + dir;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Place a *copy* of a palette macro into a staging zone: a fresh
  // contentId plus the destination zone's layout fields, appended to the
  // end of that zone (copy semantics -- the source palette is untouched;
  // matches how moveContentToZone retags a block, minus the removal).
  const placeMacro = (source: ContentAll, zone: Zone) => {
    setItems((prev) => [
      ...prev,
      {
        ...source,
        contentId: uuidv4() as ContentId,
        layoutId: zone.layoutId,
        layoutType: zone.layoutType,
        layoutParentId: zone.layoutParentId,
      },
    ]);
  };

  // Create a brand-new *blank* block of a chosen type in a staging zone
  // (the "+ Add block" that used to live on the canvas now lives here,
  // specs/restructure-view.md). It starts empty (BLANK_CONTENT) and is
  // filled in on the canvas after Apply -- the restructure view has no
  // block form of its own.
  const addBlock = (zone: Zone, contentType: keyof typeof CONTENT_TYPES) => {
    setItems((prev) => [
      ...prev,
      {
        contentId: uuidv4() as ContentId,
        content: { ...BLANK_CONTENT[contentType] },
        contentType,
        layoutId: zone.layoutId,
        layoutType: zone.layoutType,
        layoutParentId: zone.layoutParentId,
        // The blank content's shape can't be proven to correlate with
        // contentType here (same looseness as AddBlockControl's onCreate).
      } as ContentAll,
    ]);
  };

  const removeItem = (contentId: ContentId) => {
    setItems((prev) => prev.filter((item) => item.contentId !== contentId));
  };

  // Reorder a placed macro within its own zone (swap with the nearest
  // same-zone neighbour in the given direction), skipping over any items
  // that belong to other zones in the flat array -- same zone-awareness
  // as the live app's Move up/down (specs/editor-redesign.md, Phase 7).
  const moveItem = (contentId: ContentId, dir: -1 | 1) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.contentId === contentId);
      if (index === -1) return prev;
      const zoneId = prev[index].layoutId;
      let neighbour = index + dir;
      while (
        neighbour >= 0 &&
        neighbour < prev.length &&
        prev[neighbour].layoutId !== zoneId
      ) {
        neighbour += dir;
      }
      if (neighbour < 0 || neighbour >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[neighbour]] = [next[neighbour], next[index]];
      return next;
    });
  };

  // Move a staging block so it sits just before `beforeId`, or at the end
  // of its zone when `beforeId` is null. This is what keeps the styled
  // preview in step with a palette-card reorder (specs/wysiwyg-staging.md):
  // the palette and staging share contentIds on open, so the same
  // (dragged, before) pair addresses both. Gracefully no-ops when the ids
  // aren't in staging (e.g. the block was removed, or is a placed copy the
  // palette never knew about).
  const reorderItem = (draggedId: ContentId, beforeId: ContentId | null) => {
    setItems((prev) => {
      const dragged = prev.find((item) => item.contentId === draggedId);
      if (!dragged) return prev;
      const next = prev.filter((item) => item.contentId !== draggedId);
      let at: number;
      if (beforeId !== null) {
        at = next.findIndex((item) => item.contentId === beforeId);
        if (at === -1) return prev;
      } else {
        const zoneItems = next.filter(
          (item) => item.layoutId === dragged.layoutId,
        );
        const last = zoneItems[zoneItems.length - 1];
        at = last ? next.indexOf(last) + 1 : next.length;
      }
      next.splice(at, 0, dragged);
      return next;
    });
  };

  const clear = () => {
    setLayouts([]);
    setItems([]);
  };

  return {
    layouts,
    items,
    addLayout,
    removeLayout,
    moveLayout,
    placeMacro,
    addBlock,
    removeItem,
    moveItem,
    reorderItem,
    clear,
  };
}
