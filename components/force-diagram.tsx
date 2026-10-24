"use client";
import { useId } from "react";
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
  const instance = useId().replace(/:/g, "");
  const names = {
    gravity: "Сила тяжіння",
    buoyancy: "Сила Архімеда",
    support: "Реакція опори",
  };
  return (
    <div className="force-grid">
      {value.map((v, i) => {
        const empty = v.gravity === 0 && v.buoyancy === 0 && v.support === 0;
        const bottom = i === 0 && v.support > 0,
          cy = bottom ? 230 : 165;
        const marker = `force-arrow-${instance}-${i}`;
        return (
          <section
            className="force-card"
            key={i}
            aria-label={
              [
                "Тіло тоне або лежить на дні",
                "Рівновага всередині рідини",
                "Рівновага на поверхні",
              ][i]
            }
          >
            <h4>{["Тоне / на дні", "Усередині рідини", "На поверхні"][i]}</h4>
            <svg
              viewBox="0 0 260 340"
              role="img"
              aria-label={
                empty
                  ? "Схему ще не побудовано"
                  : `Схема сил: ${v.state || "стан не зазначено"}`
              }
            >
              <defs>
                <marker
                  id={marker}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
                </marker>
              </defs>
              <rect
                x="20"
                y={i === 2 ? 150 : 60}
                width="220"
                height={i === 2 ? 110 : 200}
                rx="12"
                fill="#e3f0f6"
              />
              <line
                x1="20"
                x2="240"
                y1={i === 2 ? 150 : 60}
                y2={i === 2 ? 150 : 60}
                stroke="#8cbac8"
              />
              {bottom && (
                <line
                  x1="20"
                  x2="240"
                  y1="261"
                  y2="261"
                  stroke="#82927a"
                  strokeWidth="3"
                />
              )}
              <rect
                x="100"
                y={cy - 30}
                width="60"
                height="60"
                rx="12"
                fill="#d1c39d"
                stroke="#766b4a"
              />
              {v.gravity > 0 && (
                <g>
                  <line
                    data-force="gravity"
                    x1="130"
                    x2="130"
                    y1={cy}
                    y2={cy + v.gravity * 16}
                    stroke="#a8533c"
                    strokeWidth="3"
                    markerEnd={`url(#${marker})`}
                  />
                  <text x="143" y={cy + v.gravity * 8 + 16} fill="#8d4735">
                    mg
                  </text>
                </g>
              )}
              {v.buoyancy > 0 && (
                <g>
                  <line
                    data-force="buoyancy"
                    x1="110"
                    x2="110"
                    y1={cy}
                    y2={cy - v.buoyancy * 16}
                    stroke="#297788"
                    strokeWidth="3"
                    markerEnd={`url(#${marker})`}
                  />
                  <text x="65" y={cy - v.buoyancy * 8} fill="#286879">
                    Fₐ
                  </text>
                </g>
              )}
              {v.support > 0 && (
                <g>
                  <line
                    data-force="support"
                    x1="160"
                    x2="160"
                    y1={bottom ? 260 : cy}
                    y2={(bottom ? 260 : cy) - v.support * 16}
                    stroke="#84509b"
                    strokeWidth="3"
                    markerEnd={`url(#${marker})`}
                  />
                  <text
                    x="175"
                    y={(bottom ? 260 : cy) - v.support * 8}
                    fill="#714185"
                  >
                    N
                  </text>
                </g>
              )}
              {empty && (
                <text
                  x="130"
                  y="305"
                  textAnchor="middle"
                  className="force-placeholder"
                >
                  Схему ще не побудовано
                </text>
              )}
            </svg>
            <div className="force-fields">
              {(["gravity", "buoyancy", "support"] as const).map((k) => (
                <label key={k}>
                  {names[k]}: <strong>{v[k]} ум. од.</strong>
                  <input
                    aria-label={`${names[k]}, схема ${i + 1}`}
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={v[k]}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange?.(
                        value.map((a, j) =>
                          i === j ? { ...a, [k]: Number(e.target.value) } : a,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <label>
                Стан тіла
                <input
                  aria-label={`Стан тіла, схема ${i + 1}`}
                  placeholder="Рух / рівновага / опора"
                  value={v.state}
                  disabled={readOnly}
                  onChange={(e) =>
                    onChange?.(
                      value.map((a, j) =>
                        i === j ? { ...a, state: e.target.value } : a,
                      ),
                    )
                  }
                />
              </label>
            </div>
          </section>
        );
      })}
      <p className="force-explanation">
        Сили задано в <strong>умовних одиницях</strong>: однакова довжина
        означає однакову силу в усіх схемах (16 одиниць рисунка на 1 ум. од.).
        Сила тяжіння спрямована вниз, сила Архімеда та реакція горизонтальної
        опори — вгору. Нульові сили не зображаються. Точки прикладання показано
        спрощено, стрілки рознесено для читабельності. Числові сили в ньютонах
        обґрунтуйте у висновку.
      </p>
    </div>
  );
}
