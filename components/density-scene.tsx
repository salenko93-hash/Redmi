import {
  densityImmersion,
  rockOutline,
  densityBlockGeometry,
  densityCoordinate as q,
  CYLINDER_BASE,
  cylinderLevel,
} from "@/lib/density-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import {
  DensityDefinitions,
  DensityBench,
  DensityScale,
  DensityCylinder,
  DensityRuler,
  DensityMiniBlock,
} from "./density-equipment";
const fmt = (v: string | number) => String(v).replace(".", ",");
function RoughSample({
  id,
  sample,
  points,
  mini = false,
}: {
  id: string;
  sample: number;
  points?: string;
  mini?: boolean;
}) {
  return (
    <g>
      <polygon
        data-instrument={mini ? undefined : "density-rock"}
        points={
          points ?? "-19,-4 -21,-15 -13,-30 4,-32 20,-22 23,-9 15,0 -13,1"
        }
        fill={`url(#${id}-sample-${sample})`}
        stroke="#718776"
        strokeWidth={mini ? 0.7 : 1.2}
      />
    </g>
  );
}
export function DensityScene({
  experiment,
  parameters: p,
  result: r,
  phase,
  id,
}: {
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  id: string;
}) {
  const v = r.values;
  if (experiment === "regular") {
    const g = densityBlockGeometry(p.l, p.d, p.h),
      { x, base, length: L, height: H, depthX: D, depthY: dy } = g;
    const front = `${x},${base - H} ${x + L},${base - H} ${x + L},${base} ${x},${base}`;
    return (
      <g data-instrument="density-installation" data-density-series="regular">
        <DensityDefinitions id={id} />
        <text x="28" y="27" style={{ fontWeight: 650, fontSize: 13 }}>
          Суцільний брусок · зразок {String.fromCharCode(65 + p.sample)}
        </text>
        <text x="28" y="47" style={{ fontSize: 10 }}>
          Вимірювання трьох розмірів та окреме зважування того самого зразка
        </text>
        <DensityBench id={id} top={352} />
        <ellipse
          cx={x + (L + D) / 2}
          cy={base + 3}
          rx={(L + D) / 2 + 8}
          ry="5"
          fill="#47613f"
          opacity=".13"
        />
        <polygon
          data-instrument="density-block-top"
          points={`${x},${base - H} ${x + D},${base - H - dy} ${x + L + D},${base - H - dy} ${x + L},${base - H}`}
          fill={["#e8d4ad", "#e7eeea", "#acbaad"][p.sample]}
          stroke="#819581"
          strokeWidth=".8"
        />
        <polygon
          points={`${x + L},${base - H} ${x + L + D},${base - H - dy} ${x + L + D},${base - dy} ${x + L},${base}`}
          fill={["#ac824e", "#91a4a2", "#5e7161"][p.sample]}
          stroke="#748b79"
          strokeWidth=".8"
        />
        <polygon
          data-instrument="density-block-front"
          points={front}
          fill={`url(#${id}-sample-${p.sample})`}
          stroke="#7c9078"
          strokeWidth=".8"
        />
        <defs>
          <clipPath id={`${id}-grain`}>
            <polygon points={front} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-grain)`}>
          {Array.from({ length: 10 }, (_, i) =>
            p.sample === 0 ? (
              <path
                key={i}
                d={`M${x + 3} ${base - H + 7 + i * 18}q${L * 0.3} -5 ${L * 0.55} 0t${L * 0.43} 0`}
                fill="none"
                stroke="#a0804f"
                strokeWidth=".65"
                opacity=".4"
              />
            ) : (
              <path
                key={i}
                d={`M${x + 2} ${base - H + 5 + i * 18}h${L - 4}`}
                stroke={p.sample === 1 ? "#f3f7f2" : "#c5d0bf"}
                strokeWidth=".6"
                opacity=".28"
              />
            ),
          )}
        </g>
        <path
          d={`M${x + 1} ${base - H + 1}H${x + L - 1}`}
          stroke="#f7f3dc"
          opacity=".8"
        />
        <DensityRuler
          x={x}
          y={366}
          max={8}
          label={`l = ${fmt(p.l)} см`}
          mark={p.l}
        />
        <DensityRuler
          x={37}
          y={base}
          max={5}
          vertical
          label={`h = ${fmt(p.h)} см`}
          mark={p.h}
        />
        <DensityRuler
          x={x + L + 5}
          y={base - 8}
          max={5}
          step={Math.sqrt(208)}
          angle={-33.6901}
          label={`d = ${fmt(p.d)} см`}
          mark={p.d}
        />
        <text x="499" y="209" textAnchor="middle" style={{ fontSize: 10 }}>
          Зважування зразка
        </text>
        <DensityScale
          x={420}
          y={260}
          id={id}
          value={`${fmt(r.readings.m)} г`}
          marker="density-mass"
        >
          <DensityMiniBlock id={id} sample={p.sample} />
        </DensityScale>
        <text x="300" y="436" textAnchor="middle" style={{ fontSize: 10 }}>
          Лінійки: поділка 1 мм · проєкція ширини скорочена
        </text>
        <text x="300" y="452" textAnchor="middle" style={{ fontSize: 10 }}>
          Об’єм і густину обчисли самостійно за показами приладів
        </text>
      </g>
    );
  }
  if (experiment === "irregular") {
    const state = densityImmersion(v.V1, v.V, p.size, phase),
      cx = 324;
    const points = rockOutline
      .map(
        ([x, y]) =>
          `${q(cx + x * state.radius)},${q(state.centerY + y * state.radius)}`,
      )
      .join(" ");
    return (
      <g data-instrument="density-installation" data-density-series="irregular">
        <DensityDefinitions id={id} />
        <text x="28" y="27" style={{ fontSize: 13, fontWeight: 650 }}>
          Визначення об’єму зануренням
        </text>
        <text x="28" y="47" style={{ fontSize: 10 }}>
          Та сама мензурка у двох станах · маса сухого зразка виміряна окремо
        </text>
        <DensityBench id={id} top={368} />
        <g data-instrument="density-stand">
          <path
            d="M376 367h28l5 7h-38Z"
            fill="#698573"
            stroke="#55725f"
            strokeWidth=".8"
          />
          <rect
            x="387"
            y="80"
            width="6"
            height="289"
            rx="2"
            fill={`url(#${id}-steel)`}
            stroke="#889e94"
            strokeWidth=".6"
          />
          <path
            d="M324 88h66"
            stroke="#788f80"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="384" y="82" width="12" height="12" rx="2" fill="#526f5b" />
          <path d="M396 88h6" stroke="#6e8775" strokeWidth="2" />
          <circle
            cx="403"
            cy="88"
            r="3"
            fill="#a9b7a2"
            stroke="#708671"
            strokeWidth=".7"
          />
        </g>
        <DensityCylinder
          id={id}
          x={52}
          volume={v.V1}
          label="До занурення · V₁"
          name="before"
        />
        <DensityCylinder
          id={id}
          x={282}
          volume={state.reading}
          label={phase === 1 ? "Повне занурення · V₂" : "Занурення зразка"}
          name="after"
        >
          <line
            data-instrument="density-holder"
            x1={cx}
            x2={cx}
            y1="88"
            y2={q(state.centerY - state.radius + 3)}
            stroke={p.sample === 0 ? "#9ba7a6" : "#728777"}
            strokeWidth={p.sample === 0 ? 2.2 : 0.8}
          />
          {p.sample === 0 && (
            <path d={`M${cx - 5} 88h10`} stroke="#7d9285" strokeWidth="2" />
          )}
          <RoughSample id={id} sample={p.sample} points={points} />
          <path
            d={`M${q(cx - 0.9 * state.radius)} ${q(state.centerY - state.radius)}L${q(cx - 0.2 * state.radius)} ${q(state.centerY)}L${q(cx + 0.7 * state.radius)} ${q(state.centerY - 0.95 * state.radius)}M${q(cx - 0.2 * state.radius)} ${q(state.centerY)}L${q(cx + 0.5 * state.radius)} ${q(state.centerY + state.radius)}`}
            fill="none"
            stroke={p.sample === 0 ? "#9a7e51" : "#d2dacc"}
            strokeWidth=".8"
            opacity=".6"
          />
          <defs>
            <clipPath id={`${id}-wet`}>
              <rect
                x="286"
                y={q(state.surface)}
                width="76"
                height={q(CYLINDER_BASE - state.surface + 8)}
              />
            </clipPath>
          </defs>
          <polygon
            points={points}
            fill="#8bc9d3"
            opacity=".16"
            clipPath={`url(#${id}-wet)`}
          />
        </DensityCylinder>
        <text x="325" y="397" textAnchor="middle" style={{ fontSize: 9 }}>
          {p.sample === 0 ? "Тонка спиця" : "Тонка нитка"}
        </text>
        <text x="501" y="225" textAnchor="middle" style={{ fontSize: 10 }}>
          Сухий зразок · маса
        </text>
        <DensityScale
          x={422}
          y={277}
          id={id}
          value={`${fmt(r.readings.m)} г`}
          marker="density-mass"
        >
          <RoughSample id={id} sample={p.sample} mini />
        </DensityScale>
        <text x="96" y="397" textAnchor="middle" style={{ fontSize: 9 }}>
          Шкала 0–250 мл
        </text>
        <text x="300" y="436" textAnchor="middle" style={{ fontSize: 10 }}>
          Поділка 10 мл · відлік води за нижньою точкою меніска
        </text>
        <text x="300" y="452" textAnchor="middle" style={{ fontSize: 9.5 }}>
          1 мл = 1 см³ · об’єм тонкого тримача в моделі не враховано
        </text>
      </g>
    );
  }
  const currentVolume = phase * v.V;
  const currentMass =
    phase === 1 ? r.readings.m2 : String(q(v.m1 + (v.m2 - v.m1) * phase));
  const liquid = p.sample === 1 ? "oil" : p.sample === 2 ? "liquid" : "water";
  return (
    <g data-instrument="density-installation" data-density-series="liquid">
      <DensityDefinitions id={id} />
      <text x="28" y="27" style={{ fontSize: 13, fontWeight: 650 }}>
        Зважування рідини з урахуванням тари
      </text>
      <text x="28" y="47" style={{ fontSize: 10 }}>
        Та сама суха посудина до та після наливання · два етапи вимірювання
      </text>
      <DensityBench id={id} top={468} />
      <DensityScale
        x={40}
        y={375}
        width={230}
        id={id}
        value={`${fmt(r.readings.m1)} г`}
        marker="liquid-empty-mass"
      />
      <DensityScale
        x={330}
        y={375}
        width={230}
        id={id}
        value={`${fmt(currentMass)} г`}
        marker="liquid-total-mass"
      />
      <DensityCylinder
        id={id}
        x={113}
        volume={0}
        label="01 / Порожня посудина · m₁"
        name="empty"
      />
      <DensityCylinder
        id={id}
        x={403}
        volume={currentVolume}
        liquid={liquid}
        label="02 / Посудина з рідиною · m₂"
        name="liquid"
      />
      {phase > 0 && phase < 1 && (
        <g data-instrument="density-pouring">
          <g transform="translate(530 95) rotate(-55)">
            <path
              d="M-27 -48H27V0Q0 9-27 0Z"
              fill={`url(#${id}-glass)`}
              stroke="#91afb1"
            />
            <path
              d={`M-23 ${q(-44 * (1 - phase))}H23V-1Q0 5-23-1Z`}
              fill={`url(#${id}-${liquid})`}
              opacity=".7"
            />
            <path
              d="M-30 -48h55l7-4-2 9"
              fill="none"
              stroke="#9fb9b8"
              strokeWidth="1.5"
            />
          </g>
          <path
            d={`M476 94Q447 108 445 ${q(cylinderLevel(currentVolume))}`}
            stroke={p.sample === 1 ? "#d7b757" : "#88bdc5"}
            strokeWidth="3"
            opacity=".65"
            fill="none"
          />
        </g>
      )}
      <text x="300" y="531" textAnchor="middle" style={{ fontSize: 10 }}>
        1 мл = 1 см³ · масу рідини й густину обчисли самостійно
      </text>
    </g>
  );
}
