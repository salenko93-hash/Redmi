"use client";
import type { Answers } from "@/lib/types";
export function ForceDiagram({
  value,
  onChange,
  readOnly = false,
}: {
  value: NonNullable<Answers["diagram"]>;
  onChange?: (v: NonNullable<Answers["diagram"]>) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="force-grid">
      {value.map((v, i) => (
        <div className="force-card" key={i}>
          <h4>{["Тіло тоне", "Усередині рідини", "На поверхні"][i]}</h4>
          <svg
            viewBox="0 0 200 220"
            role="img"
            aria-label={`Схема сил: ${v.state}`}
          >
            <defs>
              <marker
                id={"arrow" + i}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10z" fill="context-stroke" />
              </marker>
            </defs>
            <rect
              x="15"
              y="35"
              width="170"
              height="165"
              rx="8"
              fill="#e3f0f6"
            />
            <line x1="15" y1="45" x2="185" y2="45" stroke="#8cbac8" />
            <rect
              x="75"
              y={i === 2 ? 25 : 82}
              width="50"
              height="55"
              rx="12"
              fill="#d1c39d"
              stroke="#766b4a"
            />
            <circle cx="100" cy={i === 2 ? 52 : 110} r="3" fill="#324a40" />
            <line
              x1="100"
              y1={i === 2 ? 52 : 110}
              x2="100"
              y2={(i === 2 ? 52 : 110) + v.gravity * 24}
              stroke="#aa654f"
              strokeWidth="3"
              markerEnd={`url(#arrow${i})`}
            />
            <text
              x="110"
              y={(i === 2 ? 67 : 125) + v.gravity * 24}
              fontSize="12"
            >
              mg
            </text>
            <line
              x1="100"
              y1={i === 2 ? 52 : 110}
              x2="100"
              y2={(i === 2 ? 52 : 110) - v.buoyancy * 24}
              stroke="#397c86"
              strokeWidth="3"
              markerEnd={`url(#arrow${i})`}
            />
            <text
              x="110"
              y={(i === 2 ? 47 : 105) - v.buoyancy * 24}
              fontSize="12"
            >
              FА
            </text>
            {v.support > 0 && (
              <line
                x1="85"
                y1={i === 2 ? 52 : 110}
                x2="85"
                y2={(i === 2 ? 52 : 110) - v.support * 24}
                stroke="#9363a4"
                strokeWidth="3"
                markerEnd={`url(#arrow${i})`}
              />
            )}
          </svg>
          {(["gravity", "buoyancy", "support"] as const).map((k) => (
            <label key={k}>
              {
                {
                  gravity: "Сила тяжіння",
                  buoyancy: "Сила Архімеда",
                  support: "Реакція опори",
                }[k]
              }
              : {v[k]}
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={v[k]}
                disabled={readOnly}
                onChange={(e) =>
                  onChange?.(
                    value.map((item, j) =>
                      i === j ? { ...item, [k]: Number(e.target.value) } : item,
                    ),
                  )
                }
              />
            </label>
          ))}
          <label>
            Стан тіла
            <input
              value={v.state}
              disabled={readOnly}
              onChange={(e) =>
                onChange?.(
                  value.map((item, j) =>
                    i === j ? { ...item, state: e.target.value } : item,
                  ),
                )
              }
            />
          </label>
        </div>
      ))}
      <p className="muted">
        Довжини стрілок — у спільному умовному масштабі. У поясненні зазначте
        числові значення сил у ньютонах і обраний стан тіла. Це навчальна схема,
        точки прикладання показано спрощено.
      </p>
    </div>
  );
}
