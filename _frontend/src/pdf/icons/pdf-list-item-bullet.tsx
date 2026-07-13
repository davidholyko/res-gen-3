import { Circle, Svg } from '@react-pdf/renderer';

const svgStyle = {
  width: 12,
  height: 12,
};

type ListItemBulletProps = {
  style: Record<string, unknown>;
  debug?: boolean;
};

export default function ListItemBullet({
  debug = false,
  style = {},
}: ListItemBulletProps) {
  return (
    <Svg debug={debug} viewBox="0 0 10 10" style={{ ...svgStyle, ...style }}>
      <Circle cx="5" cy="5" r="1.5" fill="black" />
    </Svg>
  );
}
