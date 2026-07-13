import { Font } from '@react-pdf/renderer';

import { basePath } from '@/base-path';

// Fonts are served from public/fonts (not imported as modules) so this
// works the same way under Turbopack as it did under res-gen-2's custom
// Webpack file-loader rule -- no bundler-specific asset handling needed.
const fontUrl = (fileName: string) => `${basePath}/fonts/${fileName}`;

export default function loadFonts() {
  // @react-pdf/renderer v4 dropped the top-level `format` option (was
  // 'truetype' for these .ttf files); format is now inferred automatically.
  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: fontUrl('Roboto-Regular.ttf'),
      },
      {
        src: fontUrl('Roboto-Bold.ttf'),
        fontWeight: 'bold',
      },
      {
        src: fontUrl('Roboto-Italic.ttf'),
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
      {
        src: fontUrl('Roboto-BoldItalic.ttf'),
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
    ],
  });
}

/**
 * @see https://react-pdf.org/fonts#disabling-hyphenation
 *
 * @param word
 * @returns {string[]} word array
 */
const hyphenationCallback = (word: string) => [word];

Font.registerHyphenationCallback(hyphenationCallback);
