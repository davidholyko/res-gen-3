import type { CONTENT_TYPES } from '../constants';
import type { ContentBaseItem } from './content-base-item';

type ContactJsonRequired = {
  name: string;
  email: string;
};

type ContactJsonOptional = {
  title: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  website: string;
};

export type ContactJson = ContactJsonRequired & Partial<ContactJsonOptional>;

export type ContentContact = ContentBaseItem<
  (typeof CONTENT_TYPES)['CONTACT'],
  ContactJson
>;
