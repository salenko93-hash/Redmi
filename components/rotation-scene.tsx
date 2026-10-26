/** A plan view of a prescribed circular trajectory, not a force model of a string. */
export function RotationScene({
  radius,
  cycles,
  phase,
  elapsed,
  id,
}: {
  radius: number;
  cycles: number;
  phase: number;
  elapsed: number;
  id: string;
}) {
  const r = radius * 400;
  const theta = phase * cycles * 2 * Math.PI;
  const x = 250 + r * Math.cos(theta),
    y = 184 + r * Math.sin(theta);
  const completed = Math.min(cycles, Math.floor(phase * cycles + 1e-8));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sphere`} cx="30%" cy="25%">
          <stop offset="0" stopColor="#fff2b3" />
          <stop offset="1" stopColor="#c59e48" />
        </radialGradient>
      </defs>
      <text x="28" y="28">
        Рух по колу · вигляд зверху
      </text>
      <rect
        x="450"
        y="65"
        width="126"
        height="225"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="465" y="94">
        Час моделі
      </text>
      <text
        x="465"
        y="126"
        style={{ fontSize: 22, fontWeight: 650 }}
        data-instrument="rotation-time"
      >
        {elapsed.toFixed(2).replace(".", ",")} с
      </text>
      <text x="465" y="170">
        Повних обертів
      </text>
      <text
        x="465"
        y="202"
        style={{ fontSize: 22, fontWeight: 650 }}
        data-instrument="rotation-count"
      >
        {completed} / {cycles}
      </text>
      <text x="465" y="247">
        Мітка → мітка
      </text>
      <text x="465" y="269">
        1 повний оберт
      </text>
      <circle
        data-instrument="orbit"
        cx="250"
        cy="184"
        r={r}
        fill="#e9efdc"
        stroke="#a4b894"
        strokeWidth="3"
      />
      <line
        x1="250"
        y1="184"
        x2={250 + r}
        y2="184"
        stroke="#98ad89"
        strokeDasharray="4 5"
      />
      <line x1="250" y1="184" x2={x} y2={y} stroke="#63825d" strokeWidth="2" />
      <circle cx="250" cy="184" r="5" fill="#597552" />
      <line
        x1={250 + r}
        y1="166"
        x2={250 + r}
        y2="202"
        stroke="#a27b36"
        strokeWidth="3"
      />
      <text x={250 + r + 13} y="165">
        Мітка 0
      </text>
      <circle
        data-instrument="rotating-ball"
        cx={x}
        cy={y}
        r="12"
        fill={`url(#${id}-sphere)`}
        stroke="#9a7b3b"
        strokeWidth="2"
      />
      <text x="250" y="333" textAnchor="middle">
        Радіус траєкторії: {String(radius).replace(".", ",")} м
      </text>
      <text x="250" y="352" textAnchor="middle" style={{ fontSize: 10 }}>
        Лінія від центра — геометричний радіус
      </text>
    </g>
  );
}
