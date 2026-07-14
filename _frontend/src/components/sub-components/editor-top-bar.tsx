import c from 'classnames';
import { forwardRef, Ref, useCallback, useMemo, useState } from 'react';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import { ContentId } from '@/types/content-base-item';
import { getLayoutDropZones } from '@/utils/layout-drop-zone-util';

import CollapseIcon from '../icons/collapse-icon';
import DragHandleIcon from '../icons/drag-handle-icon';
import PlusIcon from '../icons/plus-icon';
import UncollapseIcon from '../icons/uncollapse-icon';

type EditorTopBarProps = {
  contentId: ContentId;
  contentType: keyof typeof CONTENT_TYPES;
  // Validation problems render per field inside ContentForm
  // (specs/editor-redesign.md, Validation UX) -- this flag's job is to
  // disable add/drag so an invalid block can't be placed.
  hasFieldErrors: boolean;
  formId: string;
  isOpen: boolean;
  macro: string;
  mode: keyof typeof EDITOR_MODES;
  text: string;
  setIsOpen: (value: boolean) => void;
};

export const EditorTopBar = forwardRef<HTMLDivElement, EditorTopBarProps>(
  (props: EditorTopBarProps, ref: Ref<HTMLDivElement>) => {
    const { onCreate, layouts } = useAppContext();
    const {
      macro,
      hasFieldErrors,
      text,
      formId,
      contentType,
      contentId,
      isOpen,
      setIsOpen,
      mode,
    } = props;

    const isInEditor = useMemo(
      () => mode === EDITOR_MODES.IN_EDITOR_MANAGER,
      [mode],
    );

    // Dragging this editor onto a layout (BaseEditor's useDrag `end`
    // callback) is the only other way to place new content, and drag
    // gestures need a single-pointer alternative (WCAG SC 2.5.7). This
    // picker gives keyboard/non-drag users the same reach: any layout
    // zone, not just whichever was created last.
    const zones = useMemo(() => getLayoutDropZones(layouts), [layouts]);
    const [selectedZoneKey, setSelectedZoneKey] = useState('');
    const selectedZone = useMemo(
      () =>
        zones.find((zone) => zone.key === selectedZoneKey) ??
        zones[zones.length - 1],
      [zones, selectedZoneKey],
    );

    const onSelectZone = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedZoneKey(event.target.value);
      },
      [],
    );

    const onAdd = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        // Belt-and-suspenders: the button is already `disabled` whenever
        // selectedZone is falsy (no layouts exist yet), and disabled
        // buttons never dispatch click events, so this can't actually be
        // reached by a real click -- only relevant if this handler is ever
        // wired up elsewhere without that same disabled guard.
        /* v8 ignore next */
        if (!selectedZone) return;

        onCreate({
          contentId,
          content: { ...JSON.parse(text) },
          contentType,
          layoutId: selectedZone.layoutId,
          layoutType: selectedZone.layoutType,
          layoutParentId: selectedZone.layoutParentId,
        });
      },
      [contentType, selectedZone, contentId, text, onCreate],
    );

    const onClickTopBar = useCallback(() => {
      if (isInEditor) {
        setIsOpen(!isOpen);
      }
    }, [setIsOpen, isOpen, isInEditor]);

    const onKeyDownTopBar = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Enter' || event.key === ' ') && isInEditor) {
          event.preventDefault();
          setIsOpen(!isOpen);
        }
      },
      [setIsOpen, isOpen, isInEditor],
    );

    const editorDragContainerClassName = useMemo(() => {
      return c('flex bg-gray-600 rounded text-white justify-between p-2');
    }, []);

    const dragHandleClassName = useMemo(() => {
      // No `opacity-50` for the error state: compositing a translucent
      // bg-gray-600 + white text over the page background drops the
      // already-borderline contrast to ~2.3:1 (needs 4.5:1) -- caught by
      // a real-browser axe scan, which (unlike jsdom) computes actual
      // rendered contrast. ContentForm's inline per-field errors are
      // already the primary "something's wrong" signal; the cursor
      // change already covers "you can't drag this right now".
      return c('flex grow items-center', {
        'cursor-grab': !hasFieldErrors && isInEditor,
      });
    }, [hasFieldErrors, isInEditor]);

    const labelClassName = useMemo(() => {
      return c('grow p-1 font-bold', {
        'cursor-grab': !hasFieldErrors && isInEditor,
      });
    }, [hasFieldErrors, isInEditor]);

    return (
      // The collapse toggle (role="button") only wraps the drag handle +
      // label -- the select/add/visibility-toggle controls below are
      // siblings, not descendants, of it. Nesting real interactive
      // elements inside a role="button" is an axe-flagged WCAG 4.1.2
      // violation (AT can't sensibly announce a "button" that itself
      // contains a select and two more buttons).
      <div className={editorDragContainerClassName}>
        {/*
            draggable/ref scoped to just this drag-handle+label region, not
            the whole top bar: in the wide left-panel card this used to be,
            the whole bar's own center point safely landed on this region.
            The ribbon's much narrower items (specs/ribbon-layout.md) moved
            that center point onto the "Add to layout" <select> instead --
            confirmed live, a real drag regression, not just a test
            artifact, since a real drag gesture starting there would hit
            the select instead of triggering a drag too.
          */}
        <div
          className={dragHandleClassName}
          draggable="true"
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={onClickTopBar}
          onKeyDown={onKeyDownTopBar}
          aria-expanded={isOpen}
          aria-controls={`editor-collapse-${formId}`}
          title={
            isInEditor
              ? `${isOpen ? 'Collapse' : 'Expand'} ${macro} form`
              : undefined
          }
        >
          {isInEditor && (
            <span title="Drag onto a layout to add this block">
              <DragHandleIcon className="m-1 p-1" />
            </span>
          )}
          <label
            className={labelClassName}
            htmlFor={`editor-textarea-${formId}`}
          >
            {macro}
            {!isInEditor && (
              // A small text suffix ("(Edit Mode)") was easy to miss --
              // this badge is the stronger visual differentiation
              // between the left panel's static template cards and a
              // focused block's live inline editor (Finding 7).
              <span className="ml-2 text-xs font-bold uppercase bg-cyan-700 text-white rounded px-2 py-0.5 align-middle">
                Editing
              </span>
            )}
          </label>
        </div>

        {isInEditor && (
          <>
            <label className="sr-only" htmlFor={`add-target-${formId}`}>
              Add to layout
            </label>
            <select
              id={`add-target-${formId}`}
              title="Choose which layout this block will be added to"
              // Explicit bg-white: without it the select renders
              // transparent over this dark toolbar, leaving text-black
              // at ~2.8:1 contrast against the bg-gray-600 behind it
              // (needs 4.5:1) -- caught by a real-browser axe scan,
              // which (unlike jsdom) actually computes rendered contrast.
              className="mx-1 rounded bg-white text-black"
              value={selectedZone?.key ?? ''}
              onChange={onSelectZone}
              disabled={!zones.length}
            >
              {zones.map((zone) => (
                <option key={zone.key} value={zone.key}>
                  {zone.label}
                </option>
              ))}
            </select>
            <button
              className="mx-4 p-1 bg-green-300 hover:bg-green-500 rounded"
              aria-label="Add Macro Button"
              title="Add this block to the selected layout"
              type="button"
              onClick={onAdd}
              disabled={hasFieldErrors || !selectedZone}
            >
              <PlusIcon />
            </button>
            <button
              aria-label="Toggle Editor Visibility Button"
              title={`${isOpen ? 'Collapse' : 'Expand'} ${macro} form`}
              type="button"
            >
              {isOpen ? <CollapseIcon /> : <UncollapseIcon />}
            </button>
          </>
        )}
      </div>
    );
  },
);

EditorTopBar.displayName = 'EditorTopBar';
