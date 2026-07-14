// Declarative field descriptors for ContentForm (specs/editor-redesign.md).
// `kind` covers what the 5 content types need; text/textarea land in
// Phase 1, tags/list/record-of-lists in later phases as their content
// types migrate off the raw-JSON editor.
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

export type FieldSpec = TextFieldSpec | TextareaFieldSpec;
