import {
  ELASTIC_ANCHOR as top,
  ELASTIC_PX_PER_CM as scale,
  elasticGeometry,
  elasticCoordinate as q,
} from "@/lib/elastic-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import {
  ElasticDefinitions,
  ElasticStand,
  ElasticElement,
  ElasticLoads,
} from "./elastic-equipment";
const fmt = (v: number | string) => String(v).replace(".", ",");
export function ElasticScene({
  parameters: p,
  result: r,
  phase,
  id,
  startExtension = 0,
}: {
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  id: string;
  startExtension?: number;
}) {
  const { restEnd, end, length } = elasticGeometry(
      p.initial,
      r.values.x,
      phase,
      startExtension,
    ),
    ready = phase === 1;
  const unloading = startExtension > r.values.x + 1e-9;
  return (
    <g
      data-instrument="elastic-installation"
      data-elastic-state={
        ready ? "equilibrium" : unloading ? "unloading" : "loading"
      }
    >
      <ElasticDefinitions id={id} />
      <text x="26" y="27" style={{ fontSize: 13, fontWeight: 650 }}>
        {p.material === 0
          ? "Пружні властивості гумового шнура"
          : "Розтягнення ідеальної пружини"}
      </text>
      <text x="26" y="47" style={{ fontSize: 10 }}>
        Ті самі точки відліку · гачок і тягарці не входять у довжину елемента
      </text>
      <ElasticStand id={id} />
      <path
        d={`M183 ${top}H306`}
        stroke="#a7b79b"
        strokeWidth=".7"
        strokeDasharray="3 3"
      />
      <ElasticElement
        id={id}
        material={p.material}
        initial={p.initial}
        length={restEnd - top}
        end={restEnd}
        axis={198}
        ghost
      />
      <path
        d={`M162 ${top}H174M168 ${top}V${q(restEnd)}M162 ${q(restEnd)}H174`}
        fill="none"
        stroke="#9aa98b"
        strokeWidth="1"
      />
      <text
        x="157"
        y={q((top + restEnd) / 2)}
        textAnchor="end"
        style={{ fontSize: 12 }}
      >
        l₀
      </text>
      <text
        x="198"
        y={q(restEnd + 22)}
        textAnchor="middle"
        style={{ fontSize: 9 }}
      >
        Початковий стан
      </text>
      <path
        d={`M198 ${q(restEnd)}H400`}
        stroke="#a8b89b"
        strokeDasharray="4 4"
        strokeWidth=".8"
      />
      <path d={`M397 ${q(restEnd - 3)}l5 3-5 3`} fill="#a6b49b" />
      <ElasticElement
        id={id}
        material={p.material}
        initial={p.initial}
        length={length}
        end={end}
      />
      <ElasticLoads id={id} end={end} mass={p.mass} />
      <line
        data-instrument="elastic-length"
        x1="367"
        x2="367"
        y1={top}
        y2={q(end)}
        stroke="#6b8971"
        strokeWidth="1.2"
      />
      <path
        d={`M362 ${top}H372M362 ${q(end)}H372`}
        stroke="#6b8971"
        fill="none"
      />
      <text x="377" y={q((top + end) / 2)} style={{ fontSize: 12 }}>
        l
      </text>
      {Math.abs(end - restEnd) > 0.1 && (
        <g>
          <line
            data-instrument="elastic-extension"
            x1="341"
            x2="341"
            y1={q(restEnd)}
            y2={q(end)}
            stroke="#ae8941"
            strokeWidth="1.6"
          />
          <path
            d={`M337 ${q(restEnd)}H345M337 ${q(end)}H345`}
            stroke="#ae8941"
            fill="none"
          />
          <text
            x="332"
            y={q((restEnd + end) / 2 + 3)}
            textAnchor="end"
            style={{ fontSize: 11, fill: "#987633" }}
          >
            x
          </text>
        </g>
      )}
      <g data-instrument="elastic-ruler">
        <rect
          x="401"
          y={top - 9}
          width="35"
          height={50 * scale + 18}
          rx="2"
          fill="#f4e9ca"
          stroke="#c4b98d"
          strokeWidth=".9"
        />
        <path
          d={`M434 ${top - 7}V${top + 50 * scale + 7}`}
          stroke="#fff7df"
          strokeWidth="1.2"
        />
        {Array.from({ length: 501 }, (_, i) => (
          <line
            key={i}
            x1="402"
            x2={
              i % 50 === 0 ? 418 : i % 10 === 0 ? 413 : i % 5 === 0 ? 409 : 406
            }
            y1={q(top + (i * scale) / 10)}
            y2={q(top + (i * scale) / 10)}
            stroke="#827b57"
            strokeWidth={i % 10 === 0 ? 0.7 : 0.35}
          />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text
            key={i}
            x="430"
            y={top + i * 5 * scale + 3}
            textAnchor="end"
            style={{ fontSize: 8, fill: "#6b6547" }}
          >
            {i * 5}
          </text>
        ))}
        <text x="418" y="87" textAnchor="middle" style={{ fontSize: 10 }}>
          см
        </text>
      </g>
      <path
        data-instrument="elastic-pointer"
        d={`M309 ${q(end)}H399l-5-3v6l5-3`}
        stroke="#a88942"
        strokeWidth="1.3"
        fill="#b89c54"
      />
      <circle
        data-instrument="elastic-anchor"
        cx="295"
        cy={top}
        r="2"
        fill="#b38f44"
      />
      <circle
        data-instrument="elastic-endpoint"
        cx="295"
        cy={q(end)}
        r="2.2"
        fill="#b38f44"
      />
      <rect
        x="462"
        y="128"
        width="117"
        height="255"
        rx="11"
        fill="#fffef7"
        stroke="#d9e3cf"
      />
      <text x="476" y="151" style={{ fontSize: 8.5, letterSpacing: 0.5 }}>
        КІНЦЕВІ ПОКАЗИ
      </text>
      <text x="476" y="180" style={{ fontSize: 10 }}>
        Навантаження
      </text>
      <text x="476" y="202" style={{ fontSize: 17, fontWeight: 650 }}>
        {fmt(p.mass)} г
      </text>
      <text x="476" y="232" style={{ fontSize: 10 }}>
        Початкова l₀
      </text>
      <text
        data-instrument="elastic-initial-reading"
        x="476"
        y="252"
        style={{ fontSize: 15, fontWeight: 600 }}
      >
        {fmt(r.readings.l0)} см
      </text>
      <text x="476" y="281" style={{ fontSize: 10 }}>
        Довжина l
      </text>
      <text
        data-instrument="elastic-length-reading"
        x="476"
        y="302"
        style={{ fontSize: 15, fontWeight: 600 }}
      >
        {ready ? `${fmt(r.readings.l)} см` : "—"}
      </text>
      <text x="476" y="332" style={{ fontSize: 10 }}>
        Сила за F ≈ mg
      </text>
      <text
        data-instrument="elastic-force-reading"
        x="476"
        y="353"
        style={{ fontSize: 15, fontWeight: 600 }}
      >
        {ready ? `${fmt(r.readings.F)} Н` : "—"}
      </text>
      <text x="300" y="582" textAnchor="middle" style={{ fontSize: 10 }}>
        {ready
          ? p.mass === 0
            ? "Вантаж знято · перевір повернення до l₀"
            : "Статична рівновага · зніми кінцеві покази"
          : unloading
            ? phase > 0
              ? "Повернення після зняття навантаження"
              : "Повернення після зняття навантаження · запусти дослід"
            : phase > 0
              ? "Перехід до статичної рівноваги · дочекайся кінцевих показів"
              : "Зміни навантаження й запусти дослід"}
      </text>
      <text x="300" y="600" textAnchor="middle" style={{ fontSize: 9.5 }}>
        Поділка лінійки 1 мм · x та F/x обчисли самостійно
      </text>
    </g>
  );
}
