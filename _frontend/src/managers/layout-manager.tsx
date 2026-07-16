import c from 'classnames';
import { Fragment, useCallback, useState } from 'react';

import EmptyLayoutState from '@/components/layouts/empty-layout-state';
import LayoutDouble from '@/components/layouts/layout-double';
import LayoutGapInserter from '@/components/layouts/layout-gap-inserter';
import LayoutHeader from '@/components/layouts/layout-header';
import LayoutSingle from '@/components/layouts/layout-single';
import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

export default function LayoutManager() {
  const { layouts, removeLayout, pushUndoSnapshot } = useAppContext();

  // Which layout is mid-remove-confirm, if any. Kept here (not inside
  // each LayoutHeader) so only one layout can be confirming at a time and
  // so the confirming id can also highlight that layout's region in the
  // preview -- showing exactly what "Remove layout" will delete before it
  // happens (specs/confirm-remove-layout.md).
  const [confirmingLayoutId, setConfirmingLayoutId] = useState<LayoutId | null>(
    null,
  );

  const confirmRemove = useCallback(
    (label: string, layoutId: LayoutId) => {
      // Keep the undo snapshot: the confirm gates the click, undo still
      // rescues a *confirmed* mistake (specs/undo-destructive-actions.md).
      pushUndoSnapshot(`${label} removed`);
      removeLayout(layoutId);
      setConfirmingLayoutId(null);
    },
    [pushUndoSnapshot, removeLayout],
  );

  return (
    <div
      id="layout-manager"
      // editor-page-surface only once there's a layout: the empty state
      // keeps its own card, so the white "paper" would look wrong wrapped
      // around it (specs/continuous-page-canvas.md).
      className={c('editor-page-container flex flex-col', {
        'editor-page-surface': layouts.length > 0,
      })}
    >
      {layouts.length === 0 && <EmptyLayoutState />}
      {layouts.map((layout, index) => {
        // Each layout is wrapped in a `group relative` shell so its
        // editing chrome -- the gutter toolbar (LayoutHeader) and the
        // hover-revealed add controls -- can key off `group-hover` /
        // `focus-within` and sit absolutely in the left margin without
        // disturbing the continuous page flow
        // (specs/continuous-page-canvas.md). The page padding now lives
        // on the container itself, so wrapping layouts no longer risks
        // dropping the old `> .layout-single` padding rule.
        const label = `Layout ${index + 1}`;
        const isConfirming = confirmingLayoutId === layout.layoutId;

        // While this layout's removal is being confirmed, ring + tint the
        // whole `group relative` shell -- that box wraps exactly the
        // layout content (LayoutSingle / LayoutDouble) that "Delete" will
        // take, so the highlight *is* the preview of what's being deleted
        // (specs/confirm-remove-layout.md).
        const wrapperClassName = c('group relative', {
          'rounded ring-2 ring-inset ring-red-400 bg-red-50': isConfirming,
        });

        const header = (
          <LayoutHeader
            label={label}
            index={index}
            isConfirming={isConfirming}
            onRequestRemove={() => setConfirmingLayoutId(layout.layoutId)}
            onCancelRemove={() => setConfirmingLayoutId(null)}
            onConfirmRemove={() => confirmRemove(label, layout.layoutId)}
          />
        );

        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <Fragment key={layout.layoutId}>
                <LayoutGapInserter index={index} />
                <div className={wrapperClassName}>
                  {header}
                  <LayoutSingle
                    layoutId={layout.layoutId}
                    layoutType={layout.layoutType}
                    addLayoutIndex={index + 1}
                  />
                </div>
              </Fragment>
            );
          }
          case LAYOUTS.DOUBLE: {
            if (!layout.layoutLeftId)
              throw new Error(`layout missing property 'layoutLeftId`);
            if (!layout.layoutRightId)
              throw new Error(`layout missing property 'layoutRightId`);

            return (
              <Fragment key={layout.layoutId}>
                <LayoutGapInserter index={index} />
                <div className={wrapperClassName}>
                  {header}
                  <LayoutDouble
                    layoutId={layout.layoutId}
                    layoutLeftId={layout.layoutLeftId}
                    layoutRightId={layout.layoutRightId}
                    addLayoutIndex={index + 1}
                  />
                </div>
              </Fragment>
            );
          }
          default:
            throw new Error(`Unsupported layout ${layout}`);
        }
      })}
      {layouts.length > 0 && <LayoutGapInserter index={layouts.length} />}
    </div>
  );
}
