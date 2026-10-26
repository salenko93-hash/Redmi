import {
  FLOATING_SURFACE as surface,
  FLOATING_FLOOR as floor,
  floatingGeometry,
  tubePath,
} from "@/lib/floating-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: string | number) => String(v).replace(".", ",");
export function FloatingScene({
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
  const v = r.values,
    g = floatingGeometry(p.volume, v.fraction, v.state, phase);
  const path = tubePath(175, g.top, g.radius, g.height);
  const fullBuoyancy = (p.liquid === 0 ? 1 : 1.03) * p.volume * 0.01;
  const buoyancy = fullBuoyancy * g.immersed;
  const support = g.onBottom ? Math.max(0, v.weight - buoyancy) : 0;
  const state =
    v.state > 0
      ? g.onBottom
        ? "На дні · у спокої"
        : "Тоне · рух до дна"
      : v.state === 0
        ? "Нейтральна плавучість"
        : phase === 1
          ? "На поверхні · рівновага"
          : "Спливає до поверхні";
  return (
    <g>
      <defs>
        <clipPath id={`${id}-tube`}>
          <path d={path} />
        </clipPath>
        <marker
          id={`${id}-arrow`}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0L7 3.5L0 7Z" fill="context-stroke" />
        </marker>
      </defs>
      <text x="25" y="25">
        {p.liquid === 0
          ? "Вода · основний дослід"
          : "Солона вода · додатковий дослід"}
      </text>
      <rect
        data-instrument="floating-water"
        x="49"
        y={surface}
        width="262"
        height={floor - surface}
        fill={p.liquid === 0 ? "#c0dfe5" : "#b3d8da"}
      />
      <path
        d={`M45 110V${floor}H315V110`}
        fill="none"
        stroke="#83a3a9"
        strokeWidth="3"
      />
      <line x1="49" x2="311" y1={surface} y2={surface} stroke="#7baab4" />
      <path
        data-instrument="floating-tube"
        d={path}
        fill="#f4f2dd"
        stroke="#718f79"
        strokeWidth="2"
      />
      {p.sand > 0 && (
        <rect
          x={175 - g.radius + 3}
          y={g.bottom - 7 - (p.sand / 80) * g.height * 0.65}
          width={2 * g.radius - 6}
          height={g.height}
          fill="#c4ae80"
          clipPath={`url(#${id}-tube)`}
        />
      )}
      <rect
        x={175 - g.radius}
        y={g.top}
        width={2 * g.radius}
        height="8"
        rx="2"
        fill="#8fa08b"
      />
      {g.onBottom && (
        <line
          x1="151"
          x2="199"
          y1={floor + 3}
          y2={floor + 3}
          stroke="#76856c"
          strokeWidth="4"
        />
      )}
      <text
        data-instrument="floating-status"
        x="175"
        y="426"
        textAnchor="middle"
        style={{ fontSize: 13 }}
      >
        {state}
      </text>
      <text x="175" y="451" textAnchor="middle" style={{ fontSize: 11 }}>
        {v.state === 0
          ? "Початково в спокої · зовнішніх опор немає"
          : "Пробірка закрита · нитка не натягнута"}
      </text>
      <rect
        x="349"
        y="65"
        width="227"
        height="403"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="368" y="96">
        Закрита система
      </text>
      <text data-instrument="floating-mass-reading" x="368" y="126">
        m = {fmt(r.readings.m)} г
      </text>
      <text data-instrument="floating-volume-reading" x="368" y="154">
        V = {fmt(r.readings.V)} см³
      </text>
      <text x="368" y="181" style={{ fontSize: 12 }}>
        ρрідини = {p.liquid === 0 ? "1" : "1,03"} г/см³
      </text>
      <line x1="368" x2="557" y1="200" y2="200" stroke="#dbe5d2" />
      <text x="368" y="225" style={{ fontSize: 12 }}>
        Сили · спільний умовний масштаб
      </text>
      <rect x="400" y="315" width="110" height="30" rx="8" fill="#f1f4e7" />
      <line
        data-floating-force="gravity"
        x1="455"
        x2="455"
        y1="330"
        y2={330 + v.weight * 100}
        stroke="#a8533c"
        strokeWidth="2"
        markerEnd={`url(#${id}-arrow)`}
      />
      <line
        data-floating-force="buoyancy"
        x1="420"
        x2="420"
        y1="330"
        y2={330 - buoyancy * 100}
        stroke="#297788"
        strokeWidth="2"
        markerEnd={`url(#${id}-arrow)`}
      />
      {support > 1e-10 && (
        <line
          data-floating-force="support"
          x1="490"
          x2="490"
          y1="330"
          y2={330 - support * 100}
          stroke="#84509b"
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
      )}
      <text x="468" y={345 + v.weight * 50} style={{ fontSize: 13 }}>
        mg
      </text>
      <text
        x="408"
        y={325 - buoyancy * 50}
        textAnchor="end"
        style={{ fontSize: 13 }}
      >
        FА
      </text>
      {support > 1e-10 && (
        <text x="502" y={325 - support * 50} style={{ fontSize: 13 }}>
          N
        </text>
      )}
      <text x="300" y="496" textAnchor="middle" style={{ fontSize: 11 }}>
        Рух схематичний · точки прикладання сил спрощено
      </text>
      <text x="300" y="518" textAnchor="middle" style={{ fontSize: 11 }}>
        Числові сили та середню густину обчисли самостійно
      </text>
    </g>
  );
}
