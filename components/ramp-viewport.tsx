"use client";
import { useEffect, useRef, useState } from "react";
import {
  rampBallProperties,
  rampGeometry,
  rampMaterials,
  rampMotion,
  RAMP_SCALE,
} from "@/lib/ramp";

/** Fit with one uniform scale: the displayed angle and circular ball stay true. */
export function RampViewport({
  distance,
  angle,
  diameter,
  material,
  airResistance,
  phase,
  id,
  label,
}: {
  distance: number;
  angle: number;
  diameter: number;
  material: number;
  airResistance: number;
  phase: number;
  id: string;
  label: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 900, height: 330 });
  useEffect(() => {
    const node = svg.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width),
        height = Math.round(rect.height);
      if (width > 0 && height > 0)
        setSize((previous) =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const { width, height } = size;
  const motion = rampMotion(distance, angle, material, diameter, airResistance);
  const v = rampGeometry(
    distance,
    angle,
    diameter,
    phase,
    motion.position(motion.time * phase) / distance,
  );
  const ball = rampBallProperties(material, diameter),
    selected = rampMaterials[material];
  const sin = Math.sin(v.radians),
    cos = Math.cos(v.radians);
  const margin = Math.min(22, width * 0.035),
    benchY = height - 36;
  const lowerExtent = Math.max(34 * cos, 45 * sin + 10 * cos);
  const top = width < 600 ? 48 : 26;
  const upperExtent =
    Math.max(
      (v.radius + 2) * cos + v.radius,
      v.stopHeight * cos - v.travel * sin,
    ) + 3;
  const scale = Math.max(
    0.1,
    Math.min(
      (width - margin * 2 - 72) / ((v.length + 45) * cos + 12 * sin),
      (benchY - 8 - top) / (v.length * sin + upperExtent + lowerExtent),
    ),
  );
  const endY = benchY - 8 - lowerExtent * scale;
  const endX = width - margin - (45 * cos + 12 * sin) * scale;
  const startX = endX - v.length * cos * scale,
    startY = endY - v.length * sin * scale;
  const standX = Math.max(margin + 10, startX - 64);
  const point = (x: number, y: number) => ({
    x: startX + scale * (x * cos - y * sin),
    y: startY + scale * (x * sin + y * cos),
  });
  const start = point(0, v.ballY),
    finish = point(v.travel, v.ballY);
  return (
    <svg
      ref={svg}
      className="simulation-scene ramp-wide-scene"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern
          id={`${id}-grid`}
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path d="M28 0H0V28" fill="none" stroke="#dde8d7" strokeWidth=".6" />
        </pattern>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#edf3f4" />
          <stop offset=".3" stopColor="#9fb2bb" />
          <stop offset=".6" stopColor="#e0e9ed" />
          <stop offset="1" stopColor="#617681" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d1a168" />
          <stop offset="1" stopColor="#ac7743" />
        </linearGradient>
        <linearGradient id={`${id}-rod`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#536b73" />
          <stop offset=".4" stopColor="#e3edef" />
          <stop offset="1" stopColor="#576d75" />
        </linearGradient>
        <radialGradient id={`${id}-ball`} cx="30%" cy="25%" r="75%">
          <stop offset="0" stopColor={selected.light} />
          <stop offset=".45" stopColor={selected.middle} />
          <stop offset="1" stopColor={selected.dark} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill="#f2f7ed" />
      <rect width={width} height={height} fill={`url(#${id}-grid)`} />
      <g
        fill="#45624f"
        style={{ fontSize: 12, fontFamily: "Arial, sans-serif" }}
      >
        <text x={margin} y="17">
          Лінійка: 0–2 м
        </text>
        <text x={width - margin} y={width < 600 ? 34 : 17} textAnchor="end">
          Шлях: {String(distance).replace(".", ",")} м · Нахил: {angle}°
        </text>
        {width >= 640 && (
          <g
            data-instrument="ball-preview"
            transform={`translate(${width - margin - 188} 30)`}
          >
            <rect
              width="188"
              height="64"
              rx="9"
              fill="#ffffffdf"
              stroke="#d7e1d3"
            />
            <circle
              cx="22"
              cy="31"
              r="9"
              fill={`url(#${id}-ball)`}
              stroke={selected.edge}
            />
            <text x="40" y="20" fontWeight="600">
              {selected.shortName}
            </text>
            <text x="40" y="38">
              d = {diameter} мм
            </text>
            <text x="40" y="55">
              m ={" "}
              {(ball.mass * 1000).toLocaleString("uk-UA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              г
            </text>
          </g>
        )}
        <g data-instrument="bench">
          <path
            d={`M${margin} ${benchY}H${width - margin}l5 6H${margin - 5}Z`}
            fill="#e0b783"
          />
          <rect
            x={margin - 3}
            y={benchY + 5}
            width={width - margin * 2 + 6}
            height="9"
            rx="3"
            fill={`url(#${id}-wood)`}
          />
          <path
            d={`M${margin + 12} ${benchY + 14}H${width - margin - 12}v8H${margin + 12}Z M${margin + 26} ${benchY + 22}h18v10h-18Z M${width - margin - 44} ${benchY + 22}h18v10h-18Z`}
            fill="#8c6848"
          />
          <path
            d={`M${margin + 18} ${benchY + 17}H${width - margin - 18}`}
            stroke="#bd8c56"
            strokeWidth="2"
          />
        </g>
        <path
          d={`M${standX - 30} ${benchY}v-10h60v10`}
          fill="none"
          stroke="#496257"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect
          x={standX - 4}
          y={Math.max(29, startY - 45)}
          width="8"
          height={benchY - 10 - Math.max(29, startY - 45)}
          rx="4"
          fill={`url(#${id}-rod)`}
          stroke="#617a73"
        />
        <path
          d={`M${standX} ${startY + 10}H${startX + 7}`}
          stroke="#506b61"
          strokeWidth="8"
        />
        <path
          d={`M${standX + 5} ${startY + 8}H${startX + 7}`}
          stroke="#bccdc6"
          strokeWidth="2"
        />
        <rect
          x={standX - 10}
          y={startY + 2}
          width="20"
          height="18"
          rx="4"
          fill="#405d50"
        />
        <circle
          cx={standX - 16}
          cy={startY + 11}
          r="5"
          fill="#8b9e91"
          stroke="#405d50"
        />
        <path
          d={`M${endX - 7} ${benchY}V${endY + 14}h14V${benchY}`}
          fill="#c7d2c8"
          stroke="#8b9e91"
        />
        <g transform={`translate(${startX} ${startY}) scale(${scale})`}>
          <g transform={`rotate(${angle})`}>
            <rect
              x="-5"
              y="0"
              width={v.railLength + 10}
              height="10"
              rx="4"
              fill={`url(#${id}-metal)`}
              stroke="#647d87"
            />
            <line
              data-instrument="ramp"
              x1="0"
              y1="0"
              x2={v.length}
              y2="0"
              stroke="#647b82"
              strokeWidth="2"
            />
            <line
              x1={v.length}
              y1="0"
              x2={v.railLength}
              y2="0"
              stroke="#647b82"
              strokeWidth="2"
            />
            <line
              data-instrument="path"
              x1="0"
              y1="0"
              x2={v.travel}
              y2="0"
              stroke="#b18a3f"
              strokeWidth="3"
            />
            <g data-instrument="ruler" className="ramp-ruler">
              <rect
                y="13"
                width={v.length}
                height="21"
                rx="2"
                fill="#fbf6df"
                stroke="#c4bb98"
              />
              {Array.from({ length: 21 }, (_, i) => (
                <line
                  key={i}
                  x1={i * 20}
                  x2={i * 20}
                  y1="13"
                  y2={i % 5 ? 19 : 24}
                  stroke="#8d886d"
                  strokeWidth={1 / scale}
                />
              ))}
              {[0, 0.5, 1, 1.5, 2].map((value) => (
                <text
                  key={value}
                  x={
                    value * RAMP_SCALE +
                    (value === 0 ? 5 : value === 2 ? -5 : 0)
                  }
                  y="31"
                  textAnchor={
                    value === 0 ? "start" : value === 2 ? "end" : "middle"
                  }
                  style={{ fontSize: Math.min(12, 12 / scale) }}
                >
                  {String(value).replace(".", ",")}
                  {value === 2 ? " м" : ""}
                </text>
              ))}
            </g>
            <rect
              data-instrument="finish-stop"
              x={v.stopX}
              y={-v.stopHeight}
              width="12"
              height={v.stopHeight + 2}
              rx="3"
              fill="#49695f"
              stroke="#304e43"
            />
            <ellipse
              cx={v.ballX}
              cy="-1"
              rx={v.radius * 0.85}
              ry={Math.max(1, v.radius * 0.13)}
              fill="#203d35"
              opacity=".2"
            />
            <circle
              data-instrument="ball"
              data-material={material}
              data-diameter-mm={diameter}
              cx={v.ballX}
              cy={v.ballY}
              r={v.radius}
              fill={`url(#${id}-ball)`}
              stroke={selected.edge}
            />
            <g
              data-instrument="ball-mark"
              data-rotations={v.rotations}
              transform={`translate(${v.ballX} ${v.ballY}) rotate(${v.rotation})`}
            >
              <ellipse
                rx={v.radius * 0.28}
                ry={v.radius * 0.88}
                fill="none"
                stroke={selected.mark}
                strokeWidth={Math.max(0.5, v.radius * 0.06)}
                opacity=".55"
              />
              <path
                d={`M${-v.radius * 0.84} 0Q0 ${v.radius * 0.3} ${v.radius * 0.84} 0`}
                fill="none"
                stroke={selected.mark}
                strokeWidth={Math.max(0.5, v.radius * 0.06)}
                opacity=".55"
              />
            </g>
          </g>
        </g>
        <g data-instrument="start-label">
          <text
            x={start.x - 12}
            y={Math.max(top, start.y + 4)}
            textAnchor="end"
            fontWeight="600"
          >
            Старт
          </text>
        </g>
        <g data-instrument="finish-label">
          <text
            x={finish.x - v.radius * scale - 10}
            y={Math.max(top, finish.y - v.radius * scale - 12)}
            textAnchor="end"
            fontWeight="600"
          >
            Фініш
          </text>
        </g>
        <text
          x={width / 2}
          y={height - 3}
          textAnchor="middle"
          style={{ fontSize: 10 }}
        >
          Лінійка 0–2 м · кулька збільшена ×4
        </text>
      </g>
    </svg>
  );
}
