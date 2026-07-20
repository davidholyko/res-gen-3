export const CONTENT_TYPES = {
  CONTACT: 'CONTACT',
  HEADER: 'HEADER',
  EXPERIENCE: 'EXPERIENCE',
  PARAGRAPH: 'PARAGRAPH',
  ANY_LIST: 'ANY_LIST',
} as const;

// Plain-language names for user-facing UI (the "+ Add block" menu) --
// internal identifiers like ANY_LIST leak nothing to users
// (specs/editor-redesign.md, The user's journey → Journey-driven
// additions). Order here is the order the menu lists them in.
export const CONTENT_TYPE_LABELS: Record<keyof typeof CONTENT_TYPES, string> = {
  CONTACT: 'Contact details',
  HEADER: 'Section heading',
  PARAGRAPH: 'Paragraph',
  EXPERIENCE: 'Experience',
  ANY_LIST: 'Custom list',
};

// What a freshly added block starts as: required keys present but empty,
// nothing copied from anyone's example content
// (specs/editor-redesign.md, Design → Content editing).
export const BLANK_CONTENT: Record<
  keyof typeof CONTENT_TYPES,
  Record<string, unknown>
> = {
  CONTACT: { name: '', email: '' },
  HEADER: { header: '' },
  PARAGRAPH: { paragraph: '' },
  EXPERIENCE: { title: '', company: '' },
  ANY_LIST: {},
};

export const LAYOUTS = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  DOUBLE_LEFT: 'DOUBLE_LEFT',
  DOUBLE_RIGHT: 'DOUBLE_RIGHT',
} as const;

// DOM id of the canvas-side edit panel (specs/canvas-edit-panel.md) --
// BaseMacro's outside-click/blur logic treats anything inside it as
// "inside the focused block".
export const CANVAS_EDIT_PANEL_ID = 'canvas-edit-panel';
