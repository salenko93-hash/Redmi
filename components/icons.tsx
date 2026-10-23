import {
  Activity,
  Orbit,
  Scale,
  Waves,
  MoveRight,
  FlaskConical,
  ArrowDownToLine,
  Wind,
  Cable,
  Compass,
} from "lucide-react";
export function LabIcon({
  number,
  size = 27,
}: {
  number: number;
  size?: number;
}) {
  const icons = [
    MoveRight,
    Orbit,
    Activity,
    Scale,
    FlaskConical,
    Cable,
    Wind,
    ArrowDownToLine,
    Waves,
    Compass,
  ];
  const Icon = icons[number - 1] ?? FlaskConical;
  return <Icon size={size} strokeWidth={1.6} />;
}
