import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ContentAll } from '@/types/content-all';

import MacroContent from './macro-content';

function item(contentType: string, content: unknown): ContentAll {
  return { contentId: 'x', contentType, content } as unknown as ContentAll;
}

describe('MacroContent', () => {
  it('renders CONTACT content', () => {
    const { getByText } = render(
      <MacroContent item={item('CONTACT', { name: 'Ada Lovelace' })} />,
    );
    expect(getByText('Ada Lovelace')).not.toBeNull();
  });

  it('renders HEADER content', () => {
    const { getByText } = render(
      <MacroContent item={item('HEADER', { header: 'Summary' })} />,
    );
    expect(getByText('Summary')).not.toBeNull();
  });

  it('renders PARAGRAPH content', () => {
    const { getByText } = render(
      <MacroContent item={item('PARAGRAPH', { paragraph: 'Hello there' })} />,
    );
    expect(getByText('Hello there')).not.toBeNull();
  });

  it('renders EXPERIENCE content', () => {
    const { getByText } = render(
      <MacroContent
        item={item('EXPERIENCE', { company: 'Acme', title: 'Engineer' })}
      />,
    );
    expect(getByText('Acme')).not.toBeNull();
    expect(getByText('Engineer')).not.toBeNull();
  });

  it('renders ANY_LIST content', () => {
    const { getByText } = render(
      <MacroContent item={item('ANY_LIST', { Skills: ['a', 'b'] })} />,
    );
    expect(getByText('Skills:')).not.toBeNull();
  });

  it('throws on an unknown content type', () => {
    expect(() => render(<MacroContent item={item('NOPE', {})} />)).toThrow(
      /Invalid item/,
    );
  });
});
