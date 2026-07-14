import c from 'classnames';
import { array, object, string } from 'zod';

import EXAMPLE_EXPERIENCE from '@/__example-json/experience-1.json';
import { CONTENT_TYPES } from '@/constants';
import type {
  ContentExperience,
  ExperienceJson,
} from '@/types/content-experience';
import type { FieldSpec } from '@/types/field-spec';
import { NeverProps } from '@/types/generics';

import BaseEditor from './base-editor';

type ExperienceEditorProps =
  | NeverProps
  | (ContentExperience & {
      content?: ExperienceJson;
    });

// title/company carry non-empty constraints now that they're edited
// through form fields (same reasoning as Contact's name/email,
// specs/editor-redesign.md Validation UX): they're the two required keys
// of ExperienceJson, and an unconstrained string() can't produce the
// per-field inline error a cleared required field should show.
const schema = object({
  title: string().min(1, 'Title is required'),
  company: string().min(1, 'Company is required'),
  location: string().optional(),
  dates: string().optional(),
  tags: array(string()).optional(),
  descriptions: array(string()).optional(),
});

const fields: FieldSpec[] = [
  { kind: 'text', name: 'title', label: 'Title' },
  { kind: 'text', name: 'company', label: 'Company' },
  { kind: 'text', name: 'location', label: 'Location' },
  { kind: 'text', name: 'dates', label: 'Dates' },
  { kind: 'tags', name: 'tags', label: 'Tags' },
  { kind: 'list', name: 'descriptions', label: 'Descriptions' },
];

export default function ExperienceEditor(props: ExperienceEditorProps) {
  const { content = EXAMPLE_EXPERIENCE } = props;

  const className = c('experience-editor');

  return (
    <BaseEditor //
      {...props}
      className={className}
      contentType={CONTENT_TYPES.EXPERIENCE}
      macro="Experience"
      content={content}
      schema={schema}
      fields={fields}
    />
  );
}
