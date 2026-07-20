import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import { CONTENT_TYPES, LAYOUTS } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';
import localStorageUtil from '@/utils/localstorage-util';
import {
  toSlugCase,
  toYearMonthDayFormat,
} from '@/utils/string-transform-util';

type FileDropValue = { items: ContentAll[]; layouts: LayoutItem[] };

export enum MOVE_ACTION {
  MACRO_UP = 'MACRO_UP',
  MACRO_DOWN = 'MACRO_DOWN',
  LAYOUT_NEXT = 'LAYOUT_NEXT',
  LAYOUT_PREV = 'LAYOUT_PREV',
}

export type UndoSnapshot = {
  items: ContentAll[];
  layouts: LayoutItem[];
  description: string;
};

export type AppContextType = {
  /**
   * title refers to the name of the PDF when a user downloads from browser
   */
  title: string;
  isPdfViewOpen: boolean; // maybe move to pdf preview context
  /**
   * Whether the side-by-side restructure view is open -- the editor
   * swaps the normal canvas for a two-pane "rebuild the layout" surface
   * while true (specs/restructure-view.md).
   */
  isRestructuring: boolean;
  toggleRestructure: (value?: boolean) => void;
  items: ContentAll[]; // rename to contentItems
  layouts: LayoutItem[];
  onImportFile: ({ items, layouts }: FileDropValue) => void;
  onCreate: (item: ContentAll) => void;
  onUpdate: (item: ContentAll) => void;
  onDelete: (item: Pick<ContentAll, 'contentId'>) => void;
  onMove: (action: MOVE_ACTION, contentId: ContentId) => void;
  /**
   * Reassigns a block to another zone -- a whole SINGLE layout or one
   * half of a DOUBLE -- and drops it at the end of that zone. The one
   * cross-zone move (onMove only reorders within a zone); powers the
   * block toolbar's "Move to…" menu
   * (specs/move-block-between-layouts.md).
   */
  moveContentToZone: (
    contentId: ContentId,
    zone: {
      layoutId: LayoutId;
      layoutType: keyof typeof LAYOUTS;
      layoutParentId?: LayoutId;
    },
  ) => void;
  togglePdfView: (value?: boolean) => void;
  /**
   * The block whose form is docked beside the live PDF preview, or null
   * when the PDF view is closed / in view-only mode
   * (specs/edit-with-live-pdf-preview.md).
   */
  editingContentId: ContentId | null;
  /**
   * The block whose form is docked in the canvas-side edit panel
   * (specs/canvas-edit-panel.md) -- the single source of truth for
   * "which block is focused on the canvas", derived by every BaseMacro
   * instead of each keeping its own local focus flag.
   */
  canvasEditingContentId: ContentId | null;
  focusCanvasBlock: (contentId: ContentId) => void;
  /**
   * Clears canvas focus only if `contentId` still owns it -- so a stale
   * blur from block A can never stomp a fresh focus on block B.
   */
  blurCanvasBlock: (contentId: ContentId) => void;
  /**
   * Opens the editing view on a block (or switches blocks if it's
   * already open). The first open of a session captures the pre-session
   * state; closing the PDF view pushes it as a "Block edited" undo
   * snapshot -- but only if something was actually saved meanwhile.
   */
  openEditingView: (contentId: ContentId) => void;
  /**
   * The contentId most recently created via onCreate -- lets the newly
   * added block scroll itself into view and reveal its edit controls,
   * since it can land in a layout that's off-screen with no other
   * indication anything happened (a real UX complaint, not hypothetical).
   */
  lastCreatedContentId: ContentId | null;
  undoSnapshot: UndoSnapshot | null;
  pushUndoSnapshot: (description: string) => void;
  performUndo: () => void;
  dismissUndo: () => void;
};

// No default value: createContext(fullDefaultObject) would make the
// "must be used within a Provider" guard in useAppContext() below
// permanently unreachable, since useContext() would never see `undefined`.
const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [layouts, setLayouts] = useState<LayoutItem[]>(
    localStorageUtil.layouts,
  );
  const [items, setItems] = useState<ContentAll[]>(localStorageUtil.items);
  const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [editingContentId, setEditingContentId] = useState<ContentId | null>(
    null,
  );
  const [canvasEditingContentId, setCanvasEditingContentId] =
    useState<ContentId | null>(null);
  // Pre-session state, captured on the first openEditingView of a
  // session and pushed as the undo snapshot when the PDF view closes --
  // push-on-close rather than push-on-open/first-save so the toast is
  // actually visible (and its auto-dismiss window running) when the
  // user is back where they can click it, not hidden behind the PDF view
  // (specs/edit-with-live-pdf-preview.md).
  const editSessionRef = useRef<{
    items: ContentAll[];
    layouts: LayoutItem[];
  } | null>(null);
  const [lastCreatedContentId, setLastCreatedContentId] =
    useState<ContentId | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);

  // Store data in local storage whenever it changes. (Older saves also
  // carried an isEditorVisible key for the retired Template ribbon's
  // visibility toggle -- still readable, just ignored and no longer
  // written.)
  useEffect(() => {
    localStorageUtil.data = { items, layouts };
  }, [items, layouts]);

  useEffect(() => {
    // Reconciles `items` against `layouts` (e.g. when a layout goes
    // away, so orphaned items are dropped). `items` is genuinely mutable
    // state elsewhere (onCreate/onUpdate/onDelete/onMove all setItems
    // directly), not a pure derived view, so this can't just be computed
    // at render time without also touching those call sites. Preserved
    // as-is during the res-gen-2 port; revisit once PR 2's tests can
    // verify a render-time-derivation refactor is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prevItems) => {
      const filtered = prevItems.filter((item) => {
        return layouts.some((layout) => {
          return layout.layoutId === item.layoutId;
        });
      });

      // Bail out with the same reference when nothing was orphaned --
      // .filter() always allocates a new array, which otherwise churns
      // `items`'s identity on every mount/layouts change even when
      // nothing actually changed, spuriously firing anything that treats
      // an `items` identity change as "a save happened" (SavedIndicator,
      // Finding 8).
      return filtered.length === prevItems.length ? prevItems : filtered;
    });
  }, [layouts]);

  // Zone-aware (specs/editor-redesign.md, Phase 7): "move up/down" only
  // ever swaps an item with the nearest *other* item sharing its zone
  // (layoutId/layoutType/layoutParentId), never simply the adjacent
  // flat-array index. The flat `items` array interleaves every zone's
  // content, so the old adjacent-index splice could silently reorder an
  // item relative to a *different* layout's content -- invisible on the
  // canvas (each zone re-filters at render time) until enough presses
  // finally crossed a same-zone neighbor.
  const onMove = useCallback(
    (action: MOVE_ACTION, contentId: ContentId) => {
      switch (action) {
        case MOVE_ACTION.MACRO_UP:
        case MOVE_ACTION.MACRO_DOWN: {
          const foundIndex = items.findIndex((i) => i.contentId === contentId);
          const item = items[foundIndex];
          const isSameZone = (other: ContentAll) =>
            other.layoutId === item.layoutId &&
            other.layoutType === item.layoutType &&
            other.layoutParentId === item.layoutParentId;

          const step = action === MOVE_ACTION.MACRO_UP ? -1 : 1;
          let neighborIndex = -1;
          for (
            let i = foundIndex + step;
            i >= 0 && i < items.length;
            i += step
          ) {
            if (isSameZone(items[i])) {
              neighborIndex = i;
              break;
            }
          }

          // Already first/last within its own zone: nothing to move
          // past -- a no-op, not a silent cross-zone reorder, and
          // (crucially) no undo snapshot: a toast offering to "undo"
          // nothing would also clobber a real, still-pending snapshot.
          if (neighborIndex === -1) break;

          // Snapshot pushed here, not at the call site: this is the one
          // place that knows whether the press is a real move
          // (specs/plain-language-labels-and-move-undo.md).
          setUndoSnapshot({ items, layouts, description: 'Block moved' });

          // A positional swap keeps every other zone's relative order
          // untouched, whereas a splice would shift items between the
          // two positions.
          const newItems = [...items];
          [newItems[foundIndex], newItems[neighborIndex]] = [
            newItems[neighborIndex],
            newItems[foundIndex],
          ];
          setItems(newItems);
          break;
        }
        default:
          throw new Error(`Unsupported move action ${action}`);
      }
    },
    [items, layouts],
  );

  const moveContentToZone = useCallback(
    (
      contentId: ContentId,
      zone: {
        layoutId: LayoutId;
        layoutType: keyof typeof LAYOUTS;
        layoutParentId?: LayoutId;
      },
    ) => {
      const foundIndex = items.findIndex((i) => i.contentId === contentId);
      const item = items[foundIndex];

      // Undo snapshot before the move, same as onMove / delete
      // (specs/undo-destructive-actions.md).
      setUndoSnapshot({ items, layouts, description: 'Block moved' });

      // Re-tag with the destination zone and re-append at the end of the
      // flat array -- since a zone renders its items in array order, that
      // lands the block last in its new zone while every other zone's
      // order is untouched (the same append onCreate does).
      const moved = {
        ...item,
        layoutId: zone.layoutId,
        layoutType: zone.layoutType,
        layoutParentId: zone.layoutParentId,
      };
      setItems([...items.filter((_, idx) => idx !== foundIndex), moved]);
    },
    [items, layouts],
  );

  /**
   * Add content items from JSON editors in left pane
   */
  const onCreate = useCallback(
    (item: ContentAll) => {
      const contentId = uuidv4() as ContentId;
      setItems([...items, { ...item, contentId }]);
      setLastCreatedContentId(contentId);
    },
    [items],
  );

  /**
   * Update content items inside of the WYSIWYG editor
   */
  const onUpdate = useCallback(
    (newItem: ContentAll) => {
      const newItems = items.map((oldItem) =>
        oldItem.contentId === newItem.contentId ? newItem : oldItem,
      );
      setItems(newItems);
    },
    [items],
  );

  const onDelete = useCallback(
    (newItem: Pick<ContentAll, 'contentId'>) => {
      const newItems = items.filter(
        (oldItem) => oldItem.contentId !== newItem.contentId,
      );
      setItems(newItems);
    },
    [items],
  );

  const focusCanvasBlock = useCallback((contentId: ContentId) => {
    // Focusing a block means "take me to the canvas to edit it", so it
    // leaves whichever full-editor view was up (PDF preview or
    // restructure). This is what makes the Edit button work from those
    // views and not just from the canvas -- the three views are mutually
    // exclusive, and entering one exits the others. Setting a flag that
    // is already false is a no-op re-render, so the common case (focusing
    // a block while already on the canvas) costs nothing.
    setIsRestructuring(false);
    setIsPdfViewOpen(false);
    setEditingContentId(null);
    editSessionRef.current = null;
    setCanvasEditingContentId(contentId);
  }, []);

  const blurCanvasBlock = useCallback((contentId: ContentId) => {
    setCanvasEditingContentId((current) =>
      current === contentId ? null : current,
    );
  }, []);

  const openEditingView = useCallback(
    (contentId: ContentId) => {
      // Switching blocks mid-session keeps the original capture: one
      // session, one snapshot, regardless of how many blocks it touched.
      if (!editSessionRef.current) {
        editSessionRef.current = { items, layouts };
      }
      setEditingContentId(contentId);
      setIsPdfViewOpen(true);
    },
    [items, layouts],
  );

  const togglePdfView = useCallback(
    (value?: boolean) => {
      const next = value === undefined ? !isPdfViewOpen : value;

      // Opening the preview leaves the restructure view -- the two are
      // mutually exclusive full-editor views, so the PDF button works
      // from restructure instead of appearing dead.
      if (next) {
        setIsRestructuring(false);
      }

      if (!next) {
        const session = editSessionRef.current;
        // Items identity only changes when a save actually landed, so
        // this is exactly the "nothing saved -> no snapshot" rule.
        // (layouts can't change while the PDF view is open -- the canvas
        // is unreachable behind it.)
        if (session && session.items !== items) {
          setUndoSnapshot({ ...session, description: 'Block edited' });
        }
        editSessionRef.current = null;
        setEditingContentId(null);
      }

      setIsPdfViewOpen(next);
    },
    [isPdfViewOpen, items],
  );

  const toggleRestructure = useCallback(
    (value?: boolean) => {
      const next = value === undefined ? !isRestructuring : value;

      // Entering restructure closes the PDF preview and any docked edit
      // panel, so it fully takes over the editor area -- the three views
      // stay mutually exclusive whichever way you enter this one.
      if (next) {
        setIsPdfViewOpen(false);
        setEditingContentId(null);
        editSessionRef.current = null;
        setCanvasEditingContentId(null);
      }

      setIsRestructuring(next);
    },
    [isRestructuring],
  );

  const title = useMemo(() => {
    const date = toYearMonthDayFormat();
    const contact = items.find(
      (item) => item.contentType === CONTENT_TYPES['CONTACT'],
    );

    if (contact?.contentType === CONTENT_TYPES['CONTACT']) {
      const name = toSlugCase(contact.content.name);

      return `${date}-${name}.pdf`;
    }

    return `${date}-your-name.pdf`;
  }, [items]);

  const onImportFile = useCallback((value: FileDropValue) => {
    setItems(value.items);
    setLayouts(value.layouts);
  }, []);

  // Captures the pre-action state so a destructive action (delete a
  // block, remove a layout, "New") can be undone -- call sites invoke
  // this immediately before performing the action itself, from the same
  // render's `items`/`layouts` closure (specs/undo-destructive-actions.md).
  // Overwrites any existing snapshot: only the most recent destructive
  // action is undoable, by design (no history stack).
  const pushUndoSnapshot = useCallback(
    (description: string) => {
      setUndoSnapshot({ items, layouts, description });
    },
    [items, layouts],
  );

  const performUndo = useCallback(() => {
    if (!undoSnapshot) return;
    setItems(undoSnapshot.items);
    setLayouts(undoSnapshot.layouts);
    setUndoSnapshot(null);
  }, [undoSnapshot]);

  const dismissUndo = useCallback(() => {
    setUndoSnapshot(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        title,
        isPdfViewOpen,
        isRestructuring,
        toggleRestructure,
        items,
        layouts,
        onImportFile,
        onDelete,
        onUpdate,
        onCreate,
        onMove,
        moveContentToZone,
        togglePdfView,
        editingContentId,
        openEditingView,
        canvasEditingContentId,
        focusCanvasBlock,
        blurCanvasBlock,
        lastCreatedContentId,
        undoSnapshot,
        pushUndoSnapshot,
        performUndo,
        dismissUndo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }

  return context;
}
