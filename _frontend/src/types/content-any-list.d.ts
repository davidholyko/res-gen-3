import type { CONTENT_TYPES } from '../constants';
import type { ContentBaseItem } from './content-base-item';

type AnyListRequired = {
  [key: string]: string[];
};

type AnyListOptional = {
  [key: string]: string[];
};

export type AnyList = AnyListRequired & Partial<AnyListOptional>;

export type ContentAnyList = ContentBaseItem<
  (typeof CONTENT_TYPES)['ANY_LIST'],
  AnyList
>;
