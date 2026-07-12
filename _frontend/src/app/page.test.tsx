import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders the getting-started heading', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: /to get started/i }),
    ).toBeInTheDocument();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<Home />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });

  it('links to the Next.js templates and docs', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /templates/i })).toHaveAttribute(
      'href',
      expect.stringContaining('vercel.com/templates'),
    );
    expect(
      screen.getByRole('link', { name: /documentation/i }),
    ).toHaveAttribute('href', expect.stringContaining('nextjs.org/docs'));
  });
});
