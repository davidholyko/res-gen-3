import c from 'classnames';
import { useState } from 'react';

import type { ContentId } from '@/types/content-base-item';

import { MACRO_DRAG_MIME } from './restructure-palette-card';

type RestructurePaletteGapProps = {
  // True while any palette card is being dragged. When set, the gap opens
  // from a hairline into a roomy drop slot so it's easy to aim for -- a
  // 2px target between cards is fiddly to hit (specs/wysiwyg-staging.md).
  active: boolean;
  // Called with the dragged card's contentId when a card is dropped into
  // this gap. The parent decides where that lands in the palette order.
  onDropCard: (draggedId: ContentId) => void;
};

// A drop target sitting between (and after) the palette cards
// (specs/wysiwyg-staging.md). It's how you reorder the source list: drag a
// card into the gap where you want it. Collapsed to a hairline at rest so
// it adds no visible spacing; while a card is in flight (`active`) it opens
// into a dashed slot that makes room between the cards, and it fills in
// solid while a card is dragged directly over it, showing exactly where the
// drop will land. aria-hidden: it's a pointer-only affordance with no
// content of its own, so it stays out of the accessibility tree rather than
// announcing an empty element.
export default function RestructurePaletteGap({
  active,
  onDropCard,
}: RestructurePaletteGapProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      aria-hidden="true"
      data-testid="palette-gap"
      className={c('rounded transition-all', {
        'my-1 h-12 bg-cyan-100 outline outline-2 outline-dashed outline-cyan-400':
          isOver,
        'my-1 h-8 border border-dashed border-cyan-300 bg-cyan-50':
          active && !isOver,
        'h-0.5': !active && !isOver,
      })}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const draggedId = event.dataTransfer.getData(MACRO_DRAG_MIME);
        if (draggedId) onDropCard(draggedId as ContentId);
      }}
    />
  );
}
