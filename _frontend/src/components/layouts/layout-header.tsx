import { useCallback } from 'react';

import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

type LayoutHeaderProps = {
  label: string;
  layoutId: LayoutId;
};

// Addresses two UX findings at once (specs/app-ux-improvements.md):
// layouts previously had no visible identifier on the canvas itself (only
// inside each editor card's "Add to layout" <select>), and the only way
// to remove one was the Edit menu's "Remove Last Layout" -- always the
// most recently added, never a specific one.
export default function LayoutHeader({ label, layoutId }: LayoutHeaderProps) {
  const { removeLayout } = useAppContext();

  const onRemove = useCallback(() => {
    if (
      window.confirm(`Remove ${label}? This will delete any content in it.`)
    ) {
      removeLayout(layoutId);
    }
  }, [label, layoutId, removeLayout]);

  return (
    <div className="flex items-center justify-between mt-3 mb-1 first:mt-0">
      {/* text-gray-600/text-red-700, not the lighter -500/-600: this row
          sits directly on the page's bg-gray-100 background (Finding 11),
          not a white card -- the lighter shades dropped just under 4.5:1
          against that background, caught by a real-browser axe scan. */}
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
        {label}
      </span>
      <button
        type="button"
        aria-label={`Remove ${label} Button`}
        title={`Remove ${label}`}
        className="text-xs text-red-700 hover:text-red-800 hover:underline"
        onClick={onRemove}
      >
        Remove layout
      </button>
    </div>
  );
}
