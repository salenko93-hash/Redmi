import {
  CYLINDER_BASE,
  ML_TO_PIXELS,
  densityImmersion,
  rockOutline,
} from "@/lib/density-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: string | number) => String(v).replace(".", ",");
function Cylinder({
  x,
  volume,
  label,
  name,
}: {
  x: number;
  volume: number;
  label: string;
  name: string;
}) {
  return (
    <g data-cylinder={name}>
      <rect
        x={x + 4}
        y={CYLINDER_BASE - volume * ML_TO_PIXELS}
        width="88"
        height={volume * ML_TO_PIXELS}
        fill="#badce2"
        opacity=".8"
        data-instrument="cylinder-water"
        data-volume={volume}
      />
      <path
        d={`M${x} 85V300Q${x + 48} 312 ${x + 96} 300V85`}
        fill="none"
        stroke="#7c9ca2"
        strokeWidth="3"
      />
      {Array.from({ length: 26 }, (_, i) => i * 10).map((v) => (
        <g key={v}>
          <line
            x1={x + (v % 50 ? 82 : 73)}
            x2={x + 94}
            y1={CYLINDER_BASE - v * ML_TO_PIXELS}
            y2={CYLINDER_BASE - v * ML_TO_PIXELS}
            stroke="#688a8e"
          />
          {v % 50 === 0 && (
            <text
              x={x + 102}
              y={CYLINDER_BASE - v * ML_TO_PIXELS + 4}
              style={{ fontSize: 10 }}
            >
              {v}
            </text>
          )}
        </g>
      ))}
      <text x={x + 100} y="92" style={{ fontSize: 10 }}>
        мл
      </text>
      <text x={x + 48} y="337" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
export function DensityScene({
  experiment,
  parameters: p,
  result: r,
  phase,
}: {
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
}) {
  const v = r.values;
  if (experiment === "regular") {
    const L = p.l * 30,
      D = p.d * 16,
      depthY = p.d * 10,
      H = p.h * 30;
    return (
      <g>
        <text x="28" y="25">
          Розміри суцільного бруска · зразок{" "}
          {String.fromCharCode(65 + p.sample)}
        </text>
        <polygon
          data-instrument="density-block-front"
          points={`110,${280 - H} ${110 + L},${280 - H} ${110 + L},280 110,280`}
          fill="#b8cdbf"
          stroke="#678b76"
        />
        <polygon
          data-instrument="density-block-top"
          points={`110,${280 - H} ${110 + D},${280 - H - depthY} ${110 + L + D},${280 - H - depthY} ${110 + L},${280 - H}`}
          fill="#dce7d7"
          stroke="#678b76"
        />
        <polygon
          points={`${110 + L},${280 - H} ${110 + L + D},${280 - H - depthY} ${110 + L + D},${280 - depthY} ${110 + L},280`}
          fill="#94b39f"
          stroke="#678b76"
        />
        <line
          data-instrument="block-length"
          x1="110"
          x2={110 + L}
          y1="311"
          y2="311"
          stroke="#8da17b"
        />
        {Array.from({ length: Math.round(p.l * 2) + 1 }, (_, i) => (
          <line
            key={i}
            x1={110 + i * 15}
            x2={110 + i * 15}
            y1="306"
            y2={i % 2 ? 316 : 321}
            stroke="#8da17b"
          />
        ))}
        <text x={110 + L / 2} y="342" textAnchor="middle">
          l = {fmt(p.l)} см
        </text>
        <path
          d={`M90 ${280 - H}V280 M85 ${280 - H}H95 M85 280H95`}
          fill="none"
          stroke="#8da17b"
        />
        <text x="75" y={280 - H / 2} textAnchor="end">
          h
        </text>
        <text x={120 + L + D / 2} y={299 - depthY / 2}>
          d
        </text>
        <rect
          x="466"
          y="60"
          width="116"
          height="234"
          rx="12"
          fill="#fff"
          stroke="#dbe5d2"
        />
        <text x="480" y="89">
          Терези
        </text>
        <text
          data-instrument="density-mass"
          x="480"
          y="119"
          style={{ fontSize: 18, fontWeight: 650 }}
        >
          {fmt(r.readings.m)} г
        </text>
        <text x="480" y="166">
          l = {fmt(p.l)} см
        </text>
        <text x="480" y="194">
          d = {fmt(p.d)} см
        </text>
        <text x="480" y="222">
          h = {fmt(p.h)} см
        </text>
        <text x="300" y="379" textAnchor="middle" style={{ fontSize: 11 }}>
          Проєкція схематична · об’єм і густину обчисли самостійно
        </text>
      </g>
    );
  }
  if (experiment === "irregular") {
    const state = densityImmersion(v.V1, v.V, p.size, phase);
    const points = rockOutline
      .map(
        ([x, y]) =>
          `${358 + x * state.radius},${state.centerY + y * state.radius}`,
      )
      .join(" ");
    return (
      <g>
        <text x="28" y="25">
          Витіснення води · однакова шкала
        </text>
        <Cylinder x={65} volume={v.V1} label="До занурення" name="before" />
        <Cylinder
          x={310}
          volume={state.reading}
          label="Після занурення"
          name="after"
        />
        <line
          x1="358"
          x2="358"
          y1="38"
          y2={state.centerY - state.radius}
          stroke="#728c76"
          strokeWidth={p.sample === 0 ? 3 : 1}
        />
        <text x="270" y="57" textAnchor="end" style={{ fontSize: 10 }}>
          {p.sample === 0 ? "Тонка спиця" : "Тонка нитка"}
        </text>
        <polygon
          data-instrument="density-rock"
          points={points}
          fill="#8da69a"
          stroke="#5c7e6a"
          strokeWidth="2"
        />
        <rect
          x="465"
          y="135"
          width="116"
          height="130"
          rx="12"
          fill="#fff"
          stroke="#dbe5d2"
        />
        <text x="478" y="161">
          Маса зразка
        </text>
        <text
          data-instrument="density-mass"
          x="478"
          y="191"
          style={{ fontSize: 17, fontWeight: 650 }}
        >
          {fmt(r.readings.m)} г
        </text>
        <text x="478" y="228" style={{ fontSize: 11 }}>
          {phase === 1
            ? "Повне занурення"
            : phase === 0
              ? "До занурення"
              : "Занурюємо зразок"}
        </text>
        <text x="300" y="379" textAnchor="middle" style={{ fontSize: 11 }}>
          1 мл = 1 см³ · об’єм тонкого тримача в моделі не враховано
        </text>
      </g>
    );
  }
  return (
    <g>
      <text x="28" y="25">
        Та сама посудина · та сама порція рідини
      </text>
      <Cylinder
        x={125}
        volume={phase * v.V}
        label="Мірна посудина"
        name="liquid"
      />
      <rect
        x="337"
        y="85"
        width="229"
        height="226"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="355" y="114">
        Порожня посудина, m₁
      </text>
      <text x="355" y="144" style={{ fontSize: 21, fontWeight: 650 }}>
        {fmt(r.readings.m1)} г
      </text>
      <text x="355" y="186">
        Посудина з рідиною, m₂
      </text>
      <text
        data-instrument="liquid-total-mass"
        x="355"
        y="216"
        style={{ fontSize: 21, fontWeight: 650 }}
      >
        {phase === 1 ? `${fmt(r.readings.m2)} г` : "—"}
      </text>
      <text x="355" y="262">
        Об’єм порції, V
      </text>
      <text x="355" y="291" style={{ fontSize: 19 }}>
        {phase === 1 ? `${fmt(r.readings.V)} см³` : "Дочекайся наливання"}
      </text>
      <text x="300" y="379" textAnchor="middle" style={{ fontSize: 11 }}>
        1 мл = 1 см³ · масу рідини й густину обчисли самостійно
      </text>
    </g>
  );
}
