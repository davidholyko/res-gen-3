import { describe, expect, it } from 'vitest';

import type { ContentAll } from '@/types/content-all';

import { deriveMacroLabel } from './derive-macro-label';

// Minimal item factory -- only contentType/content matter to the label.
function item(contentType: string, content: unknown): ContentAll {
  return {
    contentId: 'x' as ContentAll['contentId'],
    contentType,
    content,
  } as ContentAll;
}

describe('deriveMacroLabel', () => {
  it('labels a CONTACT by name', () => {
    expect(deriveMacroLabel(item('CONTACT', { name: 'Ada Lovelace' }))).toEqual(
      {
        typeLabel: 'Contact',
        summary: 'Ada Lovelace',
      },
    );
  });

  it('labels a HEADER by its heading text', () => {
    expect(deriveMacroLabel(item('HEADER', { header: 'Summary' }))).toEqual({
      typeLabel: 'Section heading',
      summary: 'Summary',
    });
  });

  it('labels a PARAGRAPH by its text', () => {
    expect(deriveMacroLabel(item('PARAGRAPH', { paragraph: 'Hello' }))).toEqual(
      {
        typeLabel: 'Paragraph',
        summary: 'Hello',
      },
    );
  });

  it('labels an EXPERIENCE by company and title, joined', () => {
    expect(
      deriveMacroLabel(
        item('EXPERIENCE', { company: 'Acme', title: 'Engineer' }),
      ),
    ).toEqual({ typeLabel: 'Experience', summary: 'Acme — Engineer' });
  });

  it('omits an empty title from an EXPERIENCE summary', () => {
    expect(
      deriveMacroLabel(item('EXPERIENCE', { company: 'Acme', title: '' })),
    ).toEqual({ typeLabel: 'Experience', summary: 'Acme' });
  });

  it('labels an ANY_LIST by its group keys', () => {
    expect(
      deriveMacroLabel(item('ANY_LIST', { Gears: ['a'], Skills: ['b'] })),
    ).toEqual({ typeLabel: 'List', summary: 'Gears, Skills' });
  });

  it('truncates a long summary with an ellipsis', () => {
    const long = 'x'.repeat(80);
    const { summary } = deriveMacroLabel(
      item('PARAGRAPH', { paragraph: long }),
    );
    expect(summary).toHaveLength(60);
    expect(summary.endsWith('…')).toBe(true);
  });
});
