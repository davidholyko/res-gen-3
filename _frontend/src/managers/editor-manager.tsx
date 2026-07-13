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
      <ContactEditor />
      <HeaderEditor />
      <ParagraphEditor />
      <ExperienceEditor />
      <AnyListEditor />
    </div>
  );
}
