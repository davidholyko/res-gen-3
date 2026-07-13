import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LAYOUTS } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentAll } from '@/types/content-all';

import MacroManager from './macro-manager';

const LAYOUT = { layoutId: 'a', layoutType: LAYOUTS.SINGLE };

function item(
  contentType: string,
  content: Record<string, unknown>,
): ContentAll {
  return {
    contentId: `${contentType}-1`,
    contentType,
    layoutId: LAYOUT.layoutId,
    layoutType: LAYOUT.layoutType,
    content,
  } as ContentAll;
}

describe('MacroManager', () => {
  it('renders one macro per supported content type', () => {
    const items = [
      item('CONTACT', { name: 'Ada' }),
      item('HEADER', { header: 'Summary' }),
      item('PARAGRAPH', { paragraph: 'Bio' }),
      item('EXPERIENCE', {
        company: 'Acme',
        title: 'Eng',
        startDate: '',
        endDate: '',
        bullets: [],
      }),
      item('ANY_LIST', { list: ['a'] }),
    ];

    const { container } = render(
      <AllProviders>
        <MacroManager items={items} />
      </AllProviders>,
    );

    expect(container.querySelector('.macro-manager')).not.toBeNull();
    expect(container.querySelector('.macro-manager')?.children).toHaveLength(5);
  });

  it('throws for an unsupported content type', () => {
    const items = [item('UNKNOWN', {})];

    expect(() =>
      render(
        <AllProviders>
          <MacroManager items={items} />
        </AllProviders>,
      ),
    ).toThrow(/Invalid item/);
  });
});
