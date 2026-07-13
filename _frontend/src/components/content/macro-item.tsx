import { CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';

import AnyListMacro from '../json-macros/any-list-macro';
import ContactMacro from '../json-macros/contact-macro';
import ExperienceMacro from '../json-macros/experience-macro';
import HeaderMacro from '../json-macros/header-macro';
import ParagraphMacro from '../json-macros/paragraph-macro';

type MacroItemProps = ContentAll;

export default function MacroItem(props: MacroItemProps) {
  const { contentType, contentId } = props;

  switch (contentType) {
    case CONTENT_TYPES.CONTACT: {
      return <ContactMacro key={contentId} {...props} />;
    }
    case CONTENT_TYPES.HEADER: {
      return <HeaderMacro key={contentId} {...props} />;
    }
    case CONTENT_TYPES.EXPERIENCE: {
      return <ExperienceMacro key={contentId} {...props} />;
    }
    case CONTENT_TYPES.PARAGRAPH: {
      return <ParagraphMacro key={contentId} {...props} />;
    }
    case CONTENT_TYPES.ANY_LIST: {
      return <AnyListMacro key={contentId} {...props} />;
    }
    default: {
      throw new Error(`[macro-item] Unsupported contentType ${contentType}`);
    }
  }
}
