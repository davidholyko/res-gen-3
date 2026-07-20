import { CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';

// A short, human label for a macro shown as a draggable card in the
// restructure view's palette (specs/restructure-view.md). The palette
// doesn't render the full styled resume block -- it shows a compact
// "what is this" card -- so this derives a plain-language type name plus
// a one-line summary from whatever the block's content happens to hold.
export type MacroLabel = { typeLabel: string; summary: string };

const SUMMARY_MAX = 60;

function truncate(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= SUMMARY_MAX) return trimmed;
  return `${trimmed.slice(0, SUMMARY_MAX - 1)}…`;
}

export function deriveMacroLabel(item: ContentAll): MacroLabel {
  switch (item.contentType) {
    case CONTENT_TYPES.CONTACT:
      return { typeLabel: 'Contact', summary: truncate(item.content.name) };
    case CONTENT_TYPES.HEADER:
      return {
        typeLabel: 'Section heading',
        summary: truncate(item.content.header),
      };
    case CONTENT_TYPES.PARAGRAPH:
      return {
        typeLabel: 'Paragraph',
        summary: truncate(item.content.paragraph),
      };
    case CONTENT_TYPES.EXPERIENCE: {
      const { company, title } = item.content;
      const summary = [company, title].filter(Boolean).join(' — ');
      return { typeLabel: 'Experience', summary: truncate(summary) };
    }
    case CONTENT_TYPES.ANY_LIST:
      return {
        typeLabel: 'List',
        summary: truncate(Object.keys(item.content).join(', ')),
      };
    // No default: ContentAll is a closed union of the five types above,
    // so every case is handled and there is no reachable fallthrough.
  }
}
