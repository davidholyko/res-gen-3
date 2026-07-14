import c from 'classnames';
import { array, object, string } from 'zod';

import { CONTENT_TYPES } from '@/constants';
import type { ContentExperience } from '@/types/content-experience';
import type { FieldSpec } from '@/types/field-spec';

import BaseEditor from './base-editor';

// Always a placed block's inline editor now -- the ribbon's example-
// content template cards retired with specs/editor-redesign.md Phase 6,
// so `content` is required, never defaulted.
type ExperienceEditorProps = ContentExperience;

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
  const className = c('experience-editor');

  return (
    <BaseEditor //
      {...props}
      className={className}
      contentType={CONTENT_TYPES.EXPERIENCE}
      macro="Experience"
      schema={schema}
      fields={fields}
    />
  );
}
