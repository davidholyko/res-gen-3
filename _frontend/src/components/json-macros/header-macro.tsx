import type { ContentHeader } from '@/types/content-header';

import BaseMacro from './base-macro';

type HeaderMacroProps = ContentHeader;

export default function HeaderMacro(props: HeaderMacroProps) {
  const { content } = props;
  const { header } = content;

  return (
    <BaseMacro {...props}>
      {/*
        h2, not h3: ContactMacro's name is the page's only h1, so each
        resume section heading (this one) is a direct h2 child of it --
        no h2 to skip down from (WCAG 1.3.1).

        No <h2> at all while blank: a freshly added block starts empty
        (specs/editor-redesign.md, Phase 6), and an empty heading element
        is an axe violation (empty-heading) -- a placeholder paragraph
        marks the spot on the canvas instead. Canvas-only: the PDF
        renders from content via its own components, so nothing leaks
        into the document.
      */}
      {header ? (
        <h2 className="text-xl text-center border-b border-black">{header}</h2>
      ) : (
        <p className="text-center italic text-gray-600">
          Empty section heading
        </p>
      )}
    </BaseMacro>
  );
}
