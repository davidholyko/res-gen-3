import c from 'classnames';
import {
  null as _null,
  object,
  string,
  undefined as _undefined,
  union,
} from 'zod';

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

const schema = object({
  name: string(),
  email: string(),
  title: union([string(), _undefined(), _null()]),
  phone: union([string(), _undefined()]),
  location: union([string(), _undefined()]),
  github: union([string(), _undefined()]),
  linkedin: union([string(), _undefined()]),
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
