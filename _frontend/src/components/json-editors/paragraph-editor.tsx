import c from 'classnames';
import { object, string } from 'zod';

import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '@/constants';
import type { ContentParagraph } from '@/types/content-paragraph';
import type { FieldSpec } from '@/types/field-spec';

import BaseEditor from './base-editor';

// Always a placed block's inline editor now -- the ribbon's example-
// content template cards retired with specs/editor-redesign.md Phase 6,
// so `content` is required, never defaulted.
type ParagraphEditorProps = ContentParagraph;

const schema = object({
  paragraph: string(),
});

const fields: FieldSpec[] = [
  { kind: 'textarea', name: 'paragraph', label: 'Paragraph' },
];

export default function ParagraphEditor(props: ParagraphEditorProps) {
  const className = c('paragraph-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.PARAGRAPH}
      label={CONTENT_TYPE_LABELS.PARAGRAPH}
      schema={schema}
      fields={fields}
    />
  );
}
