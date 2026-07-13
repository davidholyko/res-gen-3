import { ContentAnyList } from './content-any-list';
import { ContentContact } from './content-contact';
import { ContentExperience } from './content-experience';
import { ContentHeader } from './content-header';
import { ContentParagraph } from './content-paragraph';

export type ContentAll =
  | ContentAnyList //
  | ContentExperience
  | ContentContact
  | ContentHeader
  | ContentParagraph;
