import type { CONTENT_TYPES } from '../constants';
import type { ContentBaseItem } from './content-base-item';

type HeaderJsonRequired = {
  header: string;
};

type HeaderJsonOptional = {
  header: string;
};

export type HeaderJson = HeaderJsonRequired & Partial<HeaderJsonOptional>;

export type ContentHeader = ContentBaseItem<
  (typeof CONTENT_TYPES)['HEADER'],
  HeaderJson
>;
