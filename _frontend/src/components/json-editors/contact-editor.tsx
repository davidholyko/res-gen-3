import c from 'classnames';
import { object, string } from 'zod';

import EXAMPLE_CONTACT from '@/__example-json/contact.json';
import { CONTENT_TYPES } from '@/constants';
import type { ContactJson, ContentContact } from '@/types/content-contact';
import type { NeverProps } from '@/types/generics';

import BaseEditor from './base-editor';

type ContactEditorProps =
  | NeverProps
  | (ContentContact & {
      content?: ContactJson;
    });

// `.optional()`/`.nullish()`, not `union([string(), undefined()])`: zod v4
// only treats a key as omittable from the input when the schema itself
// marks it optional -- a union that merely *includes* `undefined()` still
// requires the key to be present (even as `undefined`), so editing a
// contact down to just name/email failed validation on every real,
// legitimate partial payload. Also adds `website`, present in
// `ContactJsonOptional` and every example payload but missing from this
// schema entirely -- BaseEditor saves the raw parsed JSON regardless of
// what the schema recognizes, so this didn't drop the field on save, but
// it did mean a malformed `website` value went completely unvalidated.
const schema = object({
  name: string(),
  email: string(),
  title: string().nullish(),
  phone: string().optional(),
  location: string().optional(),
  github: string().optional(),
  linkedin: string().optional(),
  website: string().optional(),
});

export default function ContactEditor(props: ContactEditorProps) {
  const { content = EXAMPLE_CONTACT } = props;

  const className = c('contact-editor');

  return (
    <BaseEditor //
      {...props}
      className={className}
      contentType={CONTENT_TYPES.CONTACT}
      macro="Contact"
      content={content}
      schema={schema}
    />
  );
}
