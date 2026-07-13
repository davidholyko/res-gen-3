import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import type { ContentAll } from '@/types/content-all';

import AnyListEditor from '../json-editors/any-list-editor';
import ContactEditor from '../json-editors/contact-editor';
import ExperienceEditor from '../json-editors/experience-editor';
import HeaderEditor from '../json-editors/header-editor';
import ParagraphEditor from '../json-editors/paragraph-editor';

type EditorItemProps = ContentAll & {
  mode: keyof typeof EDITOR_MODES;
};

export default function EditorItem(props: EditorItemProps) {
  const { contentType, contentId } = props;

  switch (contentType) {
    case CONTENT_TYPES.CONTACT: {
      return <ContactEditor key={contentId} {...props} />;
    }
    case CONTENT_TYPES.HEADER: {
      return <HeaderEditor key={contentId} {...props} />;
    }
    case CONTENT_TYPES.EXPERIENCE: {
      return <ExperienceEditor key={contentId} {...props} />;
    }
    case CONTENT_TYPES.PARAGRAPH: {
      return <ParagraphEditor key={contentId} {...props} />;
    }
    case CONTENT_TYPES.ANY_LIST: {
      return <AnyListEditor key={contentId} {...props} />;
    }
    default: {
      throw new Error(`[editor-item] Unsupported contentType ${contentType}`);
    }
  }
}
