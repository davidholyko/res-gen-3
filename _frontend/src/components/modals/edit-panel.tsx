import { useEffect, useRef } from 'react';

import EditorItem from '@/components/content/editor-item';
import { CONTENT_TYPE_LABELS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import { deriveZones } from '@/utils/derive-zones';

// Everything a block-picker entry needs to say about a block: the same
// plain-language type name the "+ Add block" menu uses, plus a snippet
// of the block's own text -- three "Experience" rows in one layout are
// indistinguishable without it.
export function blockSnippet(content: Record<string, unknown>): string {
  const firstString = Object.values(content).find(
    (value) => typeof value === 'string' && value.trim() !== '',
  ) as string | undefined;
  // AnyList content has no string values -- its keys are the text.
  const text = firstString ?? Object.keys(content)[0] ?? '';

  return text.length > 32 ? `${text.slice(0, 32)}…` : text;
}

// The form panel docked to the right of the live PDF preview
// (specs/edit-with-live-pdf-preview.md): the focused block's form on
// top, saving live through the exact same EditorItem/ContentForm path
// as the canvas's inline editor, and a picker below it for switching
// blocks without leaving the modal.
export default function EditPanel() {
  const { items, layouts, editingContentId, openEditingView } = useAppContext();

  const editingItem = items.find((item) => item.contentId === editingContentId);

  // Focus lands in the form, not on the modal shell -- the whole point
  // of the view is to start typing. Deferred a tick so it wins over
  // react-modal's own open-focus handling.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('form input, form textarea')
        ?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [editingContentId]);

  // One picker entry group per zone, mirroring how the canvas labels
  // layouts -- the same derivation the "Move to…" menu uses
  // (specs/move-block-between-layouts.md).
  const zones = deriveZones(layouts);

  return (
    <div
      ref={panelRef}
      className="w-[26rem] shrink-0 h-full overflow-y-auto border-l border-gray-300 bg-white p-3 flex flex-col gap-4"
    >
      {editingItem ? (
        <EditorItem key={editingItem.contentId} {...editingItem} />
      ) : (
        // Defensive: reachable only if the editing target vanishes from
        // state out from under an open session.
        <p className="text-sm text-gray-600">
          Pick a block below to edit it beside the preview.
        </p>
      )}

      <nav aria-label="Blocks">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
          Blocks
        </p>
        <div className="flex flex-col gap-2">
          {zones.map((zone) => {
            const zoneItems = items.filter(
              (item) => item.layoutId === zone.layoutId,
            );
            if (zoneItems.length === 0) return null;

            return (
              <div key={zone.key}>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  {zone.label}
                </p>
                <ul>
                  {zoneItems.map((item) => {
                    const snippet = blockSnippet(
                      item.content as Record<string, unknown>,
                    );
                    const isCurrent = item.contentId === editingContentId;

                    return (
                      <li key={item.contentId}>
                        <button
                          type="button"
                          aria-current={isCurrent ? 'true' : undefined}
                          className={
                            isCurrent
                              ? 'w-full text-left text-sm px-2 py-1 rounded bg-cyan-100 font-bold'
                              : 'w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100'
                          }
                          onClick={() => openEditingView(item.contentId)}
                        >
                          {CONTENT_TYPE_LABELS[item.contentType]}
                          {snippet && (
                            <span className="text-gray-600 font-normal">
                              {' '}
                              — {snippet}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
