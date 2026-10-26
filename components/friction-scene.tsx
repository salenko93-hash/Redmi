import { FRICTION_FLOOR as floor, frictionGeometry } from "@/lib/friction-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: number | string) => String(v).replace(".", ",");
export function FrictionScene({
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
  const g = frictionGeometry(p.side, phase);
  const arrow = `${id}-friction-arrow`;
  const scale = 10,
    normal = r.values.N * scale,
    friction = r.values.F * scale;
  return (
    <g>
      <defs>
        <marker
          id={arrow}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0L7 3.5L0 7Z" fill="#496d56" />
        </marker>
      </defs>
      <text x="25" y="26">
        {["Дерево по дереву", "Шорстке дерево", "Гладке дерево"][p.surface]}
      </text>
      <text x="25" y="51" style={{ fontSize: 12 }}>
        Брусок 200 г · {p.loads} × 100 г ·{" "}
        {p.side === 0 ? "широка грань" : "вузька грань"}
      </text>
      <rect
        x="40"
        y={floor}
        width="520"
        height="13"
        rx="4"
        fill={
          p.surface === 1 ? "#ad9065" : p.surface === 2 ? "#dbcaa8" : "#c6af85"
        }
      />
      {p.surface !== 2 &&
        Array.from({ length: 26 }, (_, i) => (
          <line
            key={i}
            x1={44 + i * 20}
            x2={49 + i * 20}
            y1={floor + 3}
            y2={floor + 8}
            stroke="#947c59"
          />
        ))}
      <g
        data-instrument="friction-body"
        transform={`translate(${g.left},${g.top})`}
      >
        <rect
          data-instrument="friction-block"
          width={g.width}
          height={g.height}
          rx="4"
          fill="#cbb58d"
          stroke="#8c7956"
          strokeWidth="2"
        />
        {Array.from({ length: p.loads }, (_, i) => (
          <g data-instrument="friction-load" key={i}>
            <rect
              x={g.width / 2 - 18}
              y={-18 * (i + 1)}
              width="36"
              height="17"
              rx="3"
              fill="#819e8d"
              stroke="#5c7d6a"
            />
            <text
              x={g.width / 2}
              y={-18 * (i + 1) + 12}
              textAnchor="middle"
              style={{ fontSize: 9, fill: "#fff" }}
            >
              100 г
            </text>
          </g>
        ))}
      </g>
      <line
        data-instrument="friction-rope"
        x1={g.right}
        x2={g.meterX}
        y1={g.pullY}
        y2={g.pullY}
        stroke="#68866d"
        strokeWidth="3"
      />
      <g
        data-instrument="friction-meter"
        transform={`translate(${g.meterX},${g.pullY - 15})`}
      >
        <rect
          width="110"
          height="30"
          rx="8"
          fill="#fff"
          stroke="#729579"
          strokeWidth="2"
        />
        <text
          data-instrument="friction-force-reading"
          x="55"
          y="21"
          textAnchor="middle"
          style={{ fontSize: 16, fontWeight: 650 }}
        >
          {phase === 1 ? `${fmt(r.readings.F)} Н` : "—"}
        </text>
        <line
          x1="110"
          x2="138"
          y1="15"
          y2="15"
          stroke="#68866d"
          strokeWidth="3"
        />
      </g>
      <path
        d="M70 227H530L522 222M530 227L522 232"
        fill="none"
        stroke="#91a37d"
      />
      <rect
        x="25"
        y="245"
        width="290"
        height="174"
        rx="12"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="40" y="265" style={{ fontSize: 12 }}>
        Сили · спільний умовний масштаб
      </text>
      <circle cx="160" cy="335" r="5" fill="#55795f" />
      <g stroke="#496d56" strokeWidth="2" markerEnd={`url(#${arrow})`}>
        <line
          data-force="normal"
          x1="160"
          x2="160"
          y1="335"
          y2={335 - normal}
        />
        <line
          data-force="weight"
          x1="160"
          x2="160"
          y1="335"
          y2={335 + normal}
        />
        <line
          data-force="pull"
          x1="160"
          x2={160 + friction}
          y1="335"
          y2="335"
        />
        <line
          data-force="friction"
          x1="160"
          x2={160 - friction}
          y1="335"
          y2="335"
        />
      </g>
      <text
        x="160"
        y={325 - normal}
        textAnchor="middle"
        style={{ fontSize: 12 }}
      >
        N
      </text>
      <text
        x="160"
        y={350 + normal}
        textAnchor="middle"
        style={{ fontSize: 12 }}
      >
        mg
      </text>
      <text x={170 + friction} y="339" style={{ fontSize: 12 }}>
        Fтяги
      </text>
      <text
        x={150 - friction}
        y="339"
        textAnchor="end"
        style={{ fontSize: 12 }}
      >
        Fтертя
      </text>
      <rect
        x="335"
        y="245"
        width="240"
        height="174"
        rx="12"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="351" y="273">
        Реакція опори, N
      </text>
      <text
        data-instrument="friction-normal-reading"
        x="351"
        y="302"
        style={{ fontSize: 21, fontWeight: 650 }}
      >
        {fmt(r.readings.N)} Н
      </text>
      <text x="351" y="335" style={{ fontSize: 12 }}>
        У рівномірному русі:
      </text>
      <text x="351" y="361">
        Fтяги = Fтертя
      </text>
      <text x="351" y="393" style={{ fontSize: 11 }}>
        Коефіцієнт μ обчисли самостійно
      </text>
      <text x="300" y="447" textAnchor="middle" style={{ fontSize: 11 }}>
        Горизонтальна тяга · N = mg · тертя спокою не моделюється
      </text>
    </g>
  );
}
