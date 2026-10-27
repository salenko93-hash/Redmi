import {
  frictionCoordinate as q,
  frictionMeterGeometry,
  FRICTION_METER_PX_PER_N,
  FRICTION_FLOOR,
} from "@/lib/friction-view";
export function FrictionDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#dcc096" />
        <stop offset="1" stopColor="#b28650" />
      </linearGradient>
      <linearGradient id={`${id}-block`}>
        <stop stopColor="#c39c62" />
        <stop offset=".4" stopColor="#e3c99e" />
        <stop offset="1" stopColor="#b68d56" />
      </linearGradient>
      <linearGradient id={`${id}-brass`}>
        <stop stopColor="#9d824a" />
        <stop offset=".3" stopColor="#ecda9b" />
        <stop offset=".65" stopColor="#ccb174" />
        <stop offset="1" stopColor="#997e46" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x2="0" y2="1">
        <stop stopColor="#a2bcb5" stopOpacity=".8" />
        <stop offset=".23" stopColor="#f5faf1" stopOpacity=".7" />
        <stop offset=".5" stopColor="#dbe8e1" stopOpacity=".35" />
        <stop offset=".8" stopColor="#fff" stopOpacity=".75" />
        <stop offset="1" stopColor="#93aca2" stopOpacity=".8" />
      </linearGradient>
      <linearGradient id={`${id}-metal`}>
        <stop stopColor="#69857a" />
        <stop offset=".3" stopColor="#e7eee3" />
        <stop offset=".7" stopColor="#a5b9ab" />
        <stop offset="1" stopColor="#6f8b7a" />
      </linearGradient>
    </defs>
  );
}
export function FrictionBoard({
  id,
  surface,
}: {
  id: string;
  surface: number;
}) {
  const y = FRICTION_FLOOR;
  return (
    <g data-instrument="friction-board" data-surface={surface}>
      <path
        d={`M37 ${y - 17}H574L561 ${y}H24Z`}
        fill={["#d4bb91", "#c0a16f", "#e2d2b0"][surface]}
        stroke="#b29b72"
        strokeWidth=".7"
      />
      {Array.from({ length: surface === 1 ? 65 : 20 }, (_, i) => {
        const x = 39 + i * (surface === 1 ? 8 : 26);
        return (
          <path
            key={i}
            d={`M${x} ${y - 13}l${surface === 1 ? -8 : -4} 8`}
            stroke={surface === 2 ? "#eee5ca" : "#9f814d"}
            strokeWidth={surface === 1 ? 1 : 0.6}
            opacity={surface === 2 ? 0.6 : 0.35}
          />
        );
      })}
      <path
        d={`M24 ${y}H561V${y + 14}H24Z`}
        fill={`url(#${id}-wood)`}
        stroke="#b0956b"
        strokeWidth=".7"
      />
      <path d={`M561 ${y}l13-17v14l-13 17Z`} fill="#a17e4e" />
      <path d={`M23 ${y + 10}H578L589 ${y + 23}H12Z`} fill="#d8bd97" />
      <rect
        x="12"
        y={y + 22}
        width="577"
        height="10"
        rx="2"
        fill={`url(#${id}-wood)`}
      />
      <path
        d={`M29 ${y + 32}H571V${y + 43}H29Z M43 ${y + 43}H62V${y + 53}H43Z M538 ${y + 43}H557V${y + 53}H538Z`}
        fill="#99774f"
      />
    </g>
  );
}
export function FrictionBlock({
  id,
  g,
  loads,
}: {
  id: string;
  g: ReturnType<typeof import("@/lib/friction-view").frictionGeometry>;
  loads: number;
}) {
  return (
    <g
      data-instrument="friction-body"
      transform={`translate(${q(g.left)} ${q(g.top)})`}
    >
      <ellipse
        cx={g.width / 2 - 5}
        cy={g.height + 1}
        rx={g.width / 2 + 15}
        ry="4"
        fill="#634f30"
        opacity=".15"
      />
      <path
        d={`M0 0l-18-10h${g.width}l18 10Z`}
        fill="#e2c99f"
        stroke="#a88d64"
        strokeWidth=".8"
      />
      <path
        d={`M0 0l-18-10v${g.height}l18 10Z`}
        fill="#b38d58"
        stroke="#9a8057"
        strokeWidth=".8"
      />
      <rect
        data-instrument="friction-block"
        width={g.width}
        height={g.height}
        fill={`url(#${id}-block)`}
        stroke="#a08a63"
        strokeWidth=".8"
      />
      {Array.from(
        { length: Math.ceil((g.width < g.height ? g.width : g.height) / 13) },
        (_, i) => (
          <path
            key={i}
            d={
              g.width < g.height
                ? `M${7 + i * 13} 3q-4 ${g.height * 0.3} 0 ${g.height * 0.55}t0 ${g.height * 0.4}`
                : `M3 ${7 + i * 13}q${g.width * 0.3} -4 ${g.width * 0.55} 0t${g.width * 0.4} 0`
            }
            stroke="#967746"
            strokeWidth=".6"
            opacity=".4"
            fill="none"
          />
        ),
      )}
      <path
        d={`M1 1H${g.width - 1}`}
        stroke="#fff4cd"
        strokeWidth="1"
        opacity=".7"
      />
      {Array.from({ length: loads }, (_, i) => {
        const x = g.width / 2 - 8,
          y = -5 - i * 18;
        return (
          <g key={i} data-instrument="friction-load" data-mass="100">
            <path
              d={`M${x - 17} ${y - 13}q17 6 34 0v13q-17 7-34 0Z`}
              fill={`url(#${id}-brass)`}
              stroke="#ab925e"
              strokeWidth=".6"
            />
            <ellipse
              cx={x}
              cy={y - 13}
              rx="17"
              ry="3.5"
              fill="#e0cc97"
              stroke="#ad9767"
              strokeWidth=".6"
            />
            <rect
              x={x - 3}
              y={y - 18}
              width="6"
              height="5"
              rx="1"
              fill={`url(#${id}-metal)`}
              stroke="#8fa08c"
              strokeWidth=".5"
            />
            <ellipse
              cx={x}
              cy={y - 18}
              rx="4"
              ry="1.4"
              fill="#d7dfca"
              stroke="#8fa08c"
              strokeWidth=".5"
            />
            <text
              x={x}
              y={y - 1}
              textAnchor="middle"
              style={{ fontSize: 7, fontWeight: 600, fill: "#725e34" }}
            >
              100 г
            </text>
          </g>
        );
      })}
      <path
        d={`M${g.width} ${g.height / 2 - 4}q8-2 8 4t-8 4`}
        fill="none"
        stroke="#8c9c81"
        strokeWidth="1.6"
      />
    </g>
  );
}
export function FrictionMeter({
  id,
  force,
  ready,
}: {
  id: string;
  force: number;
  ready: boolean;
}) {
  const g = frictionMeterGeometry(force),
    y = 21;
  const wire = Array.from(
    { length: 97 },
    (_, i) =>
      `${q(128 + ((g.anchorX - 128) * i) / 96)},${q(y + 3 * Math.sin((i / 96) * 12 * Math.PI))}`,
  ).join(" ");
  return (
    <g data-instrument="friction-meter-assembly" data-meter-force={force}>
      <path
        d="M0 21q5-9 10-4t-1 8"
        fill="none"
        stroke="#708779"
        strokeWidth="2"
      />
      <path d="M10 21H128" stroke="#8c9d89" strokeWidth="2.3" />
      <path d="M13 20.4H128" stroke="#d9e3ce" strokeWidth=".7" />
      <g
        data-instrument="friction-meter-case"
        transform={`translate(${q(g.caseX)} 0)`}
      >
        <rect
          x="0"
          y="-1"
          width="150"
          height="44"
          rx="9"
          fill={`url(#${id}-glass)`}
          stroke="#8da798"
          strokeWidth="1.1"
        />
        <path
          d="M8 1h135M8 40h135"
          stroke="#eff4e5"
          strokeWidth="1.4"
          opacity=".75"
        />
        <rect
          x="0"
          y="1"
          width="9"
          height="40"
          rx="4"
          fill={`url(#${id}-metal)`}
          stroke="#849b86"
          strokeWidth=".6"
        />
        <rect
          x="140"
          y="1"
          width="10"
          height="40"
          rx="4"
          fill={`url(#${id}-metal)`}
          stroke="#849b86"
          strokeWidth=".6"
        />
        {Array.from({ length: 51 }, (_, i) => {
          const x = q(110 - (i * FRICTION_METER_PX_PER_N) / 10);
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1="9"
              y2={i % 10 === 0 ? 17 : i % 5 === 0 ? 15 : 12}
              stroke="#586f59"
              strokeWidth={i % 10 === 0 ? 0.8 : 0.45}
            />
          );
        })}
        {Array.from({ length: 6 }, (_, i) => (
          <text
            key={i}
            x={110 - i * FRICTION_METER_PX_PER_N}
            y="6"
            textAnchor="middle"
            style={{ fontSize: 6.5, fill: "#405e49" }}
          >
            {i}
          </text>
        ))}
        <text
          x="126"
          y="11"
          textAnchor="middle"
          style={{ fontSize: 7, fill: "#45644b" }}
        >
          Н
        </text>
        <path
          d="M150 21h6m0-1q16-16 22 1-6 17-22 1"
          fill="none"
          stroke="#738c77"
          strokeWidth="2.3"
        />
        <path
          d="M158 19q10-10 16 1"
          fill="none"
          stroke="#dbe6cd"
          strokeWidth=".7"
        />
        <text
          x="72"
          y="37"
          textAnchor="middle"
          style={{ fontSize: 5.5, letterSpacing: 1, fill: "#70866c" }}
        >
          ДИНАМОМЕТР · 5 Н
        </text>
      </g>
      <polyline
        data-instrument="friction-meter-spring"
        points={wire}
        stroke="#8fa495"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        data-instrument="friction-meter-pointer"
        d="M128 15l-3 8h6Z"
        fill="#b18944"
        stroke="#927235"
        strokeWidth=".5"
      />
      <path
        d={`M${q(g.anchorX)} 14V28M${q(g.anchorX)} 21H${q(g.caseX + 143)}`}
        fill="none"
        stroke="#819981"
        strokeWidth="1.2"
      />
      <rect
        x={q(g.caseX + 32)}
        y="-47"
        width="87"
        height="24"
        rx="6"
        fill="#fffdf3"
        stroke="#d7dfca"
      />
      <text
        data-instrument="friction-force-reading"
        x={q(g.caseX + 75.5)}
        y="-31"
        textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 650 }}
      >
        {ready ? `${String(force).replace(".", ",")} Н` : "—"}
      </text>
    </g>
  );
}
