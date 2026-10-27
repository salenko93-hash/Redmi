import {
  HYDRO_ZERO,
  HYDRO_PX_PER_NEWTON,
  HYDRO_BODY_OFFSET,
  hydroGeometry,
  hydroCoordinate as q,
} from "@/lib/hydro-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import {
  HydroDefinitions,
  HydroStand,
  HydroGauge,
  HydroSample,
  HydroLift,
} from "./hydro-equipment";
export function HydroScene({
  parameters: p,
  result: r,
  phase,
  id,
}: {
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  id: string;
}) {
  const water = hydroGeometry(p.volume, r.values.P1, r.values.P2, phase);
  const airPointer = HYDRO_ZERO + r.values.P1 * HYDRO_PX_PER_NEWTON;
  const airTop = airPointer + HYDRO_BODY_OFFSET;
  const waterPath = `M300 ${q(water.surface)}Q405 ${q(water.surface + 10)} 510 ${q(water.surface)}V${q(water.bottom - 6)}Q405 ${q(water.bottom + 9)} 300 ${q(water.bottom - 6)}Z`;
  return (
    <g
      data-instrument="hydro-installation"
      data-submerged-fraction={q(water.fraction)}
    >
      <HydroDefinitions id={id} />
      <defs>
        <clipPath id={`${id}-water-clip`}>
          <rect
            x="300"
            y={q(water.surface)}
            width="210"
            height={q(water.bottom - water.surface + 2)}
          />
        </clipPath>
      </defs>
      <text x="25" y="23" style={{ fontSize: 14, fontWeight: 650 }}>
        Зразок {String.fromCharCode(65 + p.sample)} · два стани того самого тіла
      </text>
      <path d="M23 675H577l13 13H10Z" fill="#ddc49e" />
      <rect
        x="10"
        y="687"
        width="580"
        height="12"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M28 699H572V710H28Z M44 710H64V720H44Z M536 710H556V720H536Z"
        fill="#9d7b51"
      />
      <HydroStand id={id} x={45} axis={135} />
      <HydroStand id={id} x={565} axis={405} />
      <HydroLift id={id} water={water} />
      <g data-instrument="hydro-beaker-back">
        <path
          d={`M296 ${q(water.rim)}V${q(water.bottom - 3)}Q405 ${q(water.bottom + 14)} 514 ${q(water.bottom - 3)}V${q(water.rim)}`}
          fill={`url(#${id}-glass)`}
          stroke="#98b7b7"
          strokeWidth="1.2"
        />
        <ellipse
          cx="405"
          cy={q(water.rim)}
          rx="109"
          ry="9"
          fill="#e8f4ec"
          fillOpacity=".25"
          stroke="#9eb8b3"
          strokeWidth="1.2"
        />
        <path d={waterPath} fill={`url(#${id}-water)`} />
        <ellipse
          cx="405"
          cy={q(water.surface)}
          rx="105"
          ry="5"
          fill="#b6dee0"
          opacity=".8"
          stroke="#83b3b9"
          strokeWidth=".8"
        />
        <rect
          data-instrument="hydro-water"
          x="300"
          y={q(water.surface)}
          width="210"
          height={q(water.bottom - water.surface)}
          fill="none"
        />
        <line
          data-instrument="hydro-empty-surface"
          x1="304"
          x2="337"
          y1={q(water.emptySurface)}
          y2={q(water.emptySurface)}
          stroke="#a6baba"
          strokeWidth=".7"
          strokeDasharray="2 2"
        />
      </g>
      {[
        { axis: 135, pointer: airPointer, top: airTop, kind: "air" as const },
        {
          axis: 405,
          pointer: water.pointer,
          top: water.bodyTop,
          kind: "water" as const,
        },
      ].map((s) => (
        <g key={s.kind}>
          <line
            data-instrument={`hydro-${s.kind}-string`}
            x1={s.axis - 8}
            x2={s.axis - 8}
            y1={q(s.pointer + 157)}
            y2={q(s.top)}
            stroke="#62766b"
            strokeWidth="1.1"
          />
          <HydroGauge id={id} x={s.axis} pointer={s.pointer} kind={s.kind} />
          <HydroSample
            id={id}
            x={s.axis}
            top={s.top}
            size={water.size}
            sample={p.sample}
            kind={s.kind}
          />
        </g>
      ))}
      <g data-instrument="hydro-beaker" pointerEvents="none">
        <g clipPath={`url(#${id}-water-clip)`}>
          <rect
            x="300"
            y={q(water.surface)}
            width="210"
            height={q(water.bottom - water.surface + 2)}
            fill="#86bccb"
            opacity=".18"
          />
        </g>
        <path
          d={`M297 ${q(water.rim + 2)}V${q(water.bottom - 4)}Q405 ${q(water.bottom + 12)} 513 ${q(water.bottom - 4)}V${q(water.rim + 2)}`}
          fill="none"
          stroke="#7fa5a7"
          strokeWidth="2"
        />
        <path
          d={`M304 ${q(water.rim + 16)}V${q(water.bottom - 19)}`}
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          opacity=".65"
        />
        <path
          d={`M505 ${q(water.rim + 18)}V${q(water.bottom - 18)}`}
          fill="none"
          stroke="#eff9ef"
          strokeWidth="1.5"
          opacity=".8"
        />
        <path
          d={`M296 ${q(water.rim)}Q405 ${q(water.rim + 18)} 514 ${q(water.rim)}`}
          fill="none"
          stroke="#8caead"
          strokeWidth="1.5"
        />
      </g>
      <text
        x="135"
        y="464"
        textAnchor="middle"
        style={{ fontSize: 15, fontWeight: 650 }}
      >
        P₁ · у повітрі
      </text>
      <text x="135" y="486" textAnchor="middle" style={{ fontSize: 11 }}>
        Порівнюємо з тим самим зразком
      </text>
      <rect
        x="78"
        y="520"
        width="178"
        height="103"
        rx="12"
        fill="#fff"
        stroke="#dce5d4"
      />
      <text x="95" y="544" style={{ fontSize: 12 }}>
        Маса не змінюється
      </text>
      <text x="95" y="572" style={{ fontSize: 19, fontWeight: 650 }}>
        P₂ + FА = P₁
      </text>
      <text x="95" y="599" style={{ fontSize: 11 }}>
        Густину знайди самостійно
      </text>
      {[
        { x: 135, key: "P1", kind: "air", label: "Показ у повітрі" },
        { x: 405, key: "P2", kind: "water", label: "Показ після занурення" },
      ].map((s) => (
        <g key={s.key}>
          <text x={s.x} y="740" textAnchor="middle" style={{ fontSize: 11 }}>
            {s.key === "P1"
              ? s.label
              : phase === 1
                ? "Повністю у воді"
                : water.fraction === 0
                  ? "Підіймаємо посудину"
                  : "Часткове занурення"}
          </text>
          <rect
            x={s.x - 59}
            y="748"
            width="118"
            height="27"
            rx="8"
            fill="#fff"
            stroke="#dce5d4"
          />
          <text
            data-instrument={`hydro-${s.kind}-reading`}
            x={s.x}
            y="767"
            textAnchor="middle"
            style={{ fontSize: 16, fontWeight: 650 }}
          >
            {phase === 1 ? r.readings[s.key].replace(".", ",") + " Н" : "—"}
          </text>
        </g>
      ))}
      <text x="300" y="796" textAnchor="middle" style={{ fontSize: 10 }}>
        Шкали 0–10 Н · поділка 0,2 Н · цифрові значення ідеальні
      </text>
    </g>
  );
}
