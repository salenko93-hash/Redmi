import {
  HYDRO_ZERO,
  HYDRO_PX_PER_NEWTON,
  hydroCoordinate as q,
} from "@/lib/hydro-view";
import type { hydroGeometry } from "@/lib/hydro-view";

export function HydroDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-steel`}>
        <stop stopColor="#647d77" />
        <stop offset=".25" stopColor="#eff4ec" />
        <stop offset=".6" stopColor="#a9bdb0" />
        <stop offset="1" stopColor="#668278" />
      </linearGradient>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor="#a6c6c6" stopOpacity=".55" />
        <stop offset=".15" stopColor="#fff" stopOpacity=".3" />
        <stop offset=".75" stopColor="#effaf6" stopOpacity=".12" />
        <stop offset="1" stopColor="#8cb2b5" stopOpacity=".5" />
      </linearGradient>
      <linearGradient id={`${id}-water`} x2="0" y2="1">
        <stop stopColor="#b3dee5" stopOpacity=".5" />
        <stop offset="1" stopColor="#7cb9c7" stopOpacity=".65" />
      </linearGradient>
      {["#aebbc1", "#9aabad", "#c6a077"].map((color, i) => (
        <linearGradient id={`${id}-sample-${i}`} key={i}>
          <stop stopColor={color} />
          <stop offset=".32" stopColor={["#edf1ed", "#d4ddd5", "#e4c19a"][i]} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      ))}
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#d9bc94" />
        <stop offset="1" stopColor="#b48955" />
      </linearGradient>
    </defs>
  );
}

export function HydroStand({
  id,
  x,
  axis,
}: {
  id: string;
  x: number;
  axis: number;
}) {
  return (
    <g data-instrument="hydro-stand">
      <ellipse cx={x} cy="672" rx="33" ry="5" fill="#41583f" opacity=".14" />
      <path
        d={`M${x - 25} 653h50l10 14q-35 10-70 0Z`}
        fill={`url(#${id}-steel)`}
        stroke="#6c8471"
      />
      <rect
        x={x - 4}
        y="39"
        width="8"
        height="618"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#8b9b89"
        strokeWidth=".6"
      />
      <path
        d={`M${x} 48H${axis}v8`}
        stroke="#afbeb1"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x={x - 8}
        y="39"
        width="16"
        height="19"
        rx="3"
        fill="#58735f"
        stroke="#47634f"
      />
      <path d={`M${x - 8} 49h-9`} stroke="#607b64" strokeWidth="3" />
      <path
        d={`M${axis} 54v4q-7 0-7 5t7 5q7 0 7-5`}
        stroke="#6e8474"
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
}

export function HydroGauge({
  id,
  x,
  pointer,
  kind,
}: {
  id: string;
  x: number;
  pointer: number;
  kind: "air" | "water";
}) {
  const end = q(pointer);
  const coil = Array.from({ length: 121 }, (_, i) => {
    const theta = (i / 120) * 10 * Math.PI * 2;
    return `${q(x - 8 + Math.sin(theta) * 9)},${q(72 + (i / 120) * (pointer - 72) + Math.sin((i / 120) * Math.PI) * Math.cos(theta) * 1.2)}`;
  }).join(" ");
  return (
    <g data-instrument={`hydro-${kind}-gauge`}>
      <rect
        x={x - 34}
        y="68"
        width="76"
        height="164"
        rx="11"
        fill={`url(#${id}-glass)`}
        stroke="#87a69a"
        strokeWidth="1.3"
      />
      <rect
        x={x + 9}
        y="78"
        width="29"
        height="143"
        rx="3"
        fill="#fffdf2"
        opacity=".92"
      />
      <path
        d={`M${x - 8} 69v3M${x - 8} ${end}V${q(pointer + 145)}`}
        stroke="#788f82"
        strokeWidth="2"
      />
      <polyline
        data-instrument={`hydro-${kind}-spring`}
        points={coil}
        fill="none"
        stroke="#657d74"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <polyline points={coil} fill="none" stroke="#d5e1d6" strokeWidth=".6" />
      {Array.from({ length: 51 }, (_, n) => {
        const y = q(HYDRO_ZERO + (n / 5) * HYDRO_PX_PER_NEWTON);
        return (
          <g key={n}>
            <line
              x1={x + 12}
              x2={x + (n % 5 === 0 ? 25 : 20)}
              y1={y}
              y2={y}
              stroke="#8d9374"
              strokeWidth=".6"
            />
            {n % 10 === 0 && (
              <text
                data-gauge-value={n / 5}
                x={x + 28}
                y={y + 3}
                style={{ fontSize: 8 }}
              >
                {n / 5}
              </text>
            )}
          </g>
        );
      })}
      <text x={x + 26} y="82" style={{ fontSize: 8 }}>
        Н
      </text>
      <line
        data-instrument={`hydro-${kind}-pointer`}
        x1={x - 10}
        x2={x + 23}
        y1={end}
        y2={end}
        stroke="#b38a45"
        strokeWidth="1.6"
      />
      <path d={`M${x + 7} ${q(pointer - 3)}l7 3-7 3Z`} fill="#b38a45" />
      <rect
        x={x - 33}
        y="220"
        width="74"
        height="13"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#879c89"
        strokeWidth=".6"
      />
      <path
        data-instrument={`hydro-${kind}-hook`}
        d={`M${x - 8} ${q(pointer + 145)}v2q-7 0-7 5t7 5q7 0 7-5`}
        stroke="#647e70"
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
}

export function HydroSample({
  id,
  x,
  top,
  size,
  sample,
  kind,
}: {
  id: string;
  x: number;
  top: number;
  size: number;
  sample: number;
  kind: "air" | "water";
}) {
  const left = x - size / 2,
    dx = size * 0.24,
    dy = size * 0.16;
  return (
    <g>
      <path
        d={`M${q(x - 8)} ${q(top - 7)}q-4 0-4 4t4 4q4 0 4-4t-4-4`}
        fill="none"
        stroke="#7e9285"
        strokeWidth="1.6"
      />
      <path
        d={`M${q(left)} ${q(top)}l${q(dx)} ${q(-dy)}h${q(size)}l${q(-dx)} ${q(dy)}Z`}
        fill={["#dce5df", "#bdc9c5", "#dfbc92"][sample]}
        stroke="#8c9c8f"
        strokeWidth=".7"
      />
      <path
        d={`M${q(left + size)} ${q(top)}l${q(dx)} ${q(-dy)}v${q(size)}l${q(-dx)} ${q(dy)}Z`}
        fill={["#97aaa5", "#798f8c", "#a38260"][sample]}
        stroke="#83978b"
        strokeWidth=".7"
      />
      <rect
        data-instrument={`hydro-${kind}-body`}
        x={q(left)}
        y={q(top)}
        width={q(size)}
        height={q(size)}
        fill={`url(#${id}-sample-${sample})`}
        stroke="#82958a"
        strokeWidth=".8"
      />
      {Array.from({ length: 4 }, (_, i) => (
        <line
          key={i}
          x1={q(left + 3)}
          x2={q(left + size - 3)}
          y1={q(top + 6 + (i * size) / 5)}
          y2={q(top + 6 + (i * size) / 5)}
          stroke="#fff"
          opacity=".16"
          strokeWidth=".5"
        />
      ))}
    </g>
  );
}

export function HydroLift({
  id,
  water: g,
}: {
  id: string;
  water: ReturnType<typeof hydroGeometry>;
}) {
  const top = g.bottom + 11,
    base = 670,
    mid = (top + base) / 2;
  const span = Math.sqrt(145 ** 2 - ((base - top) / 2) ** 2) / 2;
  return (
    <g data-instrument="hydro-lift">
      <path
        d={`M310 ${q(g.bottom + 4)}H510l5 7H305Z`}
        fill={`url(#${id}-steel)`}
        stroke="#879c87"
        strokeWidth=".8"
      />
      {[top, mid].map((y, i) => {
        const next = i === 0 ? mid : base;
        return (
          <g key={i} strokeLinecap="round">
            <path
              d={`M${q(405 - span)} ${q(y)}L${q(405 + span)} ${q(next)}M${q(405 + span)} ${q(y)}L${q(405 - span)} ${q(next)}`}
              stroke="#54715e"
              strokeWidth="6"
            />
            <path
              d={`M${q(405 - span)} ${q(y - 1)}L${q(405 + span)} ${q(next - 1)}`}
              stroke="#a5b8a3"
              strokeWidth="1.3"
            />
            <circle
              cx="405"
              cy={q((y + next) / 2)}
              r="3"
              fill="#d6ddc8"
              stroke="#5d7860"
            />
          </g>
        );
      })}
      <rect
        x="300"
        y="670"
        width="215"
        height="9"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#8c9f88"
      />
      <path
        d={`M${q(405 - span)} ${q(mid)}H535`}
        stroke="#b0bda6"
        strokeWidth="2"
      />
      <ellipse
        cx="536"
        cy={q(mid)}
        rx="3"
        ry="9"
        fill="#617b61"
        stroke="#4b674f"
      />
    </g>
  );
}
