import { render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const { default: PageCountIndicator } = await import('./page-count-indicator');

beforeEach(() => {
  contextState.pageCount = null;
});

describe('PageCountIndicator', () => {
  it('renders nothing when pageCount is null', () => {
    const { container } = render(<PageCountIndicator />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a single-page resume', () => {
    contextState.pageCount = 1;
    const { container } = render(<PageCountIndicator />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a badge with the real page count once it exceeds one page', () => {
    contextState.pageCount = 3;
    const { getByText, getByRole } = render(<PageCountIndicator />);

    expect(getByText('3 pages')).not.toBeNull();
    expect(getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has no automatically detectable accessibility violations', async () => {
    contextState.pageCount = 2;
    const { container } = render(<PageCountIndicator />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
