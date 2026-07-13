import '@/css/index.css';

import c from 'classnames';
import type { Metadata } from 'next';

type RootLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: 'Res Gen 3',
  description: 'Make a Resume',
};

export default function RootLayout({ children }: RootLayoutProps) {
  const className = c({
    'ml-1': true,
    'ml-2': true,
    'ml-3': true,
    'ml-4': true,
    'ml-5': true,
    'max-w-full': true,
    'color-blue': true,
    'border-black': true,
    'border-1': true,
  });

  return (
    <html lang="en">
      {/* bg-gray-100: without it, the margin justify-center leaves on a
          wide viewport was indistinguishable from a cut-off layout -- this
          reads it as intentional page background instead
          (specs/app-ux-improvements.md, Finding 11). */}
      <body className="bg-gray-100">
        {/* This div is for classnames that will be converted to PDF */}
        <div
          id="pdf-tailwind-bootstrapper"
          className={className}
          style={{ display: 'none' }}
        />
        {children}
      </body>
    </html>
  );
}
