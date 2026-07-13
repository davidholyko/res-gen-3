import type { CONTENT_TYPES } from '../constants';
import type { ContentBaseItem } from './content-base-item';

type ParagraphJsonRequired = {
  paragraph: string;
};

type ParagraphJsonOptional = {
  paragraph: string;
};

export type ParagraphJson = ParagraphJsonRequired &
  Partial<ParagraphJsonOptional>;

export type ContentParagraph = ContentBaseItem<
  (typeof CONTENT_TYPES)['PARAGRAPH'],
  ParagraphJson
>;
