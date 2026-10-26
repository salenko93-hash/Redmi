/** Exact drawing scale for length; a separate enlarged arc-coordinate scale. */
export function PendulumScene({
  length,
  amplitude,
  mass,
  cycles,
  phase,
  elapsed,
  id,
}: {
  length: number;
  amplitude: number;
  mass: number;
  cycles: number;
  phase: number;
  elapsed: number;
  id: string;
}) {
  const angle = (amplitude / length) * Math.cos(phase * cycles * 2 * Math.PI);
  const displayLength = length * 230;
  const x = 255 + displayLength * Math.sin(angle),
    y = 60 + displayLength * Math.cos(angle);
  const coordinate = amplitude * Math.cos(phase * cycles * 2 * Math.PI);
  const completed = Math.min(cycles, Math.floor(phase * cycles + 1e-8));
  const fmt = (v: number) => String(v).replace(".", ",");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-pendulum-bob`} cx="30%" cy="25%">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="1" stopColor="#b88f40" />
        </radialGradient>
      </defs>
      <text x="28" y="25">
        Нитяний маятник · малі кути
      </text>
      <path
        d="M65 330H145V40H280"
        fill="none"
        stroke="#8fa295"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M255 60V317" stroke="#b4c3a8" strokeDasharray="5 5" />
      <circle cx="255" cy="60" r="5" fill="#4e6d55" />
      <line
        data-instrument="pendulum-string"
        x1="255"
        y1="60"
        x2={x}
        y2={y}
        stroke="#526b57"
        strokeWidth="2"
      />
      <circle
        data-instrument="pendulum-bob"
        cx={x}
        cy={y}
        r="13"
        fill={`url(#${id}-pendulum-bob)`}
        stroke="#93743a"
        strokeWidth="2"
      />
      <line
        x1="185"
        x2="185"
        y1="60"
        y2={60 + displayLength}
        stroke="#98ad89"
      />
      <path d={`M180 60H190 M180 ${60 + displayLength}H190`} stroke="#98ad89" />
      <text x="175" y={60 + displayLength / 2} textAnchor="end">
        l
      </text>
      <text x="315" y="80">
        l = {fmt(length)} м
      </text>
      <text x="315" y="104">
        A = {fmt(amplitude)} м
      </text>
      <text x="315" y="128">
        m = {fmt(mass)} кг
      </text>
      <rect
        x="450"
        y="55"
        width="126"
        height="232"
        rx="14"
        fill="#fff"
        stroke="#dce5d2"
      />
      <text x="464" y="84">
        Час моделі
      </text>
      <text
        x="464"
        y="116"
        data-instrument="pendulum-time"
        style={{ fontSize: 22, fontWeight: 650 }}
      >
        {elapsed.toFixed(2).replace(".", ",")} с
      </text>
      <text x="464" y="164">
        Повних коливань
      </text>
      <text
        x="464"
        y="196"
        data-instrument="pendulum-count"
        style={{ fontSize: 22, fontWeight: 650 }}
      >
        {completed} / {cycles}
      </text>
      <text x="464" y="240">
        Туди й назад
      </text>
      <text x="464" y="263">
        1 повний цикл
      </text>
      <rect
        x="28"
        y="354"
        width="544"
        height="75"
        rx="10"
        fill="#fff"
        stroke="#dce5d2"
      />
      <text x="44" y="374">
        Відхилення вздовж дуги · збільшена шкала
      </text>
      <line x1="75" x2="435" y1="397" y2="397" stroke="#a7b99a" />
      <line
        data-instrument="pendulum-amplitude"
        x1={255 - amplitude * 3000}
        x2={255 + amplitude * 3000}
        y1="397"
        y2="397"
        stroke="#d5ddbd"
        strokeWidth="8"
      />
      {Array.from({ length: 13 }, (_, i) => i - 6).map((n) => (
        <g key={n}>
          <line
            x1={255 + n * 30}
            x2={255 + n * 30}
            y1="393"
            y2="402"
            stroke="#9bad8c"
          />
          {n % 3 === 0 && (
            <text
              x={255 + n * 30}
              y="419"
              textAnchor="middle"
              style={{ fontSize: 10 }}
            >
              {n}
            </text>
          )}
        </g>
      ))}
      <circle
        data-instrument="pendulum-coordinate"
        cx={255 + coordinate * 3000}
        cy="397"
        r="5"
        fill="#456c4f"
      />
      <text x="465" y="401" style={{ fontSize: 11 }}>
        s, см
      </text>
    </g>
  );
}
