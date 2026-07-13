import type { CONTENT_TYPES, LAYOUTS } from '@/constants';

import type { Brand } from './brand';

export type ContentId = Brand<string, 'contentId'>;
export type LayoutId = Brand<string, 'layoutId'>;

export type ContentBaseItem<
  ContentType extends keyof typeof CONTENT_TYPES,
  ContentJson,
> = {
  content: ContentJson;
  contentId: ContentId;
  contentType: ContentType;
  /**
   * `layoutId` and `layoutType` are not available for base editors
   */
  layoutId?: LayoutId;
  layoutType?: keyof typeof LAYOUTS;
  /**
   * `layoutParentId` is only available for non-single layouts
   */
  layoutParentId?: LayoutId;
};
