import {
  ELASTIC_ANCHOR as top,
  ELASTIC_PX_PER_CM as scale,
  elasticGeometry,
} from "@/lib/elastic-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
const fmt = (v: number | string) => String(v).replace(".", ",");
export function ElasticScene({
  parameters: p,
  result: r,
  phase,
}: {
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
}) {
  const { restEnd, end, length } = elasticGeometry(
    p.initial,
    r.values.x,
    phase,
  );
  const ready = phase === 1;
  const zigzag = Array.from(
    { length: 20 },
    (_, i) =>
      `${285 + (i % 2 ? -11 : 11)},${top + 8 + (i * (length - 16)) / 19}`,
  ).join(" ");
  return (
    <g>
      <text x="26" y="24">
        {p.material === 0 ? "Гумовий шнур" : "Ідеальна пружина"} · порівняй
        довжини
      </text>
      <path
        d="M42 391H112M76 391V40H285V52"
        fill="none"
        stroke="#8b9f91"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <line
        x1="175"
        x2="175"
        y1={top}
        y2={restEnd}
        stroke="#9bac9d"
        strokeWidth="5"
        strokeDasharray="5 4"
      />
      <path
        d={`M146 ${top}H158M152 ${top}V${restEnd}M146 ${restEnd}H158`}
        stroke="#93a181"
        fill="none"
      />
      <text x="140" y={(top + restEnd) / 2} textAnchor="end">
        l₀
      </text>
      <text
        x="175"
        y={restEnd + 22}
        textAnchor="middle"
        style={{ fontSize: 11 }}
      >
        Без вантажу
      </text>
      <line
        x1="170"
        x2="347"
        y1={restEnd}
        y2={restEnd}
        stroke="#b1bd9c"
        strokeDasharray="5 4"
      />
      {p.material === 0 ? (
        <line
          data-instrument="elastic-element"
          x1="285"
          x2="285"
          y1={top}
          y2={end}
          stroke="#42745b"
          strokeWidth="7"
          strokeLinecap="round"
        />
      ) : (
        <polyline
          data-instrument="elastic-element"
          points={`285,${top} ${zigzag} 285,${end}`}
          stroke="#688b91"
          strokeWidth="3"
          fill="none"
        />
      )}
      <line
        data-instrument="elastic-length"
        x1="349"
        x2="349"
        y1={top}
        y2={end}
        stroke="#6e8b77"
        strokeWidth="2"
      />
      <path d={`M343 ${top}H355M343 ${end}H355`} stroke="#6e8b77" fill="none" />
      <text x="360" y={(top + end) / 2}>
        l
      </text>
      {end > restEnd + 0.1 && (
        <g>
          <line
            data-instrument="elastic-extension"
            x1="329"
            x2="329"
            y1={restEnd}
            y2={end}
            stroke="#b68a42"
            strokeWidth="2"
          />
          <path
            d={`M323 ${restEnd}H335M323 ${end}H335`}
            fill="none"
            stroke="#b68a42"
          />
          <text
            x="319"
            y={(restEnd + end) / 2 + 4}
            textAnchor="end"
            fill="#906725"
          >
            x
          </text>
        </g>
      )}
      {p.mass > 0 && (
        <line
          x1="285"
          x2="285"
          y1={end}
          y2={end + 5}
          stroke="#8b7c57"
          strokeWidth="2"
        />
      )}
      {Array.from({ length: p.mass / 100 }, (_, i) => (
        <g key={i} data-instrument="elastic-load">
          <rect
            x="263"
            y={end + 5 + i * 16}
            width="44"
            height="15"
            rx="3"
            fill="#c0ad80"
            stroke="#8b7c57"
          />
          <text
            x="285"
            y={end + 16 + i * 16}
            textAnchor="middle"
            style={{ fontSize: 9 }}
          >
            100 г
          </text>
        </g>
      ))}
      <g data-instrument="elastic-ruler">
        <line
          x1="401"
          x2="401"
          y1={top}
          y2={top + 45 * scale}
          stroke="#8da17b"
        />
        {Array.from({ length: 46 }, (_, i) => (
          <g key={i}>
            <line
              x1={i % 5 ? 401 : 395}
              x2="410"
              y1={top + i * scale}
              y2={top + i * scale}
              stroke="#8da17b"
            />
            {i % 5 === 0 && (
              <text x="418" y={top + i * scale + 4} style={{ fontSize: 10 }}>
                {i}
              </text>
            )}
          </g>
        ))}
        <text x="418" y="40" style={{ fontSize: 11 }}>
          см
        </text>
      </g>
      <rect
        x="462"
        y="57"
        width="117"
        height="262"
        rx="12"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="476" y="84">
        Маса
      </text>
      <text x="476" y="108" style={{ fontSize: 18, fontWeight: 650 }}>
        {fmt(p.mass)} г
      </text>
      <text x="476" y="146">
        l₀
      </text>
      <text data-instrument="elastic-initial-reading" x="476" y="169">
        {fmt(r.readings.l0)} см
      </text>
      <text x="476" y="207">
        l
      </text>
      <text data-instrument="elastic-length-reading" x="476" y="230">
        {ready ? `${fmt(r.readings.l)} см` : "—"}
      </text>
      <text x="476" y="267">
        F ≈ mg
      </text>
      <text data-instrument="elastic-force-reading" x="476" y="290">
        {ready ? `${fmt(r.readings.F)} Н` : "—"}
      </text>
      <text x="300" y="417" textAnchor="middle" style={{ fontSize: 11 }}>
        {ready
          ? p.mass === 0
            ? "Вантаж знято · порівняй l з l₀"
            : "Статична рівновага · зніми кінцеві покази"
          : "Запусти дослід, щоб зняти покази"}
      </text>
    </g>
  );
}
