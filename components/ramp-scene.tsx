import {
  rampBallProperties,
  rampGeometry,
  rampMotion,
  rampMaterials,
  RAMP_BALL_MAGNIFICATION,
  RAMP_SCALE,
} from "@/lib/ramp";
/** Fixed two-metre apparatus; sphere diameters share an explicitly enlarged scale. */
export function RampScene({
  distance,
  angle,
  diameter = 20,
  material = 0,
  airResistance = 0,
  phase,
  id,
}: {
  distance: number;
  angle: number;
  diameter?: number;
  material?: number;
  airResistance?: number;
  phase: number;
  id: string;
}) {
  const motion = rampMotion(distance, angle, material, diameter, airResistance);
  const fraction = motion.position(motion.time * phase) / distance;
  const v = rampGeometry(distance, angle, diameter, phase, fraction),
    ball = rampBallProperties(material, diameter),
    finish = v.stopTop;
  const selected = rampMaterials[material],
    previewRadius = diameter * 0.36;
  const mark = (radius: number) => (
    <>
      <ellipse
        rx={radius * 0.28}
        ry={radius * 0.88}
        fill="none"
        stroke={selected.mark}
        strokeWidth={Math.max(0.8, radius * 0.065)}
        opacity=".55"
      />
      <path
        d={`M${-radius * 0.84} 0Q0 ${radius * 0.3} ${radius * 0.84} 0`}
        fill="none"
        stroke={selected.mark}
        strokeWidth={Math.max(0.8, radius * 0.06)}
        opacity=".5"
      />
    </>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#edf3f4" />
          <stop offset=".3" stopColor="#9fb2bb" />
          <stop offset=".58" stopColor="#e0e9ed" />
          <stop offset="1" stopColor="#617681" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d1a168" />
          <stop offset="1" stopColor="#ac7743" />
        </linearGradient>
        <radialGradient id={`${id}-ball`} cx="30%" cy="25%" r="75%">
          <stop offset="0" stopColor={selected.light} />
          <stop offset=".45" stopColor={selected.middle} />
          <stop offset="1" stopColor={selected.dark} />
        </radialGradient>
        <linearGradient id={`${id}-rod`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#536b73" />
          <stop offset=".4" stopColor="#e3edef" />
          <stop offset=".65" stopColor="#b5c5ca" />
          <stop offset="1" stopColor="#576d75" />
        </linearGradient>
      </defs>
      <text x="28" y="25">
        Лінійка: 0–2 м
      </text>
      <text x="572" y="25" textAnchor="end">
        Шлях: {String(distance).replace(".", ",")} м · Нахил: {angle}°
      </text>

      <g data-instrument="ball-preview" aria-hidden="true">
        <rect
          x="370"
          y="44"
          width="204"
          height="78"
          rx="10"
          fill="#ffffffd9"
          stroke="#d7e1d3"
        />
        <ellipse
          cx="395"
          cy="103"
          rx={previewRadius * 0.9}
          ry="2.4"
          fill="#284439"
          opacity=".13"
        />
        <circle
          cx="395"
          cy="81"
          r={previewRadius}
          fill={`url(#${id}-ball)`}
          stroke={selected.edge}
        />
        <g transform="translate(395 81)">{mark(previewRadius)}</g>
        <path
          d={`M${395 - previewRadius} 107V113 M${395 - previewRadius} 110H${395 + previewRadius} M${395 + previewRadius} 107V113`}
          fill="none"
          stroke="#6d8375"
          strokeWidth=".8"
        />
        <text x="425" y="61" style={{ fontSize: 10, fontWeight: 600 }}>
          {selected.shortName}
        </text>
        <text x="425" y="82" style={{ fontSize: 10 }}>
          d = {diameter} мм
        </text>
        <text x="425" y="103" style={{ fontSize: 10 }}>
          m ={" "}
          {(ball.mass * 1000).toLocaleString("uk-UA", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}{" "}
          г
        </text>
      </g>

      {/* Level bench, metal stand, adjustable boss and clamp. */}
      <path d="M29 331H571L578 338H22Z" fill="#e0b783" />
      <rect
        x="24"
        y="333"
        width="552"
        height="12"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M40 345H560V359H40Z M53 359H72V383H53Z M528 359H547V383H528Z"
        fill="#8c6848"
      />
      <path
        d="M44 348H556 M57 361V380 M532 361V380"
        fill="none"
        stroke="#bd8c56"
        strokeWidth="2"
      />
      <ellipse cx="76" cy="332" rx="41" ry="4" fill="#203b30" opacity=".12" />
      <path
        d="M46 333V324H106V333"
        fill="none"
        stroke="#496257"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect
        x="71"
        y="38"
        width="8"
        height="286"
        rx="4"
        fill={`url(#${id}-rod)`}
        stroke="#617a73"
      />
      <line
        x1="75"
        x2={v.startX + 8}
        y1={v.startY + 12}
        y2={v.startY + 12}
        stroke="#506b61"
        strokeWidth="8"
      />
      <line
        x1="83"
        x2={v.startX + 8}
        y1={v.startY + 10}
        y2={v.startY + 10}
        stroke="#bccdc6"
        strokeWidth="2"
      />
      <rect
        data-instrument="clamp"
        x="65"
        y={v.startY + 3}
        width="20"
        height="19"
        rx="4"
        fill="#405d50"
      />
      <circle
        cx="60"
        cy={v.startY + 12}
        r="5"
        fill="#8b9e91"
        stroke="#405d50"
      />
      <path
        d={`M58 ${v.startY + 9}V${v.startY + 15} M57 ${v.startY + 12}H63`}
        stroke="#405d50"
      />
      <rect
        x={v.startX - 12}
        y={v.startY + 7}
        width="32"
        height="10"
        rx="3"
        fill="#687e72"
      />
      <path
        d={`M${v.endX - 8} 332V${v.endY + 13}H${v.endX + 8}V332`}
        fill="#c7d2c8"
        stroke="#8b9e91"
      />

      <g transform={`translate(${v.startX} ${v.startY}) rotate(${angle})`}>
        <rect
          x="-5"
          y="0"
          width={v.railLength + 10}
          height="12"
          rx="5"
          fill={`url(#${id}-metal)`}
          stroke="#647d87"
        />
        <line
          x1="0"
          x2={v.length}
          y1="7"
          y2="7"
          stroke="#f2f7f9"
          strokeWidth="1.2"
          opacity=".8"
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
          x2={v.railLength}
          y1="0"
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
          strokeWidth="4"
        />
        <g className="ramp-ruler" data-instrument="ruler">
          <rect
            x="0"
            y="16"
            width={v.length}
            height="23"
            rx="2"
            fill="#fbf6df"
            stroke="#c4bb98"
          />
          {Array.from({ length: 21 }, (_, i) => (
            <line
              key={i}
              x1={i * 20}
              x2={i * 20}
              y1="16"
              y2={i % 5 ? 23 : 28}
              stroke="#8d886d"
            />
          ))}
          {[0, 0.5, 1, 1.5, 2].map((value) => (
            <text
              key={value}
              x={value * RAMP_SCALE + (value === 0 ? 5 : value === 2 ? -5 : 0)}
              y="36"
              textAnchor={
                value === 0 ? "start" : value === 2 ? "end" : "middle"
              }
              style={{ fontSize: 10 }}
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
        <path
          d={`M${v.stopX + 2} ${-v.stopHeight + 3}H${v.stopX + 9}`}
          stroke="#b8cbc1"
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
          strokeWidth="1"
        />
        <g
          data-instrument="ball-mark"
          data-rotations={v.rotations}
          transform={`translate(${v.ballX} ${v.ballY}) rotate(${v.rotation})`}
        >
          {mark(v.radius)}
        </g>
      </g>

      {/* Labels remain horizontal at every slope; the stop face follows the selected radius. */}
      <g data-instrument="start-label">
        <text
          x={v.start.x}
          y={v.start.y - v.radius - 8}
          textAnchor="middle"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Старт
        </text>
        <path
          d={`M${v.start.x} ${v.start.y - v.radius - 5}V${v.start.y - v.radius - 2}`}
          stroke="#819383"
        />
      </g>
      <g data-instrument="finish-label">
        <text
          x={finish.x}
          y={finish.y - 9}
          textAnchor="middle"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Фініш
        </text>
        <path
          d={`M${finish.x} ${finish.y - 6}V${finish.y - 2}`}
          stroke="#819383"
        />
      </g>
      <text x="300" y="399" textAnchor="middle" style={{ fontSize: 9.5 }}>
        Поділка: 0,1 м · кулька збільшена ×{RAMP_BALL_MAGNIFICATION} для
        наочності
      </text>
    </g>
  );
}
