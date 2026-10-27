import { frictionGeometry, frictionCoordinate as q } from "@/lib/friction-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import {
  FrictionDefinitions,
  FrictionBoard,
  FrictionBlock,
  FrictionMeter,
} from "./friction-equipment";
const fmt = (value: number | string) => String(value).replace(".", ",");
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
  const g = frictionGeometry(p.side, phase),
    arrow = `${id}-friction-arrow`,
    normal = q(r.values.N * 12),
    friction = q(r.values.F * 12);
  const active = phase > 0,
    ready = phase === 1;
  return (
    <g
      data-instrument="friction-installation"
      data-motion-state={ready ? "snapshot" : active ? "sliding" : "ready"}
    >
      <FrictionDefinitions id={id} />
      <defs>
        <marker
          id={arrow}
          markerWidth="4.5"
          markerHeight="4.5"
          refX="4"
          refY="2.25"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0L4.5 2.25L0 4.5Z" fill="#4e7057" />
        </marker>
      </defs>
      <text x="25" y="27" style={{ fontSize: 13, fontWeight: 650 }}>
        {["Дерево по дереву", "Шорстке дерево", "Гладке дерево"][p.surface]}
      </text>
      <text x="25" y="49" style={{ fontSize: 10 }}>
        Брусок 200 г · {p.loads} × 100 г ·{" "}
        {p.side === 0 ? "широка грань" : "вузька грань"}
      </text>
      <FrictionBoard id={id} surface={p.surface} />
      <FrictionBlock id={id} g={g} loads={p.loads} />
      <line
        data-instrument="friction-rope"
        x1={q(g.right)}
        x2={q(g.meterX)}
        y1={q(g.pullY)}
        y2={q(g.pullY)}
        stroke="#7a8d70"
        strokeWidth="1.8"
      />
      <path
        d={`M${q(g.right + 2)} ${q(g.pullY - 0.5)}H${q(g.meterX - 2)}`}
        stroke="#dce3c7"
        strokeWidth=".5"
      />
      <g
        data-instrument="friction-meter"
        transform={`translate(${q(g.meterX)} ${q(g.pullY - 21)})`}
      >
        <FrictionMeter
          id={id}
          force={active ? q(r.values.F) : 0}
          ready={ready}
        />
      </g>
      <path
        d="M80 352H516l-6-4m6 4-6 4"
        fill="none"
        stroke="#96aa86"
        strokeWidth="1"
      />
      <text x="300" y="341" textAnchor="middle" style={{ fontSize: 10 }}>
        {ready
          ? "Зафіксований кадр рівномірного ковзання"
          : active
            ? "Усталене ковзання вправо · сила тяги врівноважує тертя"
            : "Запусти прохід · показ знімаємо під час рівномірного ковзання"}
      </text>
      <rect
        x="25"
        y="374"
        width="280"
        height="206"
        rx="12"
        fill="#fffdf7"
        stroke="#dbe4d1"
      />
      <text x="41" y="396" style={{ fontSize: 10, fontWeight: 600 }}>
        Сили · спільний умовний масштаб
      </text>
      <circle cx="158" cy="473" r="3" fill="#5d7d61" />
      <g stroke="#4e7057" strokeWidth="1.5" markerEnd={`url(#${arrow})`}>
        <line
          data-force="normal"
          x1="158"
          x2="158"
          y1="473"
          y2={473 - normal}
        />
        <line
          data-force="weight"
          x1="158"
          x2="158"
          y1="473"
          y2={473 + normal}
        />
        <line
          data-force="pull"
          x1="158"
          x2={158 + friction}
          y1="473"
          y2="473"
        />
        <line
          data-force="friction"
          x1="158"
          x2={158 - friction}
          y1="473"
          y2="473"
        />
      </g>
      <text x="169" y={477 - normal} style={{ fontSize: 11 }}>
        N
      </text>
      <text x="169" y={477 + normal} style={{ fontSize: 11 }}>
        mg
      </text>
      <text x={q(169 + friction)} y="468" style={{ fontSize: 10 }}>
        Fтяги
      </text>
      <text
        x={q(147 - friction)}
        y="468"
        textAnchor="end"
        style={{ fontSize: 10 }}
      >
        Fтертя
      </text>
      <text x="158" y="565" textAnchor="middle" style={{ fontSize: 9 }}>
        Схема для усталеного горизонтального руху
      </text>
      <rect
        x="325"
        y="374"
        width="250"
        height="206"
        rx="12"
        fill="#fffdf7"
        stroke="#dbe4d1"
      />
      <text x="343" y="400" style={{ fontSize: 10 }}>
        Реакція опори за загальною масою
      </text>
      <text
        data-instrument="friction-normal-reading"
        x="343"
        y="429"
        style={{ fontSize: 20, fontWeight: 650 }}
      >
        {fmt(r.readings.N)} Н
      </text>
      <text x="343" y="463" style={{ fontSize: 11 }}>
        Горизонтальна тяга · N = mg
      </text>
      <text x="343" y="493" style={{ fontSize: 13 }}>
        Fтяги = Fтертя
      </text>
      <text x="343" y="520" style={{ fontSize: 10 }}>
        Рівність під час рівномірного ковзання
      </text>
      <text x="343" y="561" style={{ fontSize: 10 }}>
        Коефіцієнт μ обчисли самостійно
      </text>
      <text x="300" y="604" textAnchor="middle" style={{ fontSize: 10 }}>
        Динамометр 0–5 Н · поділка 0,1 Н · початковий зрив не моделюється
      </text>
      <text x="300" y="622" textAnchor="middle" style={{ fontSize: 9.5 }}>
        Рух — ілюстрація проходу; час і шлях з анімації не вимірюємо
      </text>
    </g>
  );
}
