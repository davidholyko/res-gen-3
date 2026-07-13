import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerMock = vi.fn();
const registerHyphenationCallbackMock = vi.fn();

vi.mock('@react-pdf/renderer', () => ({
  Font: {
    register: (...args: unknown[]) => registerMock(...args),
    registerHyphenationCallback: (...args: unknown[]) =>
      registerHyphenationCallbackMock(...args),
  },
}));

describe('pdf-font-loader-util', () => {
  beforeEach(() => {
    vi.resetModules();
    registerMock.mockClear();
    registerHyphenationCallbackMock.mockClear();
  });

  it('registers the Roboto family with basePath-prefixed font URLs', async () => {
    const { default: loadFonts } = await import('./pdf-font-loader-util');

    loadFonts();

    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        family: 'Roboto',
        fonts: expect.arrayContaining([
          expect.objectContaining({
            src: '/app/fonts/Roboto-Regular.ttf',
          }),
          expect.objectContaining({
            src: '/app/fonts/Roboto-Bold.ttf',
            fontWeight: 'bold',
          }),
          expect.objectContaining({
            src: '/app/fonts/Roboto-Italic.ttf',
            fontStyle: 'italic',
          }),
          expect.objectContaining({
            src: '/app/fonts/Roboto-BoldItalic.ttf',
            fontWeight: 'bold',
            fontStyle: 'italic',
          }),
        ]),
      }),
    );
  });

  it('registers a hyphenation callback that disables hyphenation (returns the word as-is)', async () => {
    await import('./pdf-font-loader-util');

    expect(registerHyphenationCallbackMock).toHaveBeenCalledTimes(1);
    const hyphenationCallback = registerHyphenationCallbackMock.mock
      .calls[0][0] as (word: string) => string[];

    expect(hyphenationCallback('unbreakable')).toEqual(['unbreakable']);
  });
});
