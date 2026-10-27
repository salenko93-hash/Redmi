import {
  balanceGeometry,
  balanceLoadPositions,
  BALANCE_PIVOT,
} from "@/lib/balance-view";
import {
  BalanceObject,
  CalibrationWeight,
  type ScaleLoad,
} from "./balance-loads";
export type { ScaleLoad } from "./balance-loads";
const q = (value: number) => Number(value.toFixed(4));
export function BalanceScene({
  difference,
  leftLabel,
  loads,
  status,
  id,
  bag = false,
  leftExtra = [],
  objectIndex = 0,
}: {
  difference: number;
  leftLabel: string;
  loads: readonly ScaleLoad[];
  status: string;
  id: string;
  bag?: boolean;
  leftExtra?: readonly ScaleLoad[];
  objectIndex?: number;
}) {
  const g = balanceGeometry(difference),
    { x: px, y: py } = BALANCE_PIVOT,
    layout = balanceLoadPositions(loads.length);
  const pans = [
    { side: "left", x: q(g.left.x), y: q(g.left.y), pan: q(g.leftPan) },
    { side: "right", x: q(g.right.x), y: q(g.right.y), pan: q(g.rightPan) },
  ] as const;
  return (
    <g data-instrument="balance-installation" data-balance-state={g.state}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6c8284" />
          <stop offset=".3" stopColor="#edf3ef" />
          <stop offset=".65" stopColor="#b6c6c0" />
          <stop offset="1" stopColor="#6d8580" />
        </linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" y1="0" x2="1" y2=".25">
          <stop offset="0" stopColor="#a98749" />
          <stop offset=".32" stopColor="#f1df9f" />
          <stop offset=".66" stopColor="#d3b674" />
          <stop offset="1" stopColor="#9a7942" />
        </linearGradient>
        <radialGradient id={`${id}-pan`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f3e4b7" />
          <stop offset=".6" stopColor="#d7c48a" />
          <stop offset="1" stopColor="#b39b62" />
        </radialGradient>
        <linearGradient id={`${id}-stand`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a685a" />
          <stop offset=".35" stopColor="#8fa99b" />
          <stop offset=".7" stopColor="#647f70" />
          <stop offset="1" stopColor="#385547" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9bc91" />
          <stop offset="1" stopColor="#b0804b" />
        </linearGradient>
        <linearGradient id={`${id}-canvas`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bbaa7e" />
          <stop offset=".4" stopColor="#e4d7b2" />
          <stop offset="1" stopColor="#baa77a" />
        </linearGradient>
        <radialGradient id={`${id}-stone`} cx="30%" cy="20%" r="85%">
          <stop offset="0" stopColor="#cbd2c6" />
          <stop offset=".6" stopColor="#9ba79e" />
          <stop offset="1" stopColor="#74847a" />
        </radialGradient>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f8f2" />
          <stop offset=".55" stopColor="#dbe6df" />
          <stop offset="1" stopColor="#a8bdb5" />
        </linearGradient>
      </defs>
      <text
        x="300"
        y="27"
        textAnchor="middle"
        style={{ fontSize: 12, fontWeight: 650 }}
      >
        {status}
      </text>
      <text x="300" y="46" textAnchor="middle" style={{ fontSize: 9.5 }}>
        Лабораторні рівноплечі терези · номінал × кількість
      </text>

      {/* Level bench, levelling feet and a cast metal stand. */}
      <path d="M35 384H565L575 393H25Z" fill="#dfc49b" />
      <rect
        x="25"
        y="390"
        width="550"
        height="13"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M40 403H560V420H40Z M53 420H73V428H53Z M527 420H547V428H527Z"
        fill="#8d6847"
      />
      <line x1="40" x2="560" y1="404" y2="404" stroke="#d1aa76" />
      <ellipse cx="302" cy="383" rx="91" ry="6" fill="#2f4b39" opacity=".16" />
      <rect x="229" y="372" width="15" height="14" rx="3" fill="#53685c" />
      <rect x="356" y="372" width="15" height="14" rx="3" fill="#53685c" />
      <path
        d="M227 356H373L384 373Q300 386 216 373Z"
        fill={`url(#${id}-stand)`}
        stroke="#4d6958"
      />
      <path d="M236 358H364L370 365H230Z" fill="#98ada0" opacity=".7" />
      <path
        d="M288 157H312V320Q320 344 346 360H254Q280 344 288 320Z"
        fill={`url(#${id}-stand)`}
        stroke="#587260"
        strokeWidth=".8"
      />
      <path
        d="M291 161H297V320Q290 340 278 346"
        fill="none"
        stroke="#c2d0c5"
        strokeWidth="2"
        opacity=".5"
      />
      <path
        d="M285 159l15-14 15 14"
        fill="#bed0c3"
        stroke="#779180"
        strokeWidth=".8"
      />
      <rect
        x="286"
        y="150"
        width="28"
        height="12"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#7c9687"
        strokeWidth=".7"
      />

      {/* Fixed zero scale; angle is an instructional indicator, not a mass calibration. */}
      <path d="M275 90V65Q300 51 325 65V90Z" fill="#f8f4e2" stroke="#c2c9b3" />
      <text x="300" y="65" textAnchor="middle" style={{ fontSize: 8 }}>
        0
      </text>
      {[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map((degrees) => {
        const a = (degrees * Math.PI) / 180;
        return (
          <line
            key={degrees}
            x1={q(px + 63 * Math.sin(a))}
            y1={q(py - 63 * Math.cos(a))}
            x2={q(px + (degrees === 0 ? 71 : 68) * Math.sin(a))}
            y2={q(py - (degrees === 0 ? 71 : 68) * Math.cos(a))}
            stroke={degrees === 0 ? "#65855a" : "#a7b394"}
            strokeWidth={degrees === 0 ? 1.2 : 0.6}
          />
        );
      })}
      <path
        d={`M${px} 96V${py}`}
        stroke="#aabc9e"
        strokeWidth=".7"
        strokeDasharray="3 3"
      />
      <line
        data-instrument="balance-pointer"
        x1={px}
        y1={py}
        x2={q(g.pointer.x)}
        y2={q(g.pointer.y)}
        stroke="#b38f47"
        strokeWidth="2.2"
      />

      {/* Equal rigid arms; suspension eyes are at the end of each arm. */}
      <line
        x1={q(g.left.x)}
        y1={q(g.left.y + 3)}
        x2={q(g.right.x)}
        y2={q(g.right.y + 3)}
        stroke="#304f3c"
        strokeWidth="10"
        strokeLinecap="round"
        opacity=".2"
      />
      <line
        data-instrument="balance-beam"
        x1={q(g.left.x)}
        y1={q(g.left.y)}
        x2={q(g.right.x)}
        y2={q(g.right.y)}
        stroke="#7b9585"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1={q(g.left.x)}
        y1={q(g.left.y - 2)}
        x2={q(g.right.x)}
        y2={q(g.right.y - 2)}
        stroke="#c4d1bd"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <line
        x1={q(g.left.x)}
        y1={q(g.left.y + 3)}
        x2={q(g.right.x)}
        y2={q(g.right.y + 3)}
        stroke="#4d6b58"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={px + 1} cy={py + 2} r="13" fill="#2f4938" opacity=".15" />
      <circle
        cx={px}
        cy={py}
        r="12"
        fill={`url(#${id}-brass)`}
        stroke="#a78b54"
      />
      <circle
        cx={px}
        cy={py}
        r="5"
        fill={`url(#${id}-steel)`}
        stroke="#7d9688"
        strokeWidth=".7"
      />
      <path d={`M${px - 2.5} ${py}h5`} stroke="#627b68" strokeWidth=".7" />

      {pans.map((p) => (
        <g key={p.side} data-instrument={`${p.side}-suspension`}>
          <ellipse
            cx={p.x}
            cy={p.y + 5}
            rx="3.2"
            ry="4.2"
            fill={`url(#${id}-steel)`}
            stroke="#6e8877"
            strokeWidth=".7"
          />
          <line
            data-instrument={`${p.side}-back-chain`}
            x1={p.x}
            y1={p.y + 8}
            x2={p.x}
            y2={p.pan - 6}
            stroke="#9bada5"
            strokeWidth="1.2"
          />
          <line
            x1={p.x - 1}
            y1={p.y + 8}
            x2={p.x - 67}
            y2={p.pan}
            stroke="#7e9788"
            strokeWidth="1.4"
          />
          <line
            x1={p.x + 1}
            y1={p.y + 8}
            x2={p.x + 67}
            y2={p.pan}
            stroke="#a7b8a8"
            strokeWidth="1.4"
          />
          <path
            d={`M${p.x - 73} ${p.pan}Q${p.x} ${p.pan + 24} ${p.x + 73} ${p.pan}L${p.x + 59} ${p.pan + 12}Q${p.x} ${p.pan + 29} ${p.x - 59} ${p.pan + 12}Z`}
            fill={`url(#${id}-brass)`}
            stroke="#ab935a"
            strokeWidth=".65"
          />
          <ellipse
            data-instrument={`${p.side}-pan`}
            cx={p.x}
            cy={p.pan}
            rx="73"
            ry="9"
            fill={`url(#${id}-pan)`}
            stroke="#b49c64"
            strokeWidth="1.1"
          />
          <path
            d={`M${p.x - 68} ${p.pan + 2}Q${p.x} ${p.pan + 14} ${p.x + 68} ${p.pan + 2}`}
            fill="none"
            stroke="#f4e4ad"
            strokeWidth="1"
          />
        </g>
      ))}

      <g
        transform={`translate(${q(g.left.x + (bag ? -25 : 0))} ${q(g.leftPan - 1)})`}
      >
        <BalanceObject index={objectIndex} bag={bag} id={id} />
      </g>
      {leftExtra.map((load, i) => (
        <g
          key={load.key}
          transform={`translate(${q(g.left.x + 20 + i * 28)} ${q(g.leftPan - 1)})`}
        >
          <CalibrationWeight load={load} id={id} scale={0.85} side="left" />
        </g>
      ))}
      {loads.map((load, i) => (
        <g
          key={load.key}
          transform={`translate(${q(g.right.x + layout[i].x)} ${q(g.rightPan + layout[i].y)})`}
        >
          <CalibrationWeight
            load={load}
            id={id}
            scale={layout[i].scale}
            compact={layout[i].compact}
          />
        </g>
      ))}
      {loads.length === 0 && (
        <text
          x={q(g.right.x)}
          y={q(g.rightPan - 12)}
          textAnchor="middle"
          style={{ fontSize: 10, fill: "#87977b" }}
        >
          Без важків
        </text>
      )}
      <text
        x={q(g.left.x)}
        y="334"
        textAnchor="middle"
        style={{ fontSize: 11 }}
      >
        {leftLabel}
      </text>
      <text
        x={q(g.right.x)}
        y="334"
        textAnchor="middle"
        style={{ fontSize: 11 }}
      >
        {loads.length > 6
          ? `Важки · ${loads.length} номіналів`
          : "Набір важків"}
      </text>

      {/* Forceps remind the pupil how milligram plates are handled; controls remain accessible buttons. */}
      <path
        d="M463 386Q493 376 539 385M463 388Q493 392 539 387"
        fill="none"
        stroke="#aebbb7"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M464 386L470 387M535 384l5 1m-5 3 5-1"
        stroke="#6d8276"
        strokeWidth=".8"
      />
      <text x="300" y="440" textAnchor="middle" style={{ fontSize: 10.5 }}>
        Нахил умовний · кількість і номінали важків — у переліку під рисунком
      </text>
    </g>
  );
}
