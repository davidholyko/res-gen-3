type MoveIconProps = {
  className: string;
};

// A two-way arrow (FontAwesome "right-left") -- the glyph for the block
// toolbar's "Move to another layout" control
// (specs/move-block-between-layouts.md). Decorative here: the button
// that wraps it carries the accessible name.
export default function MoveIcon({ className }: MoveIconProps) {
  return (
    <svg
      className={className}
      style={{ width: '20px', height: '20px', fill: 'white' }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
    >
      <path d="M32 96l320 0 0-64c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l96 96c6.2 6.2 9.4 14.4 9.4 22.6s-3.2 16.4-9.4 22.6l-96 96c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-64L32 160c-17.7 0-32-14.3-32-32s14.3-32 32-32zM480 416l-320 0 0 64c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-96-96c-6.2-6.2-9.4-14.4-9.4-22.6s3.2-16.4 9.4-22.6l96-96c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 64 320 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
    </svg>
  );
}
