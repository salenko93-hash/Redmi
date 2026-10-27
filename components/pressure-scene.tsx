import {
  pressureGeometry,
  pressureObservation,
  pressureCoordinate as q,
  PRESSURE_BASE,
} from "@/lib/pressure-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import {
  PressureBlock,
  PressureDefinitions,
  PressureRuler,
} from "./pressure-equipment";
const fmt = (v: string | number) => String(v).replace(".", ",");
export function PressureScene({
  experiment,
  parameters: p,
  result: r,
  phase,
  id,
}: {
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  id: string;
}) {
  const area = experiment === "area";
  const face = area ? p.face : 0;
  const g = pressureGeometry(p.l, p.d, p.h, face);
  const loads = area ? 0 : p.loads;
  const cursor = pressureObservation(g.a, g.b, phase);
  const ready = phase === 1;
  return (
    <g
      data-instrument="pressure-installation"
      data-observation={ready ? "complete" : phase > 0 ? "observing" : "ready"}
    >
      <PressureDefinitions id={id} />
      <defs>
        <marker
          id={`${id}-arrow`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0L6 3L0 6Z" fill="#ac884a" />
        </marker>
      </defs>
      <text x="25" y="29" style={{ fontWeight: 650 }}>
        {area
          ? "Повертаємо брусок · сила стала"
          : "Додаємо тягарці · площа стала"}
      </text>
      <text x="25" y="52" style={{ fontSize: 12 }}>
        Брусок 200 г
        {loads ? ` + ${loads} × 100 г` : " · без додаткових тягарців"}
      </text>
      <g data-instrument="pressure-bench">
        <path
          d="M34 297L74 227H311L271 297Z"
          fill="#d5bf9c"
          stroke="#b79c72"
          strokeWidth=".8"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M${48 + i * 19} 291l34-58`}
            stroke="#ad8d5e"
            strokeWidth=".6"
            opacity=".25"
          />
        ))}
        <path
          d="M34 297H271V310H34Z"
          fill={`url(#${id}-wood)`}
          stroke="#b2966a"
          strokeWidth=".7"
        />
        <path d="M271 297l40-70v13l-40 70Z" fill="#a5875b" />
        <path d="M48 310H65V340H48Z M245 310H262V340H245Z" fill="#9c7d55" />
      </g>
      <PressureBlock
        id={id}
        geometry={g}
        x={100}
        base={PRESSURE_BASE}
        loads={loads}
        face={face}
      />
      <g transform="translate(100 315)">
        <PressureRuler id={id} length={12} />
      </g>
      <path
        d={`M100 ${PRESSURE_BASE + 1}V315M${q(100 + g.width)} ${PRESSURE_BASE + 1}V315`}
        stroke="#8a966e"
        strokeWidth=".8"
        strokeDasharray="3 2"
      />
      <text x="100" y="358" style={{ fontSize: 11 }}>
        Лінійка: 0–12 см · поділка 1 мм
      </text>
      <rect
        x="350"
        y="82"
        width="225"
        height="278"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="369" y="110" style={{ fontSize: 12, fontWeight: 650 }}>
        СИЛА НА ОПОРУ
      </text>
      <text
        data-instrument="pressure-force-reading"
        x="369"
        y="148"
        style={{ fontSize: 27, fontWeight: 650 }}
      >
        {ready ? `${fmt(r.readings.F)} Н` : "—"}
      </text>
      <text x="369" y="177" style={{ fontSize: 12 }}>
        F = mзаг · g, g ≈ 10 Н/кг
      </text>
      <text x="369" y="200" style={{ fontSize: 11 }}>
        За масою · не показ динамометра
      </text>
      <line
        data-instrument="pressure-force"
        x1="535"
        x2="535"
        y1="220"
        y2={220 + r.values.F * 8}
        stroke="#ac884a"
        strokeWidth="2"
        markerEnd={`url(#${id}-arrow)`}
      />
      {area ? (
        <>
          <text x="369" y="242" style={{ fontSize: 13 }}>
            Повернуто на грань
          </text>
          <text x="369" y="268" style={{ fontSize: 16, fontWeight: 650 }}>
            {["l × d", "l × h", "d × h"][face]}
          </text>
          <text x="369" y="308" style={{ fontSize: 12 }}>
            Той самий брусок і та сама маса
          </text>
        </>
      ) : (
        <>
          <text x="369" y="242" style={{ fontSize: 13 }}>
            Опорна площа · l × d
          </text>
          <text
            data-instrument="pressure-area-reading"
            x="369"
            y="271"
            style={{ fontSize: 21, fontWeight: 650 }}
          >
            {fmt(r.readings.S)} м²
          </text>
          <text x="369" y="308" style={{ fontSize: 12 }}>
            З урахуванням маси бруска
          </text>
        </>
      )}
      <text x="369" y="337" style={{ fontSize: 11 }}>
        Тиск у Па обчисли самостійно
      </text>
      <rect
        x="25"
        y="385"
        width="550"
        height="207"
        rx="14"
        fill="#fffdf6"
        stroke="#e1ddc8"
      />
      <text x="45" y="410" style={{ fontSize: 13, fontWeight: 650 }}>
        ОПОРНА ГРАНЬ · ВИГЛЯД ЗГОРИ
      </text>
      <rect
        data-instrument="pressure-footprint"
        x="95"
        y="445"
        width={g.width}
        height={g.depth}
        fill="#e2c68e"
        stroke="#ae8949"
        strokeWidth="1.5"
      />
      {Array.from({ length: Math.floor(g.depth / 8) }, (_, i) => (
        <path
          key={i}
          d={`M96 ${450 + i * 8}h${g.width - 2}`}
          stroke="#b29058"
          strokeWidth=".5"
          opacity=".5"
        />
      ))}
      <g transform="translate(95 530)">
        <PressureRuler id={id} length={12} />
      </g>
      <g transform="translate(64 445)">
        <PressureRuler id={id} length={5} vertical />
      </g>
      <path
        d={`M95 445V530M${q(95 + g.width)} 445V530M64 445H95M64 ${q(445 + g.depth)}H${q(95 + g.width)}`}
        stroke="#aab190"
        strokeWidth=".7"
        strokeDasharray="3 3"
        fill="none"
      />
      {phase > 0 && (
        <g
          data-instrument="pressure-cursors"
          stroke="#547357"
          strokeWidth="1.5"
        >
          <line
            data-instrument="pressure-ruler-pointer-a"
            x1={95 + cursor.x}
            x2={95 + cursor.x}
            y1="438"
            y2="539"
          />
          <line
            data-instrument="pressure-ruler-pointer-b"
            x1="55"
            x2={103 + g.width}
            y1={445 + cursor.y}
            y2={445 + cursor.y}
          />
        </g>
      )}
      <text x="95" y="575" style={{ fontSize: 11 }}>
        Шкали у см · в таблицю внеси метри
      </text>
      <text x="310" y="458" style={{ fontSize: 17 }}>
        a = {fmt(r.values.a)} м
      </text>
      <text x="310" y="489" style={{ fontSize: 17 }}>
        b = {fmt(r.values.b)} м
      </text>
      <text x="310" y="526" style={{ fontSize: 12 }}>
        {area
          ? "S = a · b — знайди площу"
          : "Найбільша грань залишається тією ж"}
      </text>
      <text x="310" y="550" style={{ fontSize: 11 }}>
        Розміри — у спільному масштабі
      </text>
      <text x="300" y="611" textAnchor="middle" style={{ fontSize: 11 }}>
        Брусок нерухомий · рухаються лише вказівники відліку
      </text>
      <text x="300" y="627" textAnchor="middle" style={{ fontSize: 10 }}>
        Повний контакт плоских граней · деформація й місцевий тиск не показані
      </text>
    </g>
  );
}
