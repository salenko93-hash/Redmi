import {
  pendulumGeometry,
  PENDULUM_BOB_RADIUS,
  PENDULUM_SCALE,
} from "@/lib/pendulum-view";
const q = (value: number) => Number(value.toFixed(4));
const fmt = (value: number) =>
  value.toLocaleString("uk-UA", { maximumFractionDigits: 3 });
const seriesNames: Record<string, string> = {
  amplitude: "Серія A · змінюємо амплітуду",
  length: "Серія l · змінюємо довжину",
  mass: "Серія m · змінюємо масу",
};
/** Realistic apparatus rendering of the existing small-angle model; no change to period or saved results. */
export function PendulumScene({
  length,
  amplitude,
  mass,
  cycles,
  phase,
  elapsed,
  id,
  series = "amplitude",
}: {
  length: number;
  amplitude: number;
  mass: number;
  cycles: number;
  phase: number;
  elapsed: number;
  id: string;
  series?: string;
}) {
  const g = pendulumGeometry(length, amplitude, cycles, phase),
    { x: px, y: py } = g.pivot,
    br = PENDULUM_BOB_RADIUS;
  const bob = { x: q(g.bob.x), y: q(g.bob.y) },
    end = { x: q(g.attachment.x), y: q(g.attachment.y) };
  return (
    <g data-instrument="pendulum-installation" data-series={series}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#526b75" />
          <stop offset=".3" stopColor="#e7f0f2" />
          <stop offset=".6" stopColor="#b2c3c9" />
          <stop offset="1" stopColor="#566f79" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7b488" />
          <stop offset="1" stopColor="#ad7f4e" />
        </linearGradient>
        <radialGradient id={`${id}-pendulum-bob`} cx="29%" cy="24%" r="76%">
          <stop offset="0" stopColor="#f6fbfe" />
          <stop offset=".35" stopColor="#b9cbd5" />
          <stop offset=".7" stopColor="#7d98a6" />
          <stop offset="1" stopColor="#3d5866" />
        </radialGradient>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#586c62" />
          <stop offset=".55" stopColor="#2c4539" />
          <stop offset="1" stopColor="#1a3026" />
        </linearGradient>
        <linearGradient id={`${id}-lcd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0ebcf" />
          <stop offset="1" stopColor="#bbcea9" />
        </linearGradient>
      </defs>
      <text x="25" y="24" style={{ fontSize: 12, fontWeight: 600 }}>
        Коливання нитяного маятника
      </text>
      <text x="25" y="43" style={{ fontSize: 10 }}>
        {seriesNames[series] ?? "Одна серія — одна змінна"}
      </text>
      <text x="575" y="24" textAnchor="end" style={{ fontSize: 10 }}>
        Відтворення 1× · малі кути
      </text>

      {/* Level bench and a metal laboratory stand with a fixed suspension point. */}
      <path d="M33 383H564L575 393H24Z" fill="#e2c59e" />
      <rect
        x="24"
        y="389"
        width="552"
        height="13"
        rx="3"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M38 402H562V418H38Z M53 418H73V427H53Z M526 418H546V427H526Z"
        fill="#8d6949"
      />
      <line x1="39" x2="561" y1="403" y2="403" stroke="#d3ac7d" />
      <ellipse cx="109" cy="384" rx="57" ry="5" fill="#2e4436" opacity=".14" />
      <path d="M55 370H159L165 383H49Z" fill="#50665e" stroke="#344b41" />
      <path d="M59 373H155L158 377H55Z" fill="#899d90" />
      <rect
        x="102"
        y="60"
        width="9"
        height="312"
        rx="4.5"
        fill={`url(#${id}-steel)`}
        stroke="#637c80"
        strokeWidth=".7"
      />
      <rect x="97" y="361" width="20" height="14" rx="3" fill="#617a6a" />
      <rect
        x="105"
        y="64"
        width="172"
        height="8"
        rx="3"
        fill={`url(#${id}-steel)`}
        stroke="#6d8586"
        strokeWidth=".6"
      />
      <rect x="97" y="58" width="23" height="20" rx="4" fill="#3b5c48" />
      <line x1="85" x2="100" y1="68" y2="68" stroke="#789182" strokeWidth="4" />
      <circle cx="84" cy="68" r="5" fill="#657e6c" stroke="#3e5a48" />
      <path
        d={`M${px - 9} 72H${px + 9}V83H${px - 9}Z`}
        fill="#5a7665"
        stroke="#3c5748"
      />
      <path d={`M${px} 81V${py}`} stroke="#c3cfd0" strokeWidth="3" />
      <circle cx={px} cy={py} r="3.3" fill="#526e5d" stroke="#dce5d7" />

      {/* The metre ruler retains a fixed scale; l ends at the centre in equilibrium. */}
      <rect
        x="351"
        y={py}
        width="27"
        height={PENDULUM_SCALE}
        rx="2"
        fill="#fbf1d4"
        stroke="#bbad87"
      />
      {Array.from({ length: 21 }, (_, i) => (
        <g key={i}>
          <line
            x1="352"
            x2={i % 5 === 0 ? 363 : 358}
            y1={py + (i * PENDULUM_SCALE) / 20}
            y2={py + (i * PENDULUM_SCALE) / 20}
            stroke="#99896b"
            strokeWidth=".65"
          />
          {i % 5 === 0 && (
            <text
              x="374"
              y={py + (i * PENDULUM_SCALE) / 20 + 3}
              textAnchor="end"
              style={{ fontSize: 7, fill: "#736650" }}
            >
              {i * 5}
            </text>
          )}
        </g>
      ))}
      <text x="365" y="337" textAnchor="middle" style={{ fontSize: 8.5 }}>
        см
      </text>
      <line
        x1={px}
        x2={px}
        y1={py}
        y2={g.equilibrium.y + 19}
        stroke="#a8b8a2"
        strokeDasharray="4 4"
        strokeWidth=".8"
      />
      <line
        data-instrument="pendulum-length"
        x1="181"
        x2="181"
        y1={py}
        y2={g.equilibrium.y}
        stroke="#92a582"
        strokeWidth="1"
      />
      <path d={`M176 ${py}H187 M176 ${g.equilibrium.y}H187`} stroke="#7f9770" />
      <path
        d={`M187 ${g.equilibrium.y}H350`}
        stroke="#a7b99a"
        strokeWidth=".7"
        strokeDasharray="3 4"
      />
      <path
        data-instrument="pendulum-ruler-marker"
        d={`M343 ${g.equilibrium.y - 4}l7 4-7 4Z`}
        fill="#718e5e"
      />
      <text
        x="169"
        y={py + g.displayLength / 2 + 4}
        textAnchor="end"
        style={{ fontSize: 11 }}
      >
        l
      </text>
      <circle cx={px} cy={g.equilibrium.y} r="2.5" fill="#8da17c" />

      {/* A small protractor and true-scale swing arc. */}
      <path
        d={`M${px - 25} ${py + 37}Q${px} ${py + 50} ${px + 25} ${py + 37}`}
        fill="none"
        stroke="#bac6ad"
        strokeWidth="1"
      />
      {[-15, -10, -5, 0, 5, 10, 15].map((degrees) => {
        const a = (degrees * Math.PI) / 180;
        return (
          <line
            key={degrees}
            x1={q(px + 39 * Math.sin(a))}
            y1={q(py + 39 * Math.cos(a))}
            x2={q(px + 44 * Math.sin(a))}
            y2={q(py + 44 * Math.cos(a))}
            stroke="#9eaf90"
            strokeWidth=".8"
          />
        );
      })}
      <path
        data-instrument="pendulum-trajectory"
        d={`M${q(g.left.x)} ${q(g.left.y)}A${g.displayLength} ${g.displayLength} 0 0 0 ${q(g.right.x)} ${q(g.right.y)}`}
        fill="none"
        stroke="#b7c7a1"
        strokeWidth="2.5"
      />
      {[g.left, g.right].map((p, i) => (
        <circle
          key={i}
          cx={q(p.x)}
          cy={q(p.y)}
          r={br}
          fill="none"
          stroke="#a6b794"
          strokeWidth=".7"
          strokeDasharray="2 3"
          opacity=".6"
        />
      ))}

      {/* The cord meets the eyelet on the bob, while l is measured to the bob centre. */}
      <line
        x1={px + 1}
        y1={py + 1}
        x2={end.x + 1}
        y2={end.y + 1}
        stroke="#314b3c"
        opacity=".12"
        strokeWidth="2"
      />
      <line
        data-instrument="pendulum-string"
        x1={px}
        y1={py}
        x2={end.x}
        y2={end.y}
        stroke="#a88f61"
        strokeWidth="1.7"
      />
      <line
        x1={px}
        y1={py}
        x2={end.x}
        y2={end.y}
        stroke="#e6d9b9"
        strokeWidth=".55"
        strokeDasharray="1 2"
      />
      <ellipse
        cx={bob.x + 3}
        cy="381"
        rx="13"
        ry="2.8"
        fill="#3b5140"
        opacity=".12"
      />
      <circle
        data-instrument="pendulum-bob"
        cx={bob.x}
        cy={bob.y}
        r={br}
        fill={`url(#${id}-pendulum-bob)`}
        stroke="#486571"
        strokeWidth=".8"
      />
      <ellipse
        cx={bob.x - 3}
        cy={bob.y - 4}
        rx="3.3"
        ry="1.6"
        fill="#f5fafc"
        opacity=".6"
      />
      <circle
        cx={end.x}
        cy={end.y}
        r="2"
        fill="#e4ebeb"
        stroke="#66808b"
        strokeWidth=".7"
      />
      <circle cx={end.x} cy={end.y} r=".75" fill="#6d7c70" />

      {/* Matched replacement bobs in the mass series, not a change of period or length. */}
      {series === "mass" && (
        <g data-instrument="pendulum-mass-tray">
          <rect
            x="166"
            y="364"
            width="223"
            height="17"
            rx="3"
            fill="#b4c3ad"
            stroke="#899e7e"
          />
          {[50, 100, 150, 200, 250].map((grams, i) => (
            <g
              key={grams}
              opacity={Math.abs(mass * 1000 - grams) < 0.01 ? 0.4 : 1}
            >
              <circle
                cx={184 + i * 44}
                cy="360"
                r="7"
                fill={`url(#${id}-pendulum-bob)`}
                stroke="#647c85"
                strokeWidth=".6"
              />
              <text
                x={184 + i * 44}
                y="378"
                textAnchor="middle"
                style={{ fontSize: 7.5 }}
              >
                {grams} г
              </text>
            </g>
          ))}
        </g>
      )}
      <text x="52" y="413" style={{ fontSize: 10, fill: "#f3e4c9" }}>
        l = {fmt(length)} м
      </text>
      <text x="192" y="413" style={{ fontSize: 10, fill: "#f3e4c9" }}>
        A = {fmt(amplitude * 100)} см
      </text>
      <text x="358" y="413" style={{ fontSize: 10, fill: "#f3e4c9" }}>
        m = {fmt(mass * 1000)} г
      </text>

      {/* Digital instrument with a zero-based complete-cycle count. */}
      <rect
        x="443"
        y="105"
        width="133"
        height="270"
        rx="15"
        fill="#233d2d"
        opacity=".14"
      />
      <rect
        x="439"
        y="97"
        width="133"
        height="270"
        rx="15"
        fill={`url(#${id}-case)`}
        stroke="#2b4434"
      />
      <path
        d="M449 111Q452 103 466 103H549"
        fill="none"
        stroke="#8da28c"
        strokeWidth="1"
        opacity=".7"
      />
      {[
        [450, 110],
        [561, 110],
        [450, 353],
        [561, 353],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="2.4" fill="#6c826d" />
          <path d={`M${x - 1.4} ${y}h2.8`} stroke="#293f2e" strokeWidth=".6" />
        </g>
      ))}
      <text
        x="505.5"
        y="124"
        textAnchor="middle"
        style={{ fontSize: 8.5, fill: "#d5e0c9", letterSpacing: 0.8 }}
      >
        ВІДЛІК КОЛИВАНЬ
      </text>
      <rect x="449" y="139" width="113" height="63" rx="6" fill="#172f21" />
      <rect
        x="452"
        y="142"
        width="107"
        height="57"
        rx="4"
        fill={`url(#${id}-lcd)`}
      />
      <path d="M456 146H554V156L456 177Z" fill="#f6fae9" opacity=".2" />
      <text x="460" y="157" style={{ fontSize: 7.5, fill: "#57724b" }}>
        ЧАС МОДЕЛІ
      </text>
      <text
        data-instrument="pendulum-time"
        x="460"
        y="184"
        style={{
          fontSize: 20,
          fontWeight: 650,
          fontFamily: "monospace",
          fill: "#27412d",
        }}
      >
        {elapsed.toFixed(2).replace(".", ",")} с
      </text>
      <text
        x="505.5"
        y="228"
        textAnchor="middle"
        style={{ fontSize: 8.3, fill: "#d5e0c9" }}
      >
        ПОВНИХ КОЛИВАНЬ
      </text>
      <rect x="449" y="242" width="113" height="57" rx="6" fill="#172f21" />
      <rect
        x="452"
        y="245"
        width="107"
        height="51"
        rx="4"
        fill={`url(#${id}-lcd)`}
      />
      <text
        data-instrument="pendulum-count"
        x="505.5"
        y="278"
        textAnchor="middle"
        style={{
          fontSize: 22,
          fontWeight: 650,
          fontFamily: "monospace",
          fill: "#27412d",
        }}
      >
        {g.completed} / {cycles}
      </text>
      <circle cx="457" cy="320" r="2.8" fill="#b4cf94" />
      <text x="466" y="323" style={{ fontSize: 8.7, fill: "#d2dfc6" }}>
        {g.fraction === 1
          ? "Відлік завершено"
          : g.fraction === 0
            ? "Відпустіть зі спокою"
            : "Туди й назад = 1 цикл"}
      </text>
      <text
        x="505.5"
        y="344"
        textAnchor="middle"
        style={{ fontSize: 8.5, fill: "#b8c9a9" }}
      >
        Початок відліку — 0
      </text>

      {/* Separate coordinate display: the apparatus itself has no hidden angular magnification. */}
      <rect
        x="28"
        y="436"
        width="544"
        height="60"
        rx="9"
        fill="#fffef9"
        stroke="#d5dfca"
      />
      <text x="44" y="451" style={{ fontSize: 10 }}>
        Дугова координата · шкала збільшена
      </text>
      <line x1="70" x2="430" y1="468" y2="468" stroke="#b2bea2" />
      <line
        data-instrument="pendulum-amplitude"
        x1={q(g.amplitudeLeft)}
        x2={q(g.amplitudeRight)}
        y1="468"
        y2="468"
        stroke="#d9e0c2"
        strokeWidth="7"
      />
      {Array.from({ length: 13 }, (_, i) => i - 6).map((n) => (
        <g key={n}>
          <line
            x1={px + n * 30}
            x2={px + n * 30}
            y1="464"
            y2="473"
            stroke="#9dad89"
            strokeWidth=".8"
          />
          {n % 3 === 0 && (
            <text
              x={px + n * 30}
              y="488"
              textAnchor="middle"
              style={{ fontSize: 9 }}
            >
              {n}
            </text>
          )}
        </g>
      ))}
      <circle
        data-instrument="pendulum-coordinate"
        cx={q(g.coordinateX)}
        cy="468"
        r="4.5"
        fill="#4d7353"
        stroke="#fff"
        strokeWidth=".7"
      />
      <text x="498" y="475" style={{ fontSize: 11 }}>
        s, см
      </text>
    </g>
  );
}
