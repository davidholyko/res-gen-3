import c from 'classnames';
import { email, object, string } from 'zod';

import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '@/constants';
import type { ContentContact } from '@/types/content-contact';
import type { FieldSpec } from '@/types/field-spec';

import BaseEditor from './base-editor';

// Always a placed block's inline editor now -- the ribbon's example-
// content template cards retired with specs/editor-redesign.md Phase 6,
// so `content` is required, never defaulted.
type ContactEditorProps = ContentContact;

// `.optional()`/`.nullish()`, not `union([string(), undefined()])`: zod v4
// only treats a key as omittable from the input when the schema itself
// marks it optional -- a union that merely *includes* `undefined()` still
// requires the key to be present (even as `undefined`), so editing a
// contact down to just name/email failed validation on every real,
// legitimate partial payload.
//
// name/email carry real constraints (non-empty, well-formed), not the
// unconstrained string() they were as raw JSON: Contact is the first
// migrated type whose form can actually show the per-field inline errors
// specs/editor-redesign.md's Validation UX section calls for -- an
// unconstrained string is unviolatable through a text input.
const schema = object({
  name: string().min(1, 'Name is required'),
  email: email('Must be a valid email address, e.g. you@example.com'),
  title: string().nullish(),
  phone: string().optional(),
  location: string().optional(),
  github: string().optional(),
  linkedin: string().optional(),
  website: string().optional(),
});

const fields: FieldSpec[] = [
  { kind: 'text', name: 'name', label: 'Name' },
  { kind: 'text', name: 'email', label: 'Email' },
  { kind: 'text', name: 'title', label: 'Title' },
  { kind: 'text', name: 'phone', label: 'Phone' },
  { kind: 'text', name: 'location', label: 'Location' },
  { kind: 'text', name: 'github', label: 'GitHub' },
  { kind: 'text', name: 'linkedin', label: 'LinkedIn' },
  { kind: 'text', name: 'website', label: 'Website' },
];

export default function ContactEditor(props: ContactEditorProps) {
  const className = c('contact-editor');

  return (
    <BaseEditor //
      {...props}
      className={className}
      contentType={CONTENT_TYPES.CONTACT}
      label={CONTENT_TYPE_LABELS.CONTACT}
      schema={schema}
      fields={fields}
    />
  );
}
