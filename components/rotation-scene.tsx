import {
  rotationGeometry,
  ROTATION_BALL_RADIUS,
  type RotationView,
} from "@/lib/rotation-view";
const coordinate = (value: number) => Number(value.toFixed(4));
/** A model of prescribed motion. The thread is shown in projection; tension is not inferred. */
export function RotationScene({
  radius,
  cycles,
  phase,
  elapsed,
  id,
  view = "perspective",
}: {
  radius: number;
  cycles: number;
  phase: number;
  elapsed: number;
  id: string;
  view?: RotationView;
}) {
  const g = rotationGeometry(radius, cycles, phase, view),
    br = ROTATION_BALL_RADIUS;
  return (
    <g data-instrument="rotation-installation" data-view={view}>
      <defs>
        <linearGradient id={`${id}-bench`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dec29b" />
          <stop offset=".65" stopColor="#c49a69" />
          <stop offset="1" stopColor="#a87948" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f7fa" />
          <stop offset=".3" stopColor="#acbec7" />
          <stop offset=".6" stopColor="#e2eaf0" />
          <stop offset="1" stopColor="#657b86" />
        </linearGradient>
        <radialGradient id={`${id}-plate`} cx="35%" cy="28%" r="85%">
          <stop offset="0" stopColor="#fffefa" />
          <stop offset="1" stopColor="#e5e9df" />
        </radialGradient>
        <radialGradient id={`${id}-sphere`} cx="30%" cy="25%" r="75%">
          <stop offset="0" stopColor="#ffe9b6" />
          <stop offset=".45" stopColor="#e6ab61" />
          <stop offset="1" stopColor="#a26832" />
        </radialGradient>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#52645f" />
          <stop offset=".5" stopColor="#263d35" />
          <stop offset="1" stopColor="#182d27" />
        </linearGradient>
        <linearGradient id={`${id}-lcd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9e5c5" />
          <stop offset="1" stopColor="#b9cdab" />
        </linearGradient>
      </defs>
      <text x="25" y="27" style={{ fontSize: 12, fontWeight: 600 }}>
        Рух по колу · {view === "top" ? "вигляд зверху" : "об’ємний вигляд"}
      </text>
      <text x="575" y="27" textAnchor="end" style={{ fontSize: 10 }}>
        Рівномірний рух · за годинниковою стрілкою
      </text>

      {/* Bench, fixed measuring platform and printed angular/radial graduations. */}
      <rect
        x="27"
        y="72"
        width="552"
        height="347"
        rx="13"
        fill="#26392d"
        opacity=".12"
      />
      <rect
        x="23"
        y="64"
        width="552"
        height="345"
        rx="13"
        fill={`url(#${id}-bench)`}
        stroke="#ad8357"
      />
      {[94, 133, 174, 215, 258, 303, 352, 391].map((y, i) => (
        <path
          key={y}
          d={`M34 ${y}C140 ${y - 6 + i} 310 ${y + 8 - i} 563 ${y - 2}`}
          fill="none"
          stroke={i % 2 ? "#ecd5b4" : "#a97d4e"}
          strokeWidth=".7"
          opacity=".35"
        />
      ))}
      <path
        d="M28 402H570V418H28Z M46 418H65V438H46Z M536 418H554V438H536Z"
        fill="#8c6848"
      />
      <line
        x1="31"
        y1="406"
        x2="570"
        y2="406"
        stroke="#e4bd89"
        strokeWidth="2"
      />
      <ellipse
        cx={g.cx + 4}
        cy={g.cy + 15}
        rx="171"
        ry={168 * g.squash}
        fill="#293f33"
        opacity=".15"
      />
      <ellipse
        cx={g.cx}
        cy={g.cy + 8}
        rx="165"
        ry={165 * g.squash}
        fill="#71817b"
      />
      <g transform={g.planeTransform} data-instrument="rotation-plane">
        <circle
          cx={g.cx}
          cy={g.cy}
          r="165"
          fill={`url(#${id}-rim)`}
          stroke="#71847f"
        />
        <circle
          cx={g.cx}
          cy={g.cy}
          r="153"
          fill={`url(#${id}-plate)`}
          stroke="#b1bcb0"
        />
        {Array.from({ length: 72 }, (_, index) => {
          const angle = (index * Math.PI) / 36,
            major = index % 6 === 0;
          // Points here are in the physical plane, so apply projection only via the group.
          return (
            <line
              key={index}
              x1={coordinate(g.cx + (major ? 143 : 148) * Math.cos(angle))}
              y1={coordinate(g.cy + (major ? 143 : 148) * Math.sin(angle))}
              x2={coordinate(g.cx + 153 * Math.cos(angle))}
              y2={coordinate(g.cy + 153 * Math.sin(angle))}
              stroke="#74857a"
              strokeWidth={major ? 1.4 : 0.6}
            />
          );
        })}
        {[0, 90, 180, 270].map((degrees) => (
          <text
            key={degrees}
            x={coordinate(g.cx + 132 * Math.cos((degrees * Math.PI) / 180))}
            y={coordinate(g.cy + 132 * Math.sin((degrees * Math.PI) / 180) + 3)}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "#7e8c7d" }}
          >
            {degrees}°
          </text>
        ))}
        {[
          Math.PI / 4,
          (3 * Math.PI) / 4,
          (5 * Math.PI) / 4,
          (7 * Math.PI) / 4,
        ].map((angle) => (
          <g
            key={angle}
            transform={`translate(${coordinate(g.cx + 159 * Math.cos(angle))} ${coordinate(g.cy + 159 * Math.sin(angle))})`}
          >
            <circle r="3.2" fill="#758981" stroke="#e0e8e2" />
            <line
              x1="-1.8"
              y1="-1"
              x2="1.8"
              y2="1"
              stroke="#3f5550"
              strokeWidth=".8"
            />
          </g>
        ))}
        <path
          d={`M${g.cx - 125} ${g.cy}H${g.cx + 125} M${g.cx} ${g.cy - 125}V${g.cy + 125}`}
          stroke="#c8d1c3"
          strokeWidth=".65"
        />
        <circle
          data-instrument="orbit"
          cx={g.cx}
          cy={g.cy}
          r={g.r}
          fill="none"
          stroke="#8faaa8"
          strokeWidth="1.8"
          strokeDasharray="5 4"
        />
        <rect
          x={g.cx}
          y={g.cy + 23}
          width="120"
          height="15"
          rx="2"
          fill="#fbf2d6"
          stroke="#c4b48b"
          strokeWidth=".6"
        />
        {Array.from({ length: 31 }, (_, i) => (
          <line
            key={i}
            x1={g.cx + i * 4}
            x2={g.cx + i * 4}
            y1={g.cy + 23}
            y2={g.cy + (i % 10 === 0 ? 31 : i % 5 === 0 ? 29 : 26)}
            stroke="#8d8269"
            strokeWidth=".55"
          />
        ))}
        {[0, 10, 20, 30].map((cm) => (
          <text
            key={cm}
            x={g.cx + cm * 4 + (cm === 0 ? 2 : cm === 30 ? -2 : 0)}
            y={g.cy + 36}
            textAnchor={cm === 0 ? "start" : cm === 30 ? "end" : "middle"}
            style={{ fontSize: 6, fill: "#6e6656" }}
          >
            {cm}
            {cm === 30 ? " см" : ""}
          </text>
        ))}
        <path
          d={`M${g.cx - 105} ${g.cy - 70}A126 126 0 0 1 ${g.cx - 65} ${g.cy - 108} M${g.cx - 65} ${g.cy - 108}l-8 2m8-2l-2 8`}
          fill="none"
          stroke="#a6b5a0"
          strokeWidth="1.6"
        />
      </g>

      {/* Start gate marks a crossing, not the first completed revolution. */}
      <line
        x1={g.cx + g.r}
        x2={g.cx + g.r}
        y1={g.cy - 23 * g.squash}
        y2={g.cy + 23 * g.squash}
        stroke="#b68235"
        strokeWidth="1.4"
        strokeDasharray="3 3"
      />
      <path
        d={`M${g.cx + g.r - 4} ${g.cy - 23 * g.squash}h8v5h-8Z M${g.cx + g.r - 4} ${g.cy + 23 * g.squash - 5}h8v5h-8Z`}
        fill="#ba8c48"
        stroke="#876337"
        strokeWidth=".7"
      />
      <text
        x={g.cx + g.r + 10}
        y={g.cy - 28 * g.squash - 5}
        style={{ fontSize: 10, fontWeight: 600 }}
      >
        Мітка 0
      </text>

      {/* Taut-looking projected thread, ending at the ball surface. */}
      <line
        x1={g.cx + 1}
        y1={g.cy + 4}
        x2={g.end.x + 1}
        y2={g.end.y + 4}
        stroke="#534e3b"
        strokeWidth="2.4"
        opacity=".18"
      />
      <line
        data-instrument="rotation-string"
        x1={g.cx}
        y1={g.cy}
        x2={g.end.x}
        y2={g.end.y}
        stroke="#ac8b4b"
        strokeWidth="1.8"
      />
      <line
        x1={g.cx}
        y1={g.cy}
        x2={g.end.x}
        y2={g.end.y}
        stroke="#f6dfad"
        strokeWidth=".6"
        strokeDasharray="1 2"
      />
      <ellipse
        cx={g.cx + 2}
        cy={g.cy + 5}
        rx="16"
        ry={10 * g.squash}
        fill="#283e33"
        opacity=".2"
      />
      <ellipse
        cx={g.cx}
        cy={g.cy + 3}
        rx="13"
        ry={13 * g.squash}
        fill="#546f68"
      />
      <ellipse
        data-instrument="rotation-anchor"
        cx={g.cx}
        cy={g.cy}
        rx="13"
        ry={13 * g.squash}
        fill={`url(#${id}-rim)`}
        stroke="#6a817a"
      />
      <ellipse cx={g.cx} cy={g.cy} rx="6" ry={6 * g.squash} fill="#536b61" />
      <path d={`M${g.cx - 3} ${g.cy}h6`} stroke="#dce8de" strokeWidth="1.3" />
      <ellipse
        data-instrument="rotation-shadow"
        cx={g.ball.x + 3}
        cy={g.ball.y + 8}
        rx="12"
        ry={4 * g.squash}
        fill="#263e32"
        opacity=".22"
      />
      <circle
        data-instrument="rotating-ball"
        cx={g.ball.x}
        cy={g.ball.y}
        r={br}
        fill={`url(#${id}-sphere)`}
        stroke="#a36f35"
        strokeWidth=".9"
      />
      <path
        d={`M${g.ball.x - 7} ${g.ball.y - 8}Q${g.ball.x + 4} ${g.ball.y - 2} ${g.ball.x + 7} ${g.ball.y + 8}`}
        fill="none"
        stroke="#f6cf8d"
        strokeWidth=".7"
        opacity=".7"
      />
      <circle cx={g.end.x} cy={g.end.y} r="1.6" fill="#895b2d" />

      {/* Digital instrument: no decorative controls that pretend to be clickable. */}
      <rect
        x="428"
        y="102"
        width="148"
        height="285"
        rx="18"
        fill="#1d352b"
        opacity=".18"
      />
      <rect
        x="424"
        y="94"
        width="148"
        height="285"
        rx="18"
        fill={`url(#${id}-case)`}
        stroke="#213c30"
        strokeWidth="1.5"
      />
      <path
        d="M434 111Q437 101 449 101H548"
        fill="none"
        stroke="#8d9d8c"
        strokeWidth="1.2"
        opacity=".65"
      />
      {[
        [435, 108],
        [561, 108],
        [435, 365],
        [561, 365],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="2.7" fill="#677b6c" />
          <line x1={x - 1.5} y1={y} x2={x + 1.5} y2={y} stroke="#243d30" />
        </g>
      ))}
      <text
        x="498"
        y="122"
        textAnchor="middle"
        style={{ fontSize: 8.5, fill: "#d1ddc8", letterSpacing: 1 }}
      >
        ПОКАЗИ МОДЕЛІ
      </text>
      <rect x="436" y="135" width="124" height="72" rx="7" fill="#14281e" />
      <rect
        x="439"
        y="138"
        width="118"
        height="66"
        rx="5"
        fill={`url(#${id}-lcd)`}
      />
      <path d="M443 141H553V158L443 180Z" fill="#f4f8e9" opacity=".2" />
      <text x="448" y="154" style={{ fontSize: 8, fill: "#4d6753" }}>
        ЧАС МОДЕЛІ
      </text>
      <text
        data-instrument="rotation-time"
        x="448"
        y="186"
        style={{
          fontFamily: "monospace",
          fontSize: 22,
          fontWeight: 650,
          fill: "#233f2e",
        }}
      >
        {elapsed.toFixed(2).replace(".", ",")} с
      </text>
      <text
        x="498"
        y="230"
        textAnchor="middle"
        style={{ fontSize: 8.5, fill: "#d1ddc8", letterSpacing: 0.7 }}
      >
        ПОВНИХ ОБЕРТІВ
      </text>
      <rect x="436" y="242" width="124" height="63" rx="7" fill="#14281e" />
      <rect
        x="439"
        y="245"
        width="118"
        height="57"
        rx="5"
        fill={`url(#${id}-lcd)`}
      />
      <text
        data-instrument="rotation-count"
        x="498"
        y="283"
        textAnchor="middle"
        style={{
          fontFamily: "monospace",
          fontSize: 26,
          fontWeight: 650,
          fill: "#233f2e",
        }}
      >
        {g.completed} / {cycles}
      </text>
      <circle cx="446" cy="326" r="3" fill="#a9cd89" />
      <text x="456" y="329" style={{ fontSize: 9, fill: "#d8e2cf" }}>
        {g.fraction === 1
          ? "Відлік завершено"
          : g.fraction === 0
            ? "Готово до відліку"
            : "Відлік обертів"}
      </text>
      <text
        x="498"
        y="352"
        textAnchor="middle"
        style={{ fontSize: 9, fill: "#b2c5ae" }}
      >
        Мітка → мітка = 1 оберт
      </text>
      <text x="215" y="431" textAnchor="middle" style={{ fontSize: 11 }}>
        Радіус траєкторії: {String(radius).replace(".", ",")} м
      </text>
      <text x="215" y="449" textAnchor="middle" style={{ fontSize: 9.5 }}>
        Від осі до центра кульки · нитка показана у проєкції
      </text>
    </g>
  );
}
