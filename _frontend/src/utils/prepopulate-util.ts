import { v4 as uuidv4 } from 'uuid';

import ANY_LIST_1 from '@/__example-json/any-list-1.json';
import ANY_LIST_2 from '@/__example-json/any-list-2.json';
import CONTACT from '@/__example-json/contact.json';
import EXPERIENCE_1 from '@/__example-json/experience-1.json';
import EXPERIENCE_2 from '@/__example-json/experience-2.json';
import EXPERIENCE_3 from '@/__example-json/experience-3.json';
import HEADER_1 from '@/__example-json/header-1.json';
import HEADER_2 from '@/__example-json/header-2.json';
import HEADER_3 from '@/__example-json/header-3.json';
import HEADER_4 from '@/__example-json/header-4.json';
import PARAGRAPH from '@/__example-json/paragraph.json';
import { CONTENT_TYPES, LAYOUTS } from '@/constants';
import { ContentAll } from '@/types/content-all';
import { ContentId, LayoutId } from '@/types/content-base-item';
import { LayoutItem } from '@/types/layouts';

const LAYOUT_ID = uuidv4() as LayoutId;

export class PrepopulateUtil {
  get items(): ContentAll[] {
    return [
      {
        content: CONTACT,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.CONTACT,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: HEADER_1,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.HEADER,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: PARAGRAPH,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.PARAGRAPH,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: HEADER_2,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.HEADER,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: EXPERIENCE_1,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.EXPERIENCE,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: EXPERIENCE_2,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.EXPERIENCE,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: EXPERIENCE_3,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.EXPERIENCE,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: HEADER_3,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.HEADER,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: ANY_LIST_1,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.ANY_LIST,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: HEADER_4,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.HEADER,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
      {
        content: ANY_LIST_2,
        contentId: uuidv4() as ContentId,
        contentType: CONTENT_TYPES.ANY_LIST,
        layoutId: LAYOUT_ID,
        layoutType: LAYOUTS.SINGLE,
      },
    ];
  }

  get layouts(): LayoutItem[] {
    return [{ layoutId: LAYOUT_ID, layoutType: LAYOUTS.SINGLE }];
  }
}

export const prepopulateUtil = new PrepopulateUtil();
