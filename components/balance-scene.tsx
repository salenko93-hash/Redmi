export type ScaleLoad = { key: string; label: string; count: number };
export function BalanceScene({
  difference,
  leftLabel,
  loads,
  status,
  id,
  bag = false,
  leftExtra = [],
}: {
  difference: number;
  leftLabel: string;
  loads: readonly ScaleLoad[];
  status: string;
  id: string;
  bag?: boolean;
  leftExtra?: readonly ScaleLoad[];
}) {
  const angle = (Math.max(-10, Math.min(10, -difference)) * Math.PI) / 180;
  const dx = 170 * Math.cos(angle),
    dy = 170 * Math.sin(angle);
  const leftX = 300 - dx,
    rightX = 300 + dx;
  const leftY = 125 - dy,
    rightY = 125 + dy;
  const leftPan = leftY + 95,
    rightPan = rightY + 95;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-scale-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cbd7ca" />
          <stop offset="1" stopColor="#7f9986" />
        </linearGradient>
      </defs>
      <text x="300" y="27" textAnchor="middle" style={{ fontWeight: 650 }}>
        {status}
      </text>
      <path
        d="M235 310H365L316 286V135H284V286Z"
        fill={`url(#${id}-scale-metal)`}
        stroke="#819783"
      />
      <line
        x1="300"
        x2="300"
        y1="73"
        y2="113"
        stroke="#aabc9e"
        strokeDasharray="3 4"
      />
      <text x="300" y="67" textAnchor="middle">
        0
      </text>
      <line
        data-instrument="balance-beam"
        x1={leftX}
        y1={leftY}
        x2={rightX}
        y2={rightY}
        stroke="#617d68"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <line
        x1="300"
        y1="125"
        x2={300 + 36 * Math.sin(angle)}
        y2={125 - 36 * Math.cos(angle)}
        stroke="#b18a43"
        strokeWidth="3"
      />
      <circle cx="300" cy="125" r="9" fill="#d5bd83" stroke="#9b895d" />
      <path
        d={`M${leftX} ${leftY}l-60 95h120Z M${rightX} ${rightY}l-60 95h120Z`}
        stroke="#8a9f89"
        strokeWidth="2"
        fill="none"
      />
      <ellipse
        data-instrument="left-pan"
        cx={leftX}
        cy={leftPan}
        rx="62"
        ry="8"
        fill="#d6c596"
        stroke="#a79870"
      />
      <ellipse
        data-instrument="right-pan"
        cx={rightX}
        cy={rightPan}
        rx="62"
        ry="8"
        fill="#d6c596"
        stroke="#a79870"
      />
      {bag ? (
        <path
          d={`M${leftX - 26} ${leftPan - 2}q-5 -25 14 -49l-5 -9h30l-5 9q19 24 14 49Z`}
          fill="#d9c79d"
          stroke="#a59774"
        />
      ) : (
        <g>
          <rect
            x={leftX - 24}
            y={leftPan - 46}
            width="48"
            height="42"
            rx="9"
            fill="#8ba89b"
            stroke="#5b7e67"
          />
          <text
            x={leftX}
            y={leftPan - 18}
            textAnchor="middle"
            style={{ fontSize: 23, fill: "#fff" }}
          >
            ?
          </text>
        </g>
      )}
      {leftExtra.map((w, i) => (
        <g key={w.key}>
          <rect
            x={leftX + 22}
            y={leftPan - 22 - i * 20}
            width="37"
            height="18"
            rx="3"
            fill="#f0f2e6"
            stroke="#a3b397"
          />
          <text
            x={leftX + 40.5}
            y={leftPan - 10 - i * 20}
            textAnchor="middle"
            style={{ fontSize: 8 }}
          >
            {w.count}×{w.label}
          </text>
        </g>
      ))}
      {loads.map((w, i) => (
        <g
          key={w.key}
          data-instrument="weight-bundle"
          data-weight={w.key}
          data-count={w.count}
        >
          <title>{`${w.count} × ${w.label}`}</title>
          <rect
            x={rightX - 61 + (i % 3) * 42}
            y={rightPan - 22 - Math.floor(i / 3) * 20}
            width="39"
            height="18"
            rx="3"
            fill="#eff2e4"
            stroke="#91a681"
          />
          <text
            x={rightX - 41.5 + (i % 3) * 42}
            y={rightPan - 10 - Math.floor(i / 3) * 20}
            textAnchor="middle"
            style={{ fontSize: 8 }}
          >
            {w.count}×{w.label}
          </text>
        </g>
      ))}
      <text x={leftX} y="292" textAnchor="middle">
        {leftLabel}
      </text>
      <text x={rightX} y="292" textAnchor="middle">
        Важки
      </text>
      <text x="300" y="337" textAnchor="middle" style={{ fontSize: 11 }}>
        Схема рівноплечих терезів · нахил показано умовно
      </text>
    </g>
  );
}
