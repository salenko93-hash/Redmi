import type { ReactNode } from "react";
import {
  CYLINDER_BASE,
  CYLINDER_CAPACITY,
  ML_TO_PIXELS,
  cylinderLevel,
  densityCoordinate as q,
} from "@/lib/density-view";

export function DensityDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-steel`}>
        <stop offset="0" stopColor="#72898a" />
        <stop offset=".22" stopColor="#edf2eb" />
        <stop offset=".5" stopColor="#c0cfca" />
        <stop offset=".8" stopColor="#f4f6ef" />
        <stop offset="1" stopColor="#7d9590" />
      </linearGradient>
      <linearGradient id={`${id}-scale`} x2="0" y2="1">
        <stop stopColor="#edf3eb" />
        <stop offset=".5" stopColor="#d6e0d5" />
        <stop offset="1" stopColor="#9eafa2" />
      </linearGradient>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor="#9bbdc3" stopOpacity=".28" />
        <stop offset=".15" stopColor="#fff" stopOpacity=".16" />
        <stop offset=".5" stopColor="#dcecf0" stopOpacity=".03" />
        <stop offset=".85" stopColor="#fff" stopOpacity=".42" />
        <stop offset="1" stopColor="#7eabb1" stopOpacity=".35" />
      </linearGradient>
      <linearGradient id={`${id}-water`}>
        <stop stopColor="#8ec8d3" stopOpacity=".6" />
        <stop offset=".48" stopColor="#cbe8ea" stopOpacity=".72" />
        <stop offset="1" stopColor="#72b4c4" stopOpacity=".7" />
      </linearGradient>
      <linearGradient id={`${id}-liquid`}>
        <stop stopColor="#c3d9c1" stopOpacity=".6" />
        <stop offset=".5" stopColor="#eff4d5" stopOpacity=".68" />
        <stop offset="1" stopColor="#b4c8a5" stopOpacity=".7" />
      </linearGradient>
      <linearGradient id={`${id}-oil`}>
        <stop stopColor="#bb912f" stopOpacity=".75" />
        <stop offset=".45" stopColor="#f4d981" stopOpacity=".8" />
        <stop offset="1" stopColor="#c6a549" stopOpacity=".8" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#d9b985" />
        <stop offset="1" stopColor="#ae7d48" />
      </linearGradient>
      <linearGradient id={`${id}-sample-0`}>
        <stop stopColor="#d9bb87" />
        <stop offset=".5" stopColor="#e7d0a3" />
        <stop offset="1" stopColor="#b68d54" />
      </linearGradient>
      <linearGradient id={`${id}-sample-1`}>
        <stop stopColor="#9daeb0" />
        <stop offset=".28" stopColor="#e6ebea" />
        <stop offset="1" stopColor="#91a5a4" />
      </linearGradient>
      <linearGradient id={`${id}-sample-2`}>
        <stop stopColor="#718078" />
        <stop offset=".4" stopColor="#a0aca2" />
        <stop offset="1" stopColor="#5d6c64" />
      </linearGradient>
    </defs>
  );
}
export function DensityBench({ id, top }: { id: string; top: number }) {
  return (
    <g data-instrument="density-bench">
      <path d={`M30 ${top}H570L583 ${top + 20}H17Z`} fill="#dcc099" />
      <rect
        x="17"
        y={top + 19}
        width="566"
        height="11"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d={`M35 ${top + 30}H565V${top + 44}H35Z M50 ${top + 44}H70V${top + 53}H50Z M530 ${top + 44}H550V${top + 53}H530Z`}
        fill="#94704c"
      />
      <path d={`M35 ${top + 31}H565`} stroke="#e1c596" strokeWidth="1" />
    </g>
  );
}
/** A model display, without invented resolution or calibration claims. */
export function DensityScale({
  x,
  y,
  width = 158,
  id,
  value,
  marker,
  children,
}: {
  x: number;
  y: number;
  width?: number;
  id: string;
  value: string;
  marker?: string;
  children?: ReactNode;
}) {
  return (
    <g data-instrument="density-scale" transform={`translate(${x} ${y})`}>
      <ellipse
        cx={width / 2}
        cy="96"
        rx={width / 2 - 7}
        ry="5"
        fill="#3d5c45"
        opacity=".15"
      />
      <rect x="16" y="84" width="13" height="12" rx="3" fill="#5f7566" />
      <rect
        x={width - 29}
        y="84"
        width="13"
        height="12"
        rx="3"
        fill="#5f7566"
      />
      <path
        d={`M9 23H${width - 9}L${width - 1} 39V83Q${width - 1} 91 ${width - 10} 91H10Q1 91 1 83V39Z`}
        fill={`url(#${id}-scale)`}
        stroke="#8fa391"
      />
      <path
        d={`M9 23H${width - 9}L${width - 1} 39H1Z`}
        fill="#e0e9dd"
        stroke="#9fb2a0"
        strokeWidth=".7"
      />
      <rect
        x="14"
        y="44"
        width={width - 52}
        height="28"
        rx="3"
        fill="#315343"
      />
      <rect
        x="17"
        y="47"
        width={width - 58}
        height="22"
        rx="2"
        fill="#d8e4bc"
      />
      <text
        data-instrument={marker}
        x={width - 44}
        y="63"
        textAnchor="end"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: q(Math.min(17, (width - 62) / (value.length * 0.61))),
          fontWeight: 650,
          fill: "#294b36",
        }}
      >
        {value}
      </text>
      <circle cx={width - 24} cy="51" r="5.5" fill="#759a75" stroke="#5b7f5d" />
      <circle cx={width - 24} cy="70" r="5.5" fill="#bdccaf" stroke="#8b9f80" />
      <path
        d={`M${width - 24} 48v3m-2-2a3 3 0 1 0 4 0M${width - 27} 70h6`}
        fill="none"
        stroke="#ecf4de"
        strokeWidth=".7"
      />
      <text
        x="15"
        y="83"
        style={{ fontSize: 5.8, letterSpacing: 1, fill: "#627d65" }}
      >
        ФІЗЛАБ · МОДЕЛЬ
      </text>
      <rect
        x={width / 2 - 13}
        y="9"
        width="26"
        height="17"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#8da198"
        strokeWidth=".6"
      />
      <path
        d={`M9 0Q${width / 2} -13 ${width - 9} 0V8Q${width / 2} 22 9 8Z`}
        fill={`url(#${id}-steel)`}
        stroke="#819c91"
      />
      <ellipse
        cx={width / 2}
        cy="0"
        rx={width / 2 - 9}
        ry="10"
        fill="#dce6df"
        stroke="#a4b7ac"
      />
      <path
        d={`M20 -1Q${width / 2} -11 ${width - 20} -1`}
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity=".7"
      />
      <g transform={`translate(${width / 2} -5)`}>{children}</g>
    </g>
  );
}
export function DensityMiniBlock({
  id,
  sample,
}: {
  id: string;
  sample: number;
}) {
  return (
    <g>
      <path
        d="M-23 -24l13-9h43l-13 9Z"
        fill={["#e6d0a6", "#e5ebe8", "#b1bbb1"][sample]}
        stroke="#81927e"
        strokeWidth=".6"
      />
      <path
        d="M20 -24l13-9V-9L20 0Z"
        fill={["#9e784b", "#8e9e9d", "#647368"][sample]}
        stroke="#718775"
        strokeWidth=".6"
      />
      <path
        d="M-23 -24H20V0H-23Z"
        fill={`url(#${id}-sample-${sample})`}
        stroke="#829480"
        strokeWidth=".6"
      />
      {sample === 0 && (
        <path
          d="M-20 -18q12 3 36-1M-20 -8q15-2 36 1"
          fill="none"
          stroke="#a38553"
          strokeWidth=".6"
          opacity=".5"
        />
      )}
    </g>
  );
}
export function DensityCylinder({
  x,
  volume,
  label,
  name,
  id,
  liquid = "water",
  children,
}: {
  x: number;
  volume: number;
  label: string;
  name: string;
  id: string;
  liquid?: string;
  children?: ReactNode;
}) {
  const y = q(cylinderLevel(volume)),
    bottom = CYLINDER_BASE;
  return (
    <g data-cylinder={name}>
      <path
        d={`M${x} 94Q${x + 42} 104 ${x + 84} 94V${bottom}Q${x + 42} ${bottom + 13} ${x} ${bottom}Z`}
        fill={`url(#${id}-glass)`}
        stroke="#9ab4b6"
        strokeWidth="1"
      />
      <rect
        data-instrument="cylinder-water"
        data-volume={q(volume)}
        x={x + 5}
        y={y}
        width="74"
        height={q(volume * ML_TO_PIXELS)}
        fill={`url(#${id}-${liquid})`}
      />
      {volume > 0 && (
        <path
          d={`M${x + 5} ${y - 4}Q${x + 42} ${y + 4} ${x + 79} ${y - 4}V${bottom - 2}Q${x + 42} ${bottom + 7} ${x + 5} ${bottom - 2}Z`}
          fill={`url(#${id}-${liquid})`}
          opacity=".45"
        />
      )}
      {children}
      <path
        d={`M${x} 94V${bottom}Q${x + 42} ${bottom + 13} ${x + 84} ${bottom}V94`}
        fill="none"
        stroke="#8faeb0"
        strokeWidth="1.5"
      />
      <path
        d={`M${x + 5} 103V${bottom - 4}M${x + 9} 110V${bottom - 15}M${x + 77} 110V${bottom - 9}`}
        stroke="#fff"
        strokeWidth="2"
        opacity=".5"
        fill="none"
      />
      {volume > 0 && (
        <path
          data-instrument="density-meniscus"
          d={`M${x + 5} ${y - 4}Q${x + 42} ${y + 4} ${x + 79} ${y - 4}`}
          fill="none"
          stroke="#5c9fae"
          strokeWidth="1"
        />
      )}
      {Array.from({ length: 26 }, (_, i) => i * 10).map((value) => (
        <g key={value}>
          <line
            x1={x + (value % 50 ? 58 : 50)}
            x2={x + 71}
            y1={cylinderLevel(value)}
            y2={cylinderLevel(value)}
            stroke="#4d7c82"
            strokeWidth={value % 50 ? 0.65 : 1}
          />
          {value % 50 === 0 && (
            <text
              x={x + 46}
              y={cylinderLevel(value) + 3}
              textAnchor="end"
              style={{ fontSize: 8.5, fill: "#456b70" }}
            >
              {value}
            </text>
          )}
        </g>
      ))}
      <text
        x={x + 42}
        y="116"
        textAnchor="middle"
        style={{ fontSize: 7, fill: "#63828a" }}
      >
        {CYLINDER_CAPACITY} мл
      </text>
      <path
        d={`M${x - 3} 94Q${x + 30} 86 ${x + 84} 94l5-5-7 10Q${x + 38} 105 ${x - 3} 94Z`}
        fill="#e3eeee"
        fillOpacity=".8"
        stroke="#91afb1"
        strokeWidth=".8"
      />
      <path
        d={`M${x + 34} ${bottom + 9}v9h16v-9`}
        fill={`url(#${id}-glass)`}
        stroke="#95afb0"
        strokeWidth=".8"
      />
      <ellipse
        cx={x + 42}
        cy={bottom + 21}
        rx="47"
        ry="5"
        fill={`url(#${id}-glass)`}
        stroke="#a4b9b5"
        strokeWidth="1"
      />
      <path
        d={`M${x - 5} ${bottom + 21}q47 8 94 0`}
        fill="none"
        stroke="#8da9a7"
        strokeWidth="1"
      />
      <text
        x={x + 42}
        y="75"
        textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        {label}
      </text>
    </g>
  );
}
export function DensityRuler({
  x,
  y,
  max,
  step = 32,
  vertical = false,
  angle = 0,
  label,
  mark,
}: {
  x: number;
  y: number;
  max: number;
  step?: number;
  vertical?: boolean;
  angle?: number;
  label: string;
  mark: number;
}) {
  return (
    <g
      data-instrument="density-ruler"
      transform={`translate(${q(x)} ${q(y)}) rotate(${vertical ? -90 : angle})`}
    >
      <rect
        x="-5"
        y="0"
        width={max * step + 10}
        height="17"
        rx="1.5"
        fill="#f4e9c8"
        stroke="#c4b789"
        strokeWidth=".7"
      />
      {Array.from({ length: max * 10 + 1 }, (_, i) => (
        <line
          key={i}
          x1={q((i * step) / 10)}
          x2={q((i * step) / 10)}
          y1="0"
          y2={i % 10 === 0 ? 7 : i % 5 === 0 ? 5 : 3}
          stroke="#8b815c"
          strokeWidth=".45"
        />
      ))}
      {Array.from({ length: max + 1 }, (_, i) => (
        <text
          key={i}
          x={i * step}
          y="14"
          textAnchor="middle"
          style={{ fontSize: 6.5, fill: "#6d6848" }}
        >
          {i}
        </text>
      ))}
      <path d={`M${q(mark * step - 3)} -5l3 4 3-4`} fill="#ae8a40" />
      <text
        x={(max * step) / 2}
        y="29"
        textAnchor="middle"
        style={{ fontSize: 9, fill: "#49644c" }}
      >
        {label}
      </text>
    </g>
  );
}
