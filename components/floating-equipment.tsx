import {
  tubePath,
  floatingSandGeometry,
  floatingCoordinate as q,
} from "@/lib/floating-view";
export function FloatingDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor="#98b9b8" stopOpacity=".65" />
        <stop offset=".15" stopColor="#fff" stopOpacity=".4" />
        <stop offset=".55" stopColor="#ebf5ed" stopOpacity=".1" />
        <stop offset="1" stopColor="#87aaa9" stopOpacity=".65" />
      </linearGradient>
      <linearGradient id={`${id}-water`} x2="0" y2="1">
        <stop stopColor="#c4e6e6" stopOpacity=".65" />
        <stop offset="1" stopColor="#80b9c4" stopOpacity=".65" />
      </linearGradient>
      <linearGradient id={`${id}-sand`}>
        <stop stopColor="#b79961" />
        <stop offset=".4" stopColor="#e1cb9b" />
        <stop offset="1" stopColor="#bba16f" />
      </linearGradient>
      <linearGradient id={`${id}-cork`}>
        <stop stopColor="#a17d49" />
        <stop offset=".4" stopColor="#d2b87e" />
        <stop offset="1" stopColor="#a98b5b" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#d9bd94" />
        <stop offset="1" stopColor="#b68d59" />
      </linearGradient>
      <pattern
        id={`${id}-grains`}
        width="7"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="1" cy="2" r=".6" fill="#8d744c" />
        <circle cx="5" cy="4" r=".8" fill="#f1dfb6" />
        <path d="M3 5l1-1" stroke="#a78957" strokeWidth=".6" />
      </pattern>
    </defs>
  );
}
export function FloatingTube({
  id,
  top,
  radius,
  height,
  volume,
  sand,
}: {
  id: string;
  top: number;
  radius: number;
  height: number;
  volume: number;
  sand: number;
}) {
  const g = floatingSandGeometry(volume, sand, radius, height);
  const innerBottom = top + height - 1.5;
  const inner = tubePath(175, innerBottom - g.height, g.radius, g.height);
  const sandTop = innerBottom - g.depth;
  return (
    <g data-instrument="floating-body">
      <defs>
        <clipPath id={`${id}-inside`}>
          <path d={inner} />
        </clipPath>
      </defs>
      <path
        data-instrument="floating-tube"
        d={tubePath(175, top, radius, height)}
        fill={`url(#${id}-glass)`}
        stroke="#829f9b"
        strokeWidth="1.3"
      />
      {sand > 0 && (
        <g clipPath={`url(#${id}-inside)`} data-instrument="floating-sand">
          <rect
            data-instrument="floating-sand-fill"
            x={q(175 - g.radius)}
            y={q(sandTop)}
            width={q(2 * g.radius)}
            height={q(g.depth + 2)}
            fill={`url(#${id}-sand)`}
          />
          <rect
            x={q(175 - g.radius)}
            y={q(sandTop)}
            width={q(2 * g.radius)}
            height={q(g.depth + 2)}
            fill={`url(#${id}-grains)`}
          />
          <ellipse
            cx="175"
            cy={q(sandTop)}
            rx={q(g.radius)}
            ry="1.8"
            fill="#ddc596"
            stroke="#b99b67"
            strokeWidth=".5"
          />
        </g>
      )}
      <path
        d={`M${q(175 - radius + 3)} ${q(top + 11)}V${q(top + height - radius)}q0 ${q(radius - 4)} ${q(radius - 4)} ${q(radius - 3)}`}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        opacity=".75"
      />
      <path
        d={`M${q(175 + radius - 3)} ${q(top + 11)}V${q(top + height - radius)}`}
        fill="none"
        stroke="#e8f4ed"
        opacity=".8"
      />
      <rect
        x={q(175 - radius + 1)}
        y={q(top)}
        width={q(2 * radius - 2)}
        height="4"
        fill={`url(#${id}-cork)`}
        stroke="#9a8159"
        strokeWidth=".7"
      />
      <ellipse
        cx="175"
        cy={q(top)}
        rx={q(radius - 1)}
        ry="2"
        fill="#ddc99a"
        stroke="#a0875e"
        strokeWidth=".7"
      />
      {[-0.6, -0.2, 0.25, 0.6].map((f, i) => (
        <circle
          key={i}
          cx={q(175 + radius * f)}
          cy={q(top + 0.5)}
          r=".45"
          fill="#9b8050"
        />
      ))}
    </g>
  );
}
