import c from 'classnames';
import { useMemo } from 'react';

import AnyListMacro from '@/components/json-macros/any-list-macro';
import ContactMacro from '@/components/json-macros/contact-macro';
import ExperienceMacro from '@/components/json-macros/experience-macro';
import HeaderMacro from '@/components/json-macros/header-macro';
import ParagraphMacro from '@/components/json-macros/paragraph-macro';
import { CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';

type MacroManagerProps = {
  items: ContentAll[];
};

export default function MacroManager({ items }: MacroManagerProps) {
  const elements = useMemo(() => {
    const components = items.map((item) => {
      switch (item.contentType) {
        case CONTENT_TYPES.CONTACT: {
          return <ContactMacro key={item.contentId} {...item} />;
        }
        case CONTENT_TYPES.HEADER: {
          return <HeaderMacro key={item.contentId} {...item} />;
        }
        case CONTENT_TYPES.EXPERIENCE: {
          return <ExperienceMacro key={item.contentId} {...item} />;
        }
        case CONTENT_TYPES.PARAGRAPH: {
          return <ParagraphMacro key={item.contentId} {...item} />;
        }
        case CONTENT_TYPES.ANY_LIST: {
          return <AnyListMacro key={item.contentId} {...item} />;
        }
        default:
          throw new Error(`Invalid item. ${JSON.stringify(item)}`);
      }
    });

    return components;
  }, [items]);

  const className = useMemo(() => c({ 'macro-manager': true }), []);

  return <div className={className}>{elements}</div>;
}
