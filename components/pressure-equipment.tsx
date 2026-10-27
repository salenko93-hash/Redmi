import { pressureCoordinate as q } from "@/lib/pressure-view";
import type { pressureGeometry } from "@/lib/pressure-view";

export function PressureDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#e7d1a5" />
        <stop offset=".5" stopColor="#d0ad78" />
        <stop offset="1" stopColor="#ba915b" />
      </linearGradient>
      <linearGradient id={`${id}-edge`}>
        <stop stopColor="#a7804f" />
        <stop offset="1" stopColor="#c4a16e" />
      </linearGradient>
      <linearGradient id={`${id}-brass`}>
        <stop stopColor="#947342" />
        <stop offset=".3" stopColor="#ebd69b" />
        <stop offset=".65" stopColor="#cfb57a" />
        <stop offset="1" stopColor="#92753e" />
      </linearGradient>
      <linearGradient id={`${id}-ruler`} x2="0" y2="1">
        <stop stopColor="#fff9df" />
        <stop offset="1" stopColor="#ede1b8" />
      </linearGradient>
    </defs>
  );
}

export function PressureBlock({
  id,
  geometry: g,
  x,
  base,
  loads = 0,
  face = 0,
}: {
  id: string;
  geometry: ReturnType<typeof pressureGeometry>;
  x: number;
  base: number;
  loads?: number;
  face?: number;
}) {
  const top = base - g.vertical;
  const cx = x + g.width / 2 + g.dx / 2;
  return (
    <g data-instrument="pressure-body">
      <polygon
        points={`${x - 4},${base + 2} ${x + g.width + 5},${base + 2} ${x + g.width + g.dx + 7},${base - g.dy} ${x + g.dx},${base - g.dy - 3}`}
        fill="#61553e"
        opacity=".13"
      />
      <polygon
        data-instrument="pressure-contact"
        points={`${x},${base} ${x + g.width},${base} ${x + g.width + g.dx},${base - g.dy} ${x + g.dx},${base - g.dy}`}
        fill="#e5bd63"
        stroke="#b58c3d"
        strokeWidth="3"
      />
      <polygon
        data-instrument="pressure-block-front"
        points={`${x},${top} ${x + g.width},${top} ${x + g.width},${base} ${x},${base}`}
        fill={`url(#${id}-wood)`}
        stroke="#a1855e"
        strokeWidth=".8"
      />
      <clipPath id={`${id}-grain-clip`}>
        <rect
          x={x + 1}
          y={top + 1}
          width={g.width - 2}
          height={g.vertical - 2}
        />
      </clipPath>
      <g
        clipPath={`url(#${id}-grain-clip)`}
        fill="none"
        stroke="#916d3d"
        strokeWidth=".6"
        opacity=".35"
      >
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d={
              face === 2
                ? `M${x + 4 + i * 7} ${top}q-3 ${g.vertical * 0.3} 0 ${g.vertical * 0.55}t0 ${g.vertical * 0.5}`
                : `M${x} ${top + 4 + i * 7}q${g.width * 0.3} -3 ${g.width * 0.55} 0t${g.width * 0.5} 0`
            }
          />
        ))}
      </g>
      <polygon
        data-instrument="pressure-block-side"
        points={`${x + g.width},${top} ${x + g.width + g.dx},${top - g.dy} ${x + g.width + g.dx},${base - g.dy} ${x + g.width},${base}`}
        fill={`url(#${id}-edge)`}
        stroke="#9a7c52"
        strokeWidth=".8"
      />
      <polygon
        data-instrument="pressure-block-top"
        points={`${x},${top} ${x + g.dx},${top - g.dy} ${x + g.width + g.dx},${top - g.dy} ${x + g.width},${top}`}
        fill="#ead6af"
        stroke="#ad9169"
        strokeWidth=".8"
      />
      {Array.from({ length: 4 }, (_, i) => (
        <path
          key={i}
          d={`M${x + (g.dx * (i + 1)) / 5} ${top - (g.dy * (i + 1)) / 5}h${g.width}`}
          stroke="#b39465"
          strokeWidth=".5"
          opacity=".4"
        />
      ))}
      {Array.from({ length: loads }, (_, i) => {
        const y = q(top - g.dy / 2 - 3 - i * 20);
        return (
          <g
            key={i}
            data-instrument="pressure-load"
            transform={`translate(${q(cx)} ${y})`}
          >
            <ellipse cy="1" rx="18" ry="5" fill="#68522f" opacity=".15" />
            <path
              d="M-17-16V-3a17 4 0 0 0 34 0v-13Z"
              fill={`url(#${id}-brass)`}
              stroke="#9d8049"
              strokeWidth=".7"
            />
            <ellipse
              cy="-16"
              rx="17"
              ry="4"
              fill="#eddaaa"
              stroke="#a58b57"
              strokeWidth=".7"
            />
            <rect
              x="-3"
              y="-21"
              width="6"
              height="5"
              rx="1.5"
              fill={`url(#${id}-brass)`}
              stroke="#ac905a"
              strokeWidth=".5"
            />
            <text
              y="-5"
              textAnchor="middle"
              style={{ fontSize: 8, fill: "#574b31", fontWeight: 650 }}
            >
              100 г
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** One millimetre is 1.2 SVG units; the marks retain the block's scale. */
export function PressureRuler({
  id,
  length,
  vertical = false,
}: {
  id: string;
  length: number;
  vertical?: boolean;
}) {
  return (
    <g
      transform={vertical ? "rotate(90)" : undefined}
      data-instrument="pressure-ruler"
    >
      <rect
        x="-5"
        y="0"
        width={length * 12 + 10}
        height="23"
        rx="2"
        fill={`url(#${id}-ruler)`}
        stroke="#bca879"
        strokeWidth=".7"
      />
      {Array.from({ length: length * 10 + 1 }, (_, i) => (
        <g key={i} transform={`translate(${q(i * 1.2)} 0)`}>
          <line
            y2={i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3}
            stroke="#8e805f"
            strokeWidth=".5"
          />
          {i % 10 === 0 && (
            <text y="18" textAnchor="middle" style={{ fontSize: 7 }}>
              {i / 10}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
