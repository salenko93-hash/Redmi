import { pressureGeometry } from "@/lib/pressure-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: string | number) => String(v).replace(".", ",");
export function PressureScene({
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
  const face = experiment === "area" ? p.face : 0;
  const g = pressureGeometry(p.l, p.d, p.h, face);
  const x = 100,
    y = 260,
    top = y - g.vertical;
  const footprint = `${x},${y} ${x + g.width},${y} ${x + g.width + g.dx},${y - g.dy} ${x + g.dx},${y - g.dy}`;
  const cx = x + g.width / 2 + g.dx / 2;
  const arrow = `${id}-pressure-arrow`;
  const loads = experiment === "load" ? p.loads : 0;
  return (
    <g>
      <defs>
        <marker
          id={arrow}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0L7 3.5L0 7Z" fill="#a77e3d" />
        </marker>
      </defs>
      <text x="25" y="27">
        {experiment === "area"
          ? "Змінюємо грань · сила та сама"
          : "Змінюємо навантаження · грань та сама"}
      </text>
      <text x="25" y="51" style={{ fontSize: 12 }}>
        Брусок 200 г{loads ? ` + ${loads} × 100 г` : " · без тягарців"}
      </text>
      <path d="M35 270L78 205H310L267 270Z" fill="#dbe4ce" stroke="#acba99" />
      <path d="M35 270V281H267V270" fill="#bfcca9" stroke="#acba99" />
      <polygon
        data-instrument="pressure-contact"
        points={footprint}
        fill="#e5c174"
        stroke="#c29946"
        strokeWidth="4"
      />
      <polygon
        data-instrument="pressure-block-front"
        points={`${x},${top} ${x + g.width},${top} ${x + g.width},${y} ${x},${y}`}
        fill="#cbb58d"
        stroke="#8e7957"
      />
      <polygon
        data-instrument="pressure-block-side"
        points={`${x + g.width},${top} ${x + g.width + g.dx},${top - g.dy} ${x + g.width + g.dx},${y - g.dy} ${x + g.width},${y}`}
        fill="#ad966d"
        stroke="#8e7957"
      />
      <polygon
        data-instrument="pressure-block-top"
        points={`${x},${top} ${x + g.dx},${top - g.dy} ${x + g.width + g.dx},${top - g.dy} ${x + g.width},${top}`}
        fill="#e3d3b1"
        stroke="#8e7957"
      />
      {Array.from({ length: loads }, (_, i) => (
        <g data-instrument="pressure-load" key={i}>
          <rect
            x={cx - 17}
            y={top - g.dy / 2 - (i + 1) * 17}
            width="34"
            height="16"
            rx="3"
            fill="#7f9d8a"
            stroke="#5e7e69"
          />
          <text
            x={cx}
            y={top - g.dy / 2 - (i + 1) * 17 + 12}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#fff" }}
          >
            100 г
          </text>
        </g>
      ))}
      <line
        data-instrument="pressure-force"
        x1={cx}
        x2={cx}
        y1="282"
        y2={282 + r.values.F * 8}
        stroke="#a77e3d"
        strokeWidth="2"
        markerEnd={`url(#${arrow})`}
      />
      <text x={cx + 12} y={290 + r.values.F * 4} style={{ fontSize: 12 }}>
        F на опору
      </text>
      <text x="35" y="333" style={{ fontSize: 12 }}>
        Опорна грань · вигляд згори
      </text>
      <rect
        data-instrument="pressure-footprint"
        x="80"
        y="350"
        width={g.width}
        height={g.depth}
        fill="#f2e5bc"
        stroke="#b89750"
        strokeWidth="2"
      />
      <text
        x={80 + g.width / 2}
        y={370 + g.depth}
        textAnchor="middle"
        style={{ fontSize: 12 }}
      >
        a = {fmt(g.a)} м
      </text>
      <text x={90 + g.width} y={355 + g.depth / 2} style={{ fontSize: 12 }}>
        b = {fmt(g.b)} м
      </text>
      <rect
        x="350"
        y="88"
        width="225"
        height="278"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="369" y="119">
        Сила тиску
      </text>
      <text
        data-instrument="pressure-force-reading"
        x="369"
        y="152"
        style={{ fontSize: 24, fontWeight: 650 }}
      >
        {phase === 1 ? `${fmt(r.readings.F)} Н` : "—"}
      </text>
      {experiment === "area" ? (
        <g>
          <text x="369" y="198">
            Розміри опорної грані
          </text>
          <text x="369" y="228">
            a = {fmt(r.readings.a)} м
          </text>
          <text x="369" y="258">
            b = {fmt(r.readings.b)} м
          </text>
          <text x="369" y="308" style={{ fontSize: 12 }}>
            S = a · b обчисли самостійно
          </text>
        </g>
      ) : (
        <g>
          <text x="369" y="198">
            Площа опорної грані
          </text>
          <text
            data-instrument="pressure-area-reading"
            x="369"
            y="231"
            style={{ fontSize: 21, fontWeight: 650 }}
          >
            {fmt(r.readings.S)} м²
          </text>
          <text x="369" y="280" style={{ fontSize: 12 }}>
            l · d — найбільша грань
          </text>
        </g>
      )}
      <text x="369" y="341" style={{ fontSize: 12 }}>
        Тиск у Па обчисли самостійно
      </text>
      <text x="300" y="450" textAnchor="middle" style={{ fontSize: 11 }}>
        Розміри показано в спільному масштабі · деформації немає
      </text>
    </g>
  );
}
