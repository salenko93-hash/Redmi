/** Fixed two-metre apparatus. Only the support height and finish stop move. */
export function RampScene({
  distance,
  angle,
  phase,
  id,
}: {
  distance: number;
  angle: number;
  phase: number;
  id: string;
}) {
  const scale = 200,
    length = 2 * scale,
    travel = distance * scale,
    radians = (angle * Math.PI) / 180,
    endX = 530,
    endY = 295,
    startX = endX - length * Math.cos(radians),
    startY = endY - length * Math.sin(radians),
    finishX = startX + travel * Math.cos(radians),
    finishY = startY + travel * Math.sin(radians);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8eeed" />
          <stop offset=".45" stopColor="#afbcb9" />
          <stop offset="1" stopColor="#778b83" />
        </linearGradient>
        <radialGradient id={`${id}-ball`} cx="35%" cy="25%" r="70%">
          <stop offset="0" stopColor="#fff4b7" />
          <stop offset=".55" stopColor="#e8be58" />
          <stop offset="1" stopColor="#b5862f" />
        </radialGradient>
      </defs>
      <text x="28" y="25">
        Лінійка: 0–2 м
      </text>
      <text x="572" y="25" textAnchor="end">
        Шлях: {distance} м · Нахил: {angle}°
      </text>

      {/* Bench and the left-hand stand remain level. */}
      <rect x="24" y="333" width="552" height="12" rx="3" fill="#c69760" />
      <path
        d="M40 345H560V359H40Z M53 359H72V383H53Z M528 359H547V383H528Z"
        fill="#8c6848"
      />
      <path
        d="M46 333V324H106V333 M75 324V42"
        fill="none"
        stroke="#667d72"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line x1="75" x2="75" y1="48" y2="321" stroke="#c4d0c9" strokeWidth="2" />
      <line
        x1="75"
        x2={startX + 8}
        y1={startY + 12}
        y2={startY + 12}
        stroke="#687e72"
        strokeWidth="7"
      />
      <rect
        data-instrument="clamp"
        x="65"
        y={startY + 3}
        width="20"
        height="19"
        rx="4"
        fill="#405d50"
      />
      <circle cx="60" cy={startY + 12} r="5" fill="#8b9e91" stroke="#405d50" />
      <rect
        x={startX - 12}
        y={startY + 7}
        width="32"
        height="10"
        rx="3"
        fill="#687e72"
      />
      <path
        d={`M${endX - 8} 332V${endY + 13}H${endX + 8}V332`}
        fill="#c7d2c8"
        stroke="#8b9e91"
      />

      <g transform={`translate(${startX} ${startY}) rotate(${angle})`}>
        <rect
          x="-4"
          y="0"
          width={length + 8}
          height="10"
          rx="4"
          fill={`url(#${id}-metal)`}
          stroke="#687d71"
        />
        <line
          data-instrument="ramp"
          x1="0"
          y1="0"
          x2={length}
          y2="0"
          stroke="#687d71"
          strokeWidth="2"
        />
        <line
          data-instrument="path"
          x1="0"
          y1="0"
          x2={travel}
          y2="0"
          stroke="#b18a3f"
          strokeWidth="4"
        />
        <g className="ramp-ruler" data-instrument="ruler">
          <rect
            x="0"
            y="14"
            width={length}
            height="25"
            rx="2"
            fill="#fbf6df"
            stroke="#c4bb98"
          />
          {Array.from({ length: 21 }, (_, i) => (
            <line
              key={i}
              x1={i * 20}
              x2={i * 20}
              y1="14"
              y2={i % 5 ? 21 : 26}
              stroke="#8d886d"
            />
          ))}
          {[0, 0.5, 1, 1.5, 2].map((value) => (
            <text
              key={value}
              x={value * scale + (value === 0 ? 5 : value === 2 ? -5 : 0)}
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
          x={travel + 12}
          y="-29"
          width="12"
          height="31"
          rx="4"
          fill="#5f7468"
          stroke="#3f594b"
        />
        <circle
          data-instrument="ball"
          cx={travel * phase ** 2}
          cy="-13"
          r="11"
          fill={`url(#${id}-ball)`}
          stroke="#967a37"
          strokeWidth="2"
        />
      </g>

      {/* Labels live outside the rotated group so they are always horizontal. */}
      <g data-instrument="start-label">
        <text
          x={startX - 16}
          y={startY - 28}
          textAnchor="end"
          style={{ fontWeight: 600 }}
        >
          Старт
        </text>
        <path
          d={`M${startX - 12} ${startY - 23}L${startX} ${startY - 17}`}
          fill="none"
          stroke="#819383"
        />
      </g>
      <g data-instrument="finish-label">
        <text x={finishX + 18} y={finishY - 36} style={{ fontWeight: 600 }}>
          Фініш
        </text>
        <path
          d={`M${finishX + 15} ${finishY - 31}L${finishX + 10} ${finishY - 22}`}
          fill="none"
          stroke="#819383"
        />
      </g>
      <text x="300" y="397" textAnchor="middle" style={{ fontSize: 11 }}>
        Поділка лінійки: 0,1 м · золотиста ділянка — вибраний шлях
      </text>
    </g>
  );
}
