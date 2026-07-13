type DragHandleIconProps = {
  className: string;
};

export default function DragHandleIcon({ className }: DragHandleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <path d="M1 5h18" stroke="#FFF" strokeWidth="2" />
      <path d="M1 10h18" stroke="#FFF" strokeWidth="2" />
      <path d="M1 15h18" stroke="#FFF" strokeWidth="2" />
    </svg>
  );
}
