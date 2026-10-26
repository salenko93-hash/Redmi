import {
  HYDRO_ZERO,
  HYDRO_PX_PER_NEWTON,
  hydroGeometry,
} from "@/lib/hydro-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: string | number) => String(v).replace(".", ",");
export function HydroScene({
  parameters: p,
  result: r,
  phase,
}: {
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
}) {
  const water = hydroGeometry(p.volume, r.values.P1, r.values.P2, phase);
  const airPointer = HYDRO_ZERO + r.values.P1 * HYDRO_PX_PER_NEWTON;
  const bodyColor = ["#a5bcb0", "#c9b995", "#acb8c9"][p.sample];
  function instrument(x: number, pointer: number, value: string | null) {
    const spring = Array.from(
      { length: 16 },
      (_, i) => `${x + (i % 2 ? -9 : 9)},${60 + (i * (pointer - 60)) / 15}`,
    ).join(" ");
    return (
      <g>
        <path
          d={`M${x - 22} 31H${x + 22}M${x} 31V45`}
          fill="none"
          stroke="#8ba18c"
          strokeWidth="3"
        />
        <rect
          x={x - 35}
          y="45"
          width="70"
          height="135"
          rx="12"
          fill="#fff"
          stroke="#86a48d"
          strokeWidth="2"
        />
        <polyline
          points={`${x},55 ${spring} ${x},${pointer}`}
          fill="none"
          stroke="#648575"
          strokeWidth="2"
        />
        <line x1={x} x2={x} y1={pointer} y2="180" stroke="#8b9f8d" />
        {Array.from({ length: 11 }, (_, n) => (
          <g key={n}>
            <line
              x1={x + 18}
              x2={x + (n % 2 ? 26 : 29)}
              y1={HYDRO_ZERO + n * HYDRO_PX_PER_NEWTON}
              y2={HYDRO_ZERO + n * HYDRO_PX_PER_NEWTON}
              stroke="#8a9f83"
            />
            {n % 2 === 0 && (
              <text
                x={x + 41}
                y={HYDRO_ZERO + n * HYDRO_PX_PER_NEWTON + 3}
                style={{ fontSize: 9 }}
              >
                {n}
              </text>
            )}
          </g>
        ))}
        <text x={x + 41} y="67" style={{ fontSize: 10 }}>
          Н
        </text>
        <line
          data-instrument={
            x === 135 ? "hydro-air-pointer" : "hydro-water-pointer"
          }
          x1={x + 11}
          x2={x + 30}
          y1={pointer}
          y2={pointer}
          stroke="#b48a40"
          strokeWidth="2"
        />
        <rect x={x - 32} y="158" width="62" height="20" rx="4" fill="#fff" />
        <text
          data-instrument={
            x === 135 ? "hydro-air-reading" : "hydro-water-reading"
          }
          x={x}
          y="172"
          textAnchor="middle"
          style={{ fontSize: 14, fontWeight: 650 }}
        >
          {value === null ? "—" : `${fmt(value)} Н`}
        </text>
      </g>
    );
  }
  return (
    <g>
      <text x="25" y="21">
        Зразок {String.fromCharCode(65 + p.sample)} · однакові шкали 0–10 Н
      </text>
      <g data-instrument="hydro-beaker">
        <rect
          data-instrument="hydro-water"
          x="309"
          y={water.surface}
          width="212"
          height="165"
          fill="#bfdfe4"
          opacity=".75"
        />
        <line
          x1="309"
          x2="521"
          y1={water.surface}
          y2={water.surface}
          stroke="#78a9b3"
        />
        <path
          d={`M305 ${water.surface - 16}V${water.bottom}H525V${water.surface - 16}`}
          fill="none"
          stroke="#83a3a9"
          strokeWidth="3"
        />
      </g>
      <line
        x1="135"
        x2="135"
        y1="180"
        y2={airPointer + 130}
        stroke="#728b79"
        strokeWidth="2"
      />
      <line
        data-instrument="hydro-water-string"
        x1="405"
        x2="405"
        y1="180"
        y2={water.bodyTop}
        stroke="#728b79"
        strokeWidth="2"
      />
      {instrument(135, airPointer, phase === 1 ? r.readings.P1 : null)}
      {instrument(405, water.pointer, phase === 1 ? r.readings.P2 : null)}
      <rect
        data-instrument="hydro-air-body"
        x={135 - water.size / 2}
        y={airPointer + 130}
        width={water.size}
        height={water.size}
        fill={bodyColor}
        stroke="#648575"
        strokeWidth="2"
      />
      <rect
        data-instrument="hydro-water-body"
        x={405 - water.size / 2}
        y={water.bodyTop}
        width={water.size}
        height={water.size}
        fill={bodyColor}
        stroke="#648575"
        strokeWidth="2"
      />
      <text x="135" y="386" textAnchor="middle">
        P₁ · у повітрі
      </text>
      <text x="135" y="414" textAnchor="middle" style={{ fontSize: 11 }}>
        Підвішене тіло у спокої
      </text>
      <text
        x="405"
        y={water.bottom + 24}
        textAnchor="middle"
        style={{ fontSize: 12 }}
      >
        {phase === 1
          ? "P₂ · повністю у воді"
          : water.fraction === 0
            ? "Підіймаємо посудину"
            : "Занурення триває"}
      </text>
      <text x="300" y="580" textAnchor="middle" style={{ fontSize: 11 }}>
        Нитка натягнута · немає контакту з дном і стінками
      </text>
    </g>
  );
}
