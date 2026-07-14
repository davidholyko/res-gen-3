import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import { CONTENT_TYPES } from '@/constants';
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
  isEditorVisible: boolean;
  isModalOpen: boolean; // maybe move to pdf preview context
  items: ContentAll[]; // rename to contentItems
  layouts: LayoutItem[];
  addLayout: (newLayout: LayoutItem) => void;
  addLayoutAt: (newLayout: LayoutItem, index: number) => void;
  /**
   * Moves the layout at `fromIndex` into the gap at `toGapIndex` (a gap
   * index ranges 0..layouts.length: 0 is above the first layout,
   * layouts.length is below the last). Dropping a layout into either of
   * its own adjacent gaps is a no-op.
   */
  moveLayout: (fromIndex: number, toGapIndex: number) => void;
  removeLayout: (layoutId: LayoutId) => void;
  onImportFile: ({ items, layouts }: FileDropValue) => void;
  onCreate: (item: ContentAll) => void;
  onUpdate: (item: ContentAll) => void;
  onDelete: (item: Pick<ContentAll, 'contentId'>) => void;
  onMove: (action: MOVE_ACTION, contentId: ContentId) => void;
  toggleEditor: () => void;
  togglePdfModal: (value?: boolean) => void;
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
  // Lazy-initialized from localStorage, same as `layouts`/`items` above
  // (safe: AppProvider only ever mounts client-side, see src/app/page.tsx),
  // rather than defaulting to false and correcting via an effect.
  const [isEditorVisible, setIsEditorVisible] = useState(
    localStorageUtil.isEditorVisible,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCreatedContentId, setLastCreatedContentId] =
    useState<ContentId | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);

  // Store data in local storage whenever it changes
  useEffect(() => {
    localStorageUtil.data = { items, layouts, isEditorVisible };
  }, [items, layouts, isEditorVisible]);

  useEffect(() => {
    // Reconciles `items` against `layouts` (e.g. after removeLayout, so
    // orphaned items are dropped). `items` is genuinely mutable
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

  const onMove = useCallback(
    (action: MOVE_ACTION, contentId: ContentId) => {
      switch (action) {
        case MOVE_ACTION.MACRO_UP: {
          const newItems = [...items];
          const foundIndex = newItems.findIndex(
            (i) => i.contentId === contentId,
          );
          const [item] = newItems.splice(foundIndex, 1);
          newItems.splice(foundIndex - 1, 0, item);
          setItems(newItems);
          break;
        }
        case MOVE_ACTION.MACRO_DOWN: {
          const newItems = [...items];
          const foundIndex = newItems.findIndex(
            (i) => i.contentId === contentId,
          );
          const [item] = newItems.splice(foundIndex, 1);
          newItems.splice(foundIndex + 1, 0, item);
          setItems(newItems);
          break;
        }
        default:
          throw new Error(`Unsupported move action ${action}`);
      }
    },
    [items],
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

  const addLayout = useCallback((newLayout: LayoutItem) => {
    setLayouts((prevLayouts) => [...prevLayouts, newLayout]);
  }, []);

  // Insert at a specific position, not just append -- the canvas gap
  // inserters (layout-gap-inserter.tsx) add a layout exactly where the
  // user is looking (specs/editor-redesign.md, Design → Layout
  // management).
  const addLayoutAt = useCallback((newLayout: LayoutItem, index: number) => {
    setLayouts((prevLayouts) => {
      const next = [...prevLayouts];
      next.splice(index, 0, newLayout);
      return next;
    });
  }, []);

  const moveLayout = useCallback((fromIndex: number, toGapIndex: number) => {
    setLayouts((prevLayouts) => {
      // The gaps directly above and below the dragged layout both mean
      // "leave it where it is" -- bail with the same reference so
      // nothing downstream misreads the drop as a change.
      if (toGapIndex === fromIndex || toGapIndex === fromIndex + 1) {
        return prevLayouts;
      }

      const next = [...prevLayouts];
      const [moved] = next.splice(fromIndex, 1);
      // Removing the layout first shifts every gap below it up by one.
      next.splice(
        toGapIndex > fromIndex ? toGapIndex - 1 : toGapIndex,
        0,
        moved,
      );
      return next;
    });
  }, []);

  // Removes a specific layout by id, not just the last one -- the
  // canvas-level "remove this layout" affordance next to each layout
  // (unlike the Edit menu's "Remove Last Layout") needs to target
  // whichever one the user is actually looking at.
  const removeLayout = useCallback((layoutId: LayoutId) => {
    setLayouts((prevLayouts) =>
      prevLayouts.filter((layout) => layout.layoutId !== layoutId),
    );
  }, []);

  const toggleEditor = useCallback(
    () => setIsEditorVisible(!isEditorVisible),
    [isEditorVisible],
  );

  const togglePdfModal = useCallback(
    (value?: boolean) => {
      setIsModalOpen(value === undefined ? !isModalOpen : value);
    },
    [isModalOpen],
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
        isModalOpen,
        isEditorVisible,
        items,
        layouts,
        addLayout,
        addLayoutAt,
        moveLayout,
        removeLayout,
        onImportFile,
        onDelete,
        onUpdate,
        onCreate,
        onMove,
        toggleEditor,
        togglePdfModal,
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
