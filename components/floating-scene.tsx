import {
  FLOATING_FLOOR as floor,
  FLOATING_FORCE_ORIGIN as forceOrigin,
  FLOATING_CUP_RADIUS,
  FLOATING_PIXEL_VOLUME,
  floatingGeometry,
  floatingCoordinate as q,
} from "@/lib/floating-view";
import type { Parameters, SimulationResult } from "@/lib/simulation";
import { FloatingDefinitions, FloatingTube } from "./floating-equipment";
export function FloatingScene({
  parameters: p,
  result: r,
  phase,
  id,
}: {
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  id: string;
}) {
  const v = r.values,
    g = floatingGeometry(p.volume, v.fraction, v.state, phase);
  const buoyancy = (p.liquid === 0 ? 1 : 1.03) * p.volume * 0.01 * g.immersed;
  const support = g.onBottom ? Math.max(0, v.weight - buoyancy) : 0;
  const state =
    v.state > 0
      ? g.onBottom
        ? "На дні · у спокої"
        : "Тоне · рух до дна"
      : v.state === 0
        ? "Нейтральна плавучість"
        : phase === 1
          ? "На поверхні · рівновага"
          : "Спливає до поверхні";
  return (
    <g data-instrument="floating-installation">
      <FloatingDefinitions id={id} />
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
          <path d="M0 0L6 3L0 6Z" fill="context-stroke" />
        </marker>
      </defs>
      <text x="25" y="28" style={{ fontWeight: 650 }}>
        {p.liquid === 0
          ? "Вода · основний дослід"
          : "Солона вода · додатковий дослід"}
      </text>
      <text x="25" y="51" style={{ fontSize: 12 }}>
        Корок закритий · зовнішній об’єм сталий
      </text>
      <path d="M50 408H291l16 19H34Z" fill="#ddc5a1" />
      <rect
        x="34"
        y="426"
        width="273"
        height="10"
        rx="2"
        fill={`url(#${id}-wood)`}
      />
      <path
        d="M47 436H294V446H47Z M60 446H76V461H60Z M263 446H279V461H263Z"
        fill="#9d7a50"
      />
      <ellipse
        cx="175"
        cy="405"
        rx="87"
        ry="6"
        fill="#b7cdca"
        fillOpacity=".35"
        stroke="#93b0ae"
      />
      <path
        d={`M91 110V${floor}Q175 ${floor + 18} 259 ${floor}V110`}
        fill={`url(#${id}-glass)`}
        stroke="#8caaa9"
        strokeWidth="1.4"
      />
      <ellipse
        cx="175"
        cy="110"
        rx="84"
        ry="8"
        fill="#e7f4ed"
        fillOpacity=".3"
        stroke="#98b2af"
      />
      <path
        d={`M95 ${q(g.surface)}V${floor - 3}Q175 ${floor + 10} 255 ${floor - 3}V${q(g.surface)}Z`}
        fill={`url(#${id}-water)`}
      />
      <ellipse
        cx="175"
        cy={q(g.surface)}
        rx="80"
        ry="5"
        fill="#b8dedf"
        opacity=".8"
        stroke="#81abb1"
        strokeWidth=".8"
      />
      <rect
        data-instrument="floating-water"
        x="95"
        y={q(g.surface)}
        width="160"
        height={q(floor - g.surface)}
        fill="none"
      />
      <FloatingTube
        id={id}
        top={g.top}
        radius={g.radius}
        height={g.height}
        volume={p.volume}
        sand={p.sand}
      />
      <rect
        x="95"
        y={q(g.surface)}
        width="160"
        height={q(floor - g.surface)}
        fill="#7cb9c7"
        opacity=".12"
        pointerEvents="none"
      />
      <path
        d={`M92 112V${floor}Q175 ${floor + 17} 258 ${floor}V112`}
        fill="none"
        stroke="#83a7a6"
        strokeWidth="2"
      />
      <path d="M98 121V378" stroke="#fff" strokeWidth="3" opacity=".65" />
      <path d="M251 122V377" stroke="#edf6ed" strokeWidth="1.4" opacity=".8" />
      <path
        d="M91 110Q175 126 259 110"
        fill="none"
        stroke="#8daead"
        strokeWidth="1.2"
      />
      {Array.from({ length: 26 }, (_, i) => {
        const y =
          floor -
          (i * 100 * FLOATING_PIXEL_VOLUME) /
            (Math.PI * FLOATING_CUP_RADIUS ** 2);
        return (
          <g key={i}>
            <line
              x1="101"
              x2={i % 5 === 0 ? 116 : 110}
              y1={q(y)}
              y2={q(y)}
              stroke="#6d9290"
              strokeWidth=".6"
            />
            {i % 5 === 0 && (
              <text x="120" y={q(y + 3)} style={{ fontSize: 7 }}>
                {i * 100}
              </text>
            )}
          </g>
        );
      })}
      <text x="111" y="101" style={{ fontSize: 9 }}>
        мл
      </text>
      {g.onBottom && (
        <ellipse
          data-instrument="floating-contact"
          cx="175"
          cy={floor + 2}
          rx="8"
          ry="1.5"
          fill="#5c7961"
        />
      )}
      <rect
        x="349"
        y="70"
        width="227"
        height="404"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text x="368" y="98" style={{ fontSize: 13, fontWeight: 650 }}>
        ЗАКРИТА СИСТЕМА
      </text>
      <text
        data-instrument="floating-mass-reading"
        x="368"
        y="130"
        style={{ fontSize: 21, fontWeight: 650 }}
      >
        m = {r.readings.m} г
      </text>
      <text
        data-instrument="floating-volume-reading"
        x="368"
        y="161"
        style={{ fontSize: 17 }}
      >
        V = {r.readings.V} см³
      </text>
      <text x="368" y="189" style={{ fontSize: 12 }}>
        ρрідини = {p.liquid === 0 ? "1" : "1,03"} г/см³
      </text>
      <text x="368" y="215" style={{ fontSize: 11 }}>
        20 г — пробірка з корком
      </text>
      <line x1="368" x2="557" y1="236" y2="236" stroke="#dbe5d2" />
      <text x="368" y="262" style={{ fontSize: 12 }}>
        Сили · спільний масштаб
      </text>
      <rect
        x="400"
        y={forceOrigin - 15}
        width="110"
        height="30"
        rx="8"
        fill="#f1f4e7"
      />
      {[
        {
          key: "gravity",
          x: 455,
          end: forceOrigin + v.weight * 100,
          color: "#a8533c",
        },
        {
          key: "buoyancy",
          x: 420,
          end: forceOrigin - buoyancy * 100,
          color: "#297788",
        },
        ...(support > 1e-10
          ? [
              {
                key: "support",
                x: 490,
                end: forceOrigin - support * 100,
                color: "#84509b",
              },
            ]
          : []),
      ].map((f) => (
        <line
          key={f.key}
          data-floating-force={f.key}
          x1={f.x}
          x2={f.x}
          y1={forceOrigin}
          y2={q(f.end)}
          stroke={f.color}
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
      ))}
      <text
        x="468"
        y={q(forceOrigin + 15 + v.weight * 50)}
        style={{ fontSize: 13 }}
      >
        mg
      </text>
      <text
        x="408"
        y={q(forceOrigin - 5 - buoyancy * 50)}
        textAnchor="end"
        style={{ fontSize: 13 }}
      >
        FА
      </text>
      {support > 1e-10 && (
        <text
          x="502"
          y={q(forceOrigin - 5 - support * 50)}
          style={{ fontSize: 13 }}
        >
          N
        </text>
      )}
      <rect
        x="25"
        y="495"
        width="550"
        height="101"
        rx="14"
        fill="#fff"
        stroke="#dbe5d2"
      />
      <text
        data-instrument="floating-status"
        x="45"
        y="523"
        style={{ fontSize: 16, fontWeight: 650 }}
      >
        {state}
      </text>
      <text x="45" y="551" style={{ fontSize: 12 }}>
        {g.onBottom
          ? "Додалася реакція опори: FА + N = mg"
          : v.state === 0
            ? "Початково у спокої · зовнішніх опор немає"
            : v.state < 0 && phase === 1
              ? "FА = mg · занурена лише частина об’єму"
              : "Опору води не показано · рух схематичний"}
      </text>
      <text x="45" y="578" style={{ fontSize: 11 }}>
        Пісок всередині · вода не потрапляє у пробірку
      </text>
      <text x="300" y="620" textAnchor="middle" style={{ fontSize: 11 }}>
        Середню густину та числові сили обчисли самостійно
      </text>
      <text x="300" y="637" textAnchor="middle" style={{ fontSize: 10 }}>
        Вертикальну орієнтацію задано · стійкість і точний закон руху не
        моделюються
      </text>
    </g>
  );
}
