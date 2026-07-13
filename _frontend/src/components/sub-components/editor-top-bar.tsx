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
  errorMessage: string;
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
      errorMessage,
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
      // No `opacity-50` for the error state: compositing a translucent
      // bg-gray-600 + white text over the page background drops the
      // already-borderline contrast to ~2.3:1 (needs 4.5:1) -- caught by
      // a real-browser axe scan, which (unlike jsdom) computes actual
      // rendered contrast. The error text below (bright red, role="alert")
      // is already the primary "something's wrong" signal; the cursor
      // change already covers "you can't drag this right now".
      return c('flex bg-gray-600 rounded text-white justify-between p-2', {
        'cursor-grab': !errorMessage && isInEditor,
      });
    }, [errorMessage, isInEditor]);

    const labelClassName = useMemo(() => {
      return c('grow p-1 font-bold', {
        'cursor-grab': !errorMessage && isInEditor,
      });
    }, [errorMessage, isInEditor]);

    return (
      <>
        {/*
          The collapse toggle (role="button") only wraps the drag handle +
          label -- the select/add/visibility-toggle controls below are
          siblings, not descendants, of it. Nesting real interactive
          elements inside a role="button" is an axe-flagged WCAG 4.1.2
          violation (AT can't sensibly announce a "button" that itself
          contains a select and two more buttons).
        */}
        <div
          className={editorDragContainerClassName}
          draggable="true"
          ref={ref} //
        >
          <div
            className="flex grow items-center"
            role="button"
            tabIndex={0}
            onClick={onClickTopBar}
            onKeyDown={onKeyDownTopBar}
            aria-expanded={isOpen}
            aria-controls={`editor-collapse-${formId}`}
          >
            {isInEditor && <DragHandleIcon className="m-1 p-1" />}
            <label
              className={labelClassName}
              htmlFor={`editor-textarea-${formId}`}
            >
              {macro} {!isInEditor && '(Edit Mode)'}
            </label>
          </div>

          {isInEditor && (
            <>
              <label className="sr-only" htmlFor={`add-target-${formId}`}>
                Add to layout
              </label>
              <select
                id={`add-target-${formId}`}
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
                type="button"
                onClick={onAdd}
                disabled={!!errorMessage || !selectedZone}
              >
                <PlusIcon />
              </button>
              <button
                aria-label="Toggle Editor Visibility Button"
                type="button"
              >
                {isOpen ? <CollapseIcon /> : <UncollapseIcon />}
              </button>
            </>
          )}
        </div>
        {errorMessage && (
          <p
            id={`error-message-${formId}`}
            // bg-red-600, not bg-red-400: white text on red-400 is ~2.9:1
            // contrast (needs 4.5:1) -- caught by a real-browser axe scan.
            // red-600 clears it at ~4.8:1 with the same white text.
            className="text-white bg-red-600 rounded p-2"
            role="alert"
          >
            <span
              className="border-black border-2 rounded bg-white p-1 m-1"
              aria-hidden="true"
            >
              ❗
            </span>
            {errorMessage}
          </p>
        )}
      </>
    );
  },
);

EditorTopBar.displayName = 'EditorTopBar';
