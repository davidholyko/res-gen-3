import c from 'classnames';
import { object, string } from 'zod';

import EXAMPLE_PARAGRAPH from '@/__example-json/paragraph.json';
import { CONTENT_TYPES } from '@/constants';
import type {
  ContentParagraph,
  ParagraphJson,
} from '@/types/content-paragraph';
import type { FieldSpec } from '@/types/field-spec';
import type { NeverProps } from '@/types/generics';

import BaseEditor from './base-editor';

type ParagraphEditorProps =
  | NeverProps
  | (ContentParagraph & {
      content?: ParagraphJson;
    });

const schema = object({
  paragraph: string(),
});

const fields: FieldSpec[] = [
  { kind: 'textarea', name: 'paragraph', label: 'Paragraph' },
];

export default function ParagraphEditor(props: ParagraphEditorProps) {
  const { content = EXAMPLE_PARAGRAPH } = props;

  const className = c('paragraph-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.PARAGRAPH}
      macro="Paragraph"
      content={content}
      schema={schema}
      fields={fields}
    />
  );
}
