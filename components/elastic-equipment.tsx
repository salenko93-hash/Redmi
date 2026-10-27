import {
  ELASTIC_ANCHOR,
  ELASTIC_AXIS,
  elasticCoils,
  elasticCordWidth,
  elasticCoordinate as q,
} from "@/lib/elastic-view";

export function ElasticDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-steel`}>
        <stop stopColor="#647c7a" />
        <stop offset=".25" stopColor="#e7efeb" />
        <stop offset=".55" stopColor="#a7bcb1" />
        <stop offset=".8" stopColor="#f8fbf1" />
        <stop offset="1" stopColor="#728e7f" />
      </linearGradient>
      <linearGradient id={`${id}-stand`}>
        <stop stopColor="#3d6050" />
        <stop offset=".35" stopColor="#8fa99a" />
        <stop offset=".75" stopColor="#637e6a" />
        <stop offset="1" stopColor="#3a5947" />
      </linearGradient>
      <linearGradient
        id={`${id}-rubber`}
        gradientUnits="userSpaceOnUse"
        x1="291"
        x2="299"
        y1="102"
        y2="102"
      >
        <stop stopColor="#294f3c" />
        <stop offset=".3" stopColor="#77a07a" />
        <stop offset=".65" stopColor="#427554" />
        <stop offset="1" stopColor="#244c39" />
      </linearGradient>
      <linearGradient id={`${id}-load`}>
        <stop stopColor="#8f7849" />
        <stop offset=".25" stopColor="#e2c98c" />
        <stop offset=".55" stopColor="#b99d63" />
        <stop offset=".8" stopColor="#e6d19c" />
        <stop offset="1" stopColor="#8f7849" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#dabb91" />
        <stop offset="1" stopColor="#b38754" />
      </linearGradient>
    </defs>
  );
}
export function ElasticStand({ id }: { id: string }) {
  return (
    <g data-instrument="elastic-stand">
      <path d="M28 520H572L585 540H15Z" fill="#dfc39a" />
      <rect
        x="15"
        y="539"
        width="570"
        height="11"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M33 550H567V561H33Z M46 561H65V570H46Z M535 561H554V570H535Z"
        fill="#97734d"
      />
      <ellipse cx="103" cy="523" rx="54" ry="5" fill="#38543d" opacity=".16" />
      <path
        d="M69 499H135L151 516Q106 531 55 516Z"
        fill={`url(#${id}-stand)`}
        stroke="#58715d"
      />
      <path d="M75 500H129L138 508H65Z" fill="#a9bcac" opacity=".6" />
      <rect x="62" y="515" width="11" height="9" rx="2" fill="#506d56" />
      <rect x="133" y="515" width="11" height="9" rx="2" fill="#506d56" />
      <rect
        x="98"
        y="69"
        width="9"
        height="433"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#809987"
        strokeWidth=".8"
      />
      <path d="M103 74V494" stroke="#e4ece2" opacity=".7" />
      <path
        d="M106 84H295V91"
        stroke="#3d5544"
        strokeWidth="8"
        opacity=".13"
        fill="none"
      />
      <path
        d="M105 82H295V90"
        stroke={`url(#${id}-steel)`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="94"
        y="73"
        width="20"
        height="20"
        rx="3"
        fill={`url(#${id}-stand)`}
        stroke="#57735b"
      />
      <path d="M94 83H84" stroke="#657d68" strokeWidth="3" />
      <rect
        x="78"
        y="77"
        width="6"
        height="12"
        rx="2"
        fill="#8c9f87"
        stroke="#6b826a"
        strokeWidth=".7"
      />
      <path
        d="M295 88v7q-7 0-7 5t7 5q7 0 7-5"
        fill="none"
        stroke="#526e58"
        strokeWidth="2"
      />
      <path
        d="M295 88v7q-7 0-7 5"
        fill="none"
        stroke="#cfdbcc"
        strokeWidth=".7"
      />
      <path
        d="M398 91h43v8h-43Z M413 447v58h10v-58"
        fill="#c9d7c2"
        stroke="#8ea284"
        strokeWidth=".7"
      />
      <path d="M103 505H413" stroke="#819782" strokeWidth="3" />
      <rect x="96" y="499" width="17" height="12" rx="2" fill="#657f65" />
    </g>
  );
}
export function ElasticElement({
  id,
  material,
  initial,
  length,
  end,
  axis = ELASTIC_AXIS,
  ghost = false,
}: {
  id: string;
  material: number;
  initial: number;
  length: number;
  end: number;
  axis?: number;
  ghost?: boolean;
}) {
  const coil = elasticCoils(ELASTIC_ANCHOR, end, axis);
  return (
    <g
      data-instrument={ghost ? "elastic-reference" : "elastic-element"}
      data-elastic-kind={material === 0 ? "rubber" : "spring"}
      opacity={ghost ? 0.35 : 1}
    >
      {material === 0 ? (
        <>
          <path
            d={`M${axis} ${ELASTIC_ANCHOR}V${q(end)}`}
            stroke={ghost ? "#95a58c" : `url(#${id}-rubber)`}
            strokeWidth={elasticCordWidth(initial, length)}
            strokeLinecap="round"
          />
          {!ghost && (
            <path
              d={`M${axis - 1} ${ELASTIC_ANCHOR + 6}V${q(end - 5)}`}
              stroke="#b4d0a1"
              strokeWidth=".7"
              opacity=".55"
            />
          )}
        </>
      ) : (
        <>
          <path
            d={`M${axis} ${ELASTIC_ANCHOR}L${coil.start.join(" ")}M${coil.end.join(" ")}L${axis} ${q(end)}`}
            fill="none"
            stroke={ghost ? "#95a58c" : "#9caf9f"}
            strokeWidth="2.4"
          />
          {coil.segments.map((points, i) => (
            <polyline
              key={i}
              data-coil-half={i}
              points={points}
              stroke={
                ghost ? "#95a58c" : i % 2 ? `url(#${id}-steel)` : "#7d9386"
              }
              strokeWidth={i % 2 ? 2.5 : 1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </>
      )}
      {!ghost && (
        <>
          <rect
            x={axis - 5}
            y={ELASTIC_ANCHOR - 2}
            width="10"
            height="7"
            rx="1.8"
            fill={`url(#${id}-steel)`}
            stroke="#7a927c"
            strokeWidth=".6"
          />
          <rect
            x={axis - 5}
            y={q(end - 5)}
            width="10"
            height="5"
            rx="1.5"
            fill={`url(#${id}-steel)`}
            stroke="#7a927c"
            strokeWidth=".6"
          />
        </>
      )}
    </g>
  );
}
export function ElasticLoads({
  id,
  end,
  mass,
}: {
  id: string;
  end: number;
  mass: number;
}) {
  if (mass === 0) return null;
  return (
    <g data-instrument="elastic-hanger">
      <path
        d={`M295 ${q(end)}v4q-7 0-7 5t7 5q6 0 6-5M295 ${q(end + 14)}V${q(end + 20 + (mass / 100) * 18)}`}
        stroke="#728779"
        fill="none"
        strokeWidth="2"
      />
      {Array.from({ length: mass / 100 }, (_, i) => {
        const y = q(end + 20 + i * 18);
        return (
          <g key={i} data-instrument="elastic-load" data-mass="100">
            <path
              d={`M273 ${y}Q295 ${y + 7} 317 ${y}V${y + 13}Q295 ${y + 23} 273 ${y + 13}Z`}
              fill={`url(#${id}-load)`}
              stroke="#9c8656"
              strokeWidth=".7"
            />
            <ellipse
              cx="295"
              cy={y}
              rx="22"
              ry="4"
              fill="#e1cb94"
              stroke="#ae9764"
              strokeWidth=".7"
            />
            <ellipse cx="295" cy={y} rx="3" ry="1.4" fill="#71816b" />
            <path
              d={`M295 ${y}h20v3h-20`}
              fill="#b7a273"
              stroke="#ab9869"
              strokeWidth=".5"
            />
            <path
              d={`M279 ${y + 4}v9`}
              stroke="#f5e5b6"
              strokeWidth=".9"
              opacity=".6"
            />
            <text
              x="295"
              y={y + 13}
              textAnchor="middle"
              style={{ fontSize: 7.5, fontWeight: 600, fill: "#725e37" }}
            >
              100 г
            </text>
          </g>
        );
      })}
      <path
        d={`M291 ${q(end + 22 + (mass / 100) * 18)}h8`}
        stroke="#718572"
        strokeWidth="2"
      />
    </g>
  );
}
