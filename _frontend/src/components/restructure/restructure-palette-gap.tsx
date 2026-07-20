import c from 'classnames';
import { useState } from 'react';

import type { ContentId } from '@/types/content-base-item';

import { MACRO_DRAG_MIME } from './restructure-palette-card';

type RestructurePaletteGapProps = {
  // Called with the dragged card's contentId when a card is dropped into
  // this gap. The parent decides where that lands in the palette order.
  onDropCard: (draggedId: ContentId) => void;
};

// A thin drop target sitting between (and after) the palette cards
// (specs/wysiwyg-staging.md). It's how you reorder the source list: drag a
// card into the gap where you want it. Collapsed to a hairline at rest so
// it doesn't add visible spacing; it thickens and highlights only while a
// card is dragged over it, showing exactly where the drop will land.
// aria-hidden: it's a pointer-only affordance with no content of its own,
// so it stays out of the accessibility tree rather than announcing an
// empty element.
export default function RestructurePaletteGap({
  onDropCard,
}: RestructurePaletteGapProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      aria-hidden="true"
      data-testid="palette-gap"
      className={c('rounded transition-all', {
        'my-0.5 h-6 bg-cyan-100 outline outline-2 outline-dashed outline-cyan-400':
          isOver,
        'h-0.5': !isOver,
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
