import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      mono: ['monospace'],
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      width: {
        '9ch': '9ch',
        '40ch': '40ch',
        '60ch': '60ch',
      },
      height: {
        '9ch': '9ch',
        '40ch': '40ch',
        '60ch': '60ch',
      },
    },
  },
  plugins: [
    function customStyles({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, Record<string, string>>) => void;
    }) {
      addUtilities({
        '.unstyled': {
          margin: '0',
          border: 'none',
          background: 'transparent',
          'box-sizing': 'border-box',
        },
      });
    },
  ],
};

export default config;
