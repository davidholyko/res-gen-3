import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadFontsMock } = vi.hoisted(() => ({ loadFontsMock: vi.fn() }));
vi.mock('@/utils/pdf-font-loader-util', () => ({
  default: loadFontsMock,
}));

const { default: Page } = await import('./page');

beforeEach(() => {
  loadFontsMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  document.head.innerHTML = '';
});

describe('Page', () => {
  it('shows a loading state until stylesheets are available, then renders the app', () => {
    render(<Page />);

    expect(screen.getByText('Loading...')).not.toBeNull();
    expect(loadFontsMock).toHaveBeenCalledTimes(1);

    // jsdom starts with no stylesheets, so the first poll tick(s) should
    // find none and keep waiting.
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByText('Loading...')).not.toBeNull();

    // Now simulate one becoming available and let the next poll pick it up.
    document.head.appendChild(document.createElement('style'));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.queryByText('Loading...')).toBeNull();
    expect(document.querySelector('#res-gen')).not.toBeNull();
    expect(screen.getByText('ResGen 2.0')).not.toBeNull();
  });
});
