import { render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AllProviders } from '@/test-providers';

import pkg from '../../../package.json';

const { contextState } = vi.hoisted(() => ({
  contextState: { pageCount: null as number | null },
}));
vi.mock('@/context/pdf-instance-context', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/context/pdf-instance-context')>();
  return {
    ...actual,
    usePdfInstance: () => ({
      instance: { url: null, blob: null, error: null, loading: false },
      pageCount: contextState.pageCount,
    }),
  };
});

const { default: ControlPanel } = await import('./control-panel');

beforeEach(() => {
  contextState.pageCount = null;
});

describe('ControlPanel', () => {
  it('renders the title, menus, and current version', () => {
    const { getByText, queryByText } = render(
      <AllProviders>
        <ControlPanel />
      </AllProviders>,
    );

    expect(getByText('Res Gen 3')).not.toBeNull();
    expect(getByText('File')).not.toBeNull();
    // No Edit menu: its add-layout actions moved onto the canvas
    // (specs/add-layout-beside-add-block.md).
    expect(queryByText('Edit')).toBeNull();
    expect(getByText('View')).not.toBeNull();
    expect(getByText(`v${pkg.version}`)).not.toBeNull();
  });

  it('shows the page-count indicator once the shared instance reports more than one page', () => {
    contextState.pageCount = 2;
    const { getByText } = render(
      <AllProviders>
        <ControlPanel />
      </AllProviders>,
    );

    expect(getByText('2 pages')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <ControlPanel />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
