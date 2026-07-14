// Declarative field descriptors for ContentForm (specs/editor-redesign.md).
// `kind` covers what the 5 content types need; text/textarea landed in
// Phase 1, tags/list in Phase 4 (Experience), record-of-lists lands with
// AnyList's migration off the raw-JSON editor.
type FieldSpecBase = {
  name: string;
  label: string;
};

export type TextFieldSpec = FieldSpecBase & {
  kind: 'text';
};

export type TextareaFieldSpec = FieldSpecBase & {
  kind: 'textarea';
};

// Chip/pill entry over a string[] -- type text, Enter or comma commits a
// chip, a chip's × removes it (Experience's `tags`).
export type TagsFieldSpec = FieldSpecBase & {
  kind: 'tags';
};

// Repeating single-line rows over a string[] with add/remove/reorder-by-
// button (Experience's `descriptions`).
export type ListFieldSpec = FieldSpecBase & {
  kind: 'list';
};

// Repeating named groups over a whole Record<string, string[]> -- each
// group is a name input plus its own list of entries (AnyList). The one
// kind that edits the entire content object rather than a single key,
// so its `name` is unused ('' by convention).
export type RecordOfListsFieldSpec = FieldSpecBase & {
  kind: 'record-of-lists';
};

export type FieldSpec =
  | TextFieldSpec
  | TextareaFieldSpec
  | TagsFieldSpec
  | ListFieldSpec
  | RecordOfListsFieldSpec;
