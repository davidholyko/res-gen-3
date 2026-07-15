type EditorTopBarProps = {
  formId: string;
  // The block's plain-language name (a CONTENT_TYPE_LABELS value) -- the
  // same name the "+ Add block" menu uses, so a block is named
  // identically when added and when edited
  // (specs/plain-language-labels-and-move-undo.md).
  label: string;
};

// The header bar of a focused block's inline editor: names the block
// type and badges the form as live-editing. This used to be the whole
// ribbon-card toolbar (drag handle, zone picker, add button, collapse
// toggle) -- all retired with the Template ribbon itself
// (specs/editor-redesign.md, Phase 6): content is added via each zone's
// "+ Add block" control instead.
export function EditorTopBar({ formId, label }: EditorTopBarProps) {
  return (
    <div className="flex bg-gray-600 rounded text-white justify-between p-2">
      <label
        className="grow p-1 font-bold"
        // ContentForm gives its first field this id.
        htmlFor={`editor-textarea-${formId}`}
      >
        {label}
        {/* A small text suffix ("(Edit Mode)") was easy to miss -- this
            badge is the stronger visual signal that the fields below
            edit the block live (specs/app-ux-improvements.md,
            Finding 7). */}
        <span className="ml-2 text-xs font-bold uppercase bg-cyan-700 text-white rounded px-2 py-0.5 align-middle">
          Editing
        </span>
      </label>
    </div>
  );
}
