import { CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { AnyList } from '@/types/content-any-list';
import type { ContactJson } from '@/types/content-contact';
import type { ExperienceJson } from '@/types/content-experience';
import type { HeaderJson } from '@/types/content-header';
import type { ParagraphJson } from '@/types/content-paragraph';

import AnyListContent from './any-list-content';
import ContactContent from './contact-content';
import ExperienceContent from './experience-content';
import HeaderContent from './header-content';
import ParagraphContent from './paragraph-content';

// Read-only styled rendering of one block's content by type -- the same
// JSX the canvas macros render, without any BaseMacro edit chrome. Drives
// the WYSIWYG restructure preview (specs/wysiwyg-staging.md); mirrors
// MacroManager's type switch.
export default function MacroContent({ item }: { item: ContentAll }) {
  switch (item.contentType) {
    case CONTENT_TYPES.CONTACT:
      return <ContactContent content={item.content as ContactJson} />;
    case CONTENT_TYPES.HEADER:
      return <HeaderContent content={item.content as HeaderJson} />;
    case CONTENT_TYPES.PARAGRAPH:
      return <ParagraphContent content={item.content as ParagraphJson} />;
    case CONTENT_TYPES.EXPERIENCE:
      return <ExperienceContent content={item.content as ExperienceJson} />;
    case CONTENT_TYPES.ANY_LIST:
      return <AnyListContent content={item.content as AnyList} />;
    default:
      throw new Error(`Invalid item. ${JSON.stringify(item)}`);
  }
}
