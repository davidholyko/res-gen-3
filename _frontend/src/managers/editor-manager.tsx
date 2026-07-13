import c from 'classnames';
import { useMemo } from 'react';

import AnyListEditor from '@/components/json-editors/any-list-editor';
import ContactEditor from '@/components/json-editors/contact-editor';
import ExperienceEditor from '@/components/json-editors/experience-editor';
import HeaderEditor from '@/components/json-editors/header-editor';
import ParagraphEditor from '@/components/json-editors/paragraph-editor';
import { useAppContext } from '@/context/app-context';

export default function EditorManager() {
  const { isEditorVisible } = useAppContext();

  const className = useMemo(
    () => c({ hidden: isEditorVisible }),
    [isEditorVisible],
  );

  return (
    <div id="editor-manager" className={className}>
      {/* text-gray-600, not -500: this sits directly on the page's
          bg-gray-100 background (Finding 11), not a white card -- -500
          dropped just under 4.5:1 against that background, caught by a
          real-browser axe scan. */}
      <span className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
        Template
      </span>
      <ContactEditor />
      <HeaderEditor />
      <ParagraphEditor />
      <ExperienceEditor />
      <AnyListEditor />
    </div>
  );
}
