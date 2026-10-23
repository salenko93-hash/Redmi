"use client";
import type { Experiment } from "@/lib/types";
import { axisField, number } from "@/lib/physics";
export function ExperimentGraph({
  experiment: e,
  rows,
  axes,
  onChange,
  readOnly = false,
}: {
  experiment: Experiment;
  rows: Record<string, string>[];
  axes?: { x: string; y: string };
  onChange?: (value: { x: string; y: string }) => void;
  readOnly?: boolean;
}) {
  if (!e.graph) return null;
  const x = axes?.x ?? e.graph.x,
    y = axes?.y ?? e.graph.y;
  const points = rows
    .map((r) => ({ x: number(r[x]), y: number(r[y]) }))
    .filter((p) => p.x !== null && p.y !== null) as { x: number; y: number }[];
  const maxX = Math.max(...points.map((p) => p.x), 0.01) * 1.15,
    maxY = Math.max(...points.map((p) => p.y), 0.01) * 1.15;
  return (
    <div className="experiment-graph">
      <h4>Графік за вашими даними</h4>
      <div className="graph-selects">
        <label>
          Горизонтальна вісь
          <select
            disabled={readOnly}
            value={x}
            onChange={(ev) => onChange?.({ x: ev.target.value, y })}
          >
            {e.fields
              .filter((f) => f.type !== "text")
              .map((f) => (
                <option key={f.key} value={f.key}>
                  {axisField(e, f.key)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Вертикальна вісь
          <select
            disabled={readOnly}
            value={y}
            onChange={(ev) => onChange?.({ x, y: ev.target.value })}
          >
            {e.fields
              .filter((f) => f.type !== "text")
              .map((f) => (
                <option key={f.key} value={f.key}>
                  {axisField(e, f.key)}
                </option>
              ))}
          </select>
        </label>
      </div>
      <svg
        viewBox="0 0 560 300"
        role="img"
        aria-label={`Графік: ${axisField(e, y)} від ${axisField(e, x)}`}
      >
        <rect x="58" y="30" width="460" height="220" fill="#fafbf8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="58"
              y1={250 - i * 55}
              x2="518"
              y2={250 - i * 55}
              stroke="#dde5dd"
            />
            <line
              x1={58 + i * 115}
              y1="30"
              x2={58 + i * 115}
              y2="250"
              stroke="#dde5dd"
            />
            <text
              x="50"
              y={254 - i * 55}
              textAnchor="end"
              fontSize="11"
              fill="#64736c"
            >
              {((maxY * i) / 4).toPrecision(2)}
            </text>
            <text
              x={58 + i * 115}
              y="268"
              textAnchor="middle"
              fontSize="11"
              fill="#64736c"
            >
              {((maxX * i) / 4).toPrecision(2)}
            </text>
          </g>
        ))}
        <path
          d="M58 25 V250 H525"
          fill="none"
          stroke="#355346"
          strokeWidth="1.5"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={58 + (p.x / maxX) * 460}
              cy={250 - (p.y / maxY) * 220}
              r="5"
              fill="#33725c"
            />
            <text
              x={67 + (p.x / maxX) * 460}
              y={246 - (p.y / maxY) * 220}
              fontSize="11"
              fill="#355346"
            >
              {i + 1}
            </text>
          </g>
        ))}
        <text x="285" y="292" textAnchor="middle" fontSize="12" fill="#355346">
          {axisField(e, x)}
        </text>
        <text x="58" y="16" fontSize="12" fill="#355346">
          {axisField(e, y)}
        </text>
      </svg>
      {!points.length && (
        <p className="muted">
          Точки з’являться після введення числових значень для вибраних осей.
        </p>
      )}
      <small className="muted">
        Точки відображають введені дані. Їх не підганяють під очікувану пряму.
      </small>
    </div>
  );
}
