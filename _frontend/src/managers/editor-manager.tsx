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
    // w-full + a bottom border: reads as a distinct ribbon bar spanning
    // the page, separated from the canvas below it
    // (specs/ribbon-layout.md). bg-white, not the page's bg-gray-100, so
    // floating panels opened from it (see base-editor.tsx) visually read
    // as "belonging to" this bar rather than blending into the page.
    <div
      id="editor-manager"
      className={c(className, 'w-full bg-white border-b border-gray-300 p-2')}
    >
      {/* text-gray-600, not -500: -500 dropped just under 4.5:1 against
          the page background, caught by a real-browser axe scan
          (Finding 11) -- kept here even though this bar is now white,
          in case it's ever reused somewhere that isn't. */}
      <span className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
        Template
      </span>
      <div className="flex flex-row flex-wrap items-start gap-2">
        <ContactEditor />
        <HeaderEditor />
        <ParagraphEditor />
        <ExperienceEditor />
        <AnyListEditor />
      </div>
    </div>
  );
}
