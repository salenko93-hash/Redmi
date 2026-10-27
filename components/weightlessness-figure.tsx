"use client";
import { useId, useState } from "react";
import { PressureBlock, PressureDefinitions } from "./pressure-equipment";
import { pressureGeometry } from "@/lib/pressure-view";
export function WeightlessnessFigure() {
  const [falling, setFalling] = useState(false);
  const id = useId();
  return (
    <figure className="question-figure weightlessness-figure">
      <div
        className="button-row no-print"
        role="group"
        aria-label="Режим опори"
      >
        {[false, true].map((f) => (
          <button
            key={String(f)}
            type="button"
            className={`button ${falling === f ? "primary" : "secondary"}`}
            aria-pressed={falling === f}
            onClick={() => setFalling(f)}
          >
            {f ? "Спільне вільне падіння" : "Опора нерухома"}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 600 250"
        className="simulation-scene"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>
          {falling
            ? "Невагомість у спільному вільному падінні"
            : "Брусок на нерухомій опорі"}
        </title>
        <desc id={`${id}-desc`}>
          {falling
            ? "Сила тяжіння діє вниз. Реакція опори й вага дорівнюють нулю. Брусок та опора падають разом без опору повітря."
            : "Сила тяжіння діє вниз, реакція опори вгору. Тіло в спокої, вага дорівнює mg."}
        </desc>
        <PressureDefinitions id={id} />
        <defs>
          <marker
            id={`${id}-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0 0L8 4L0 8Z" fill="#496d56" />
          </marker>
        </defs>
        <g transform={`translate(0,${falling ? 20 : 0})`}>
          <path
            d="M72 170L107 138H327L292 170Z"
            fill="#d8c5a2"
            stroke="#ad9267"
          />
          <path
            d="M72 170H292V180H72Z"
            fill={`url(#${id}-wood)`}
            stroke="#ad9267"
          />
          <path d="M292 170l35-32v10l-35 32Z" fill="#a08258" />
          <PressureBlock
            id={id}
            geometry={pressureGeometry(0.08, 0.04, 0.02, 0)}
            x={140}
            base={160}
          />
          {falling ? (
            <path
              d="M110 80V132M104 124L110 132L116 124"
              fill="none"
              stroke="#79916d"
              strokeWidth="2"
            />
          ) : (
            <path
              d="M90 180V208H103V180M260 180V208H273V180"
              stroke="#9b8057"
              strokeWidth="4"
              fill="none"
            />
          )}
        </g>
        <circle cx="437" cy="122" r="5" fill="#496d56" />
        <line
          data-freefall-force="gravity"
          x1="437"
          x2="437"
          y1="122"
          y2="192"
          stroke="#496d56"
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
        <text x="450" y="187" style={{ fontSize: 14 }}>
          Fтяж = mg
        </text>
        {!falling && (
          <g>
            <line
              data-freefall-force="normal"
              x1="437"
              x2="437"
              y1="122"
              y2="52"
              stroke="#496d56"
              strokeWidth="2"
              markerEnd={`url(#${id}-arrow)`}
            />
            <text x="450" y="63" style={{ fontSize: 14 }}>
              N
            </text>
          </g>
        )}
        <text x="182" y="228" textAnchor="middle" style={{ fontSize: 13 }}>
          {falling
            ? "Тіло й опора падають разом"
            : "Опора утримується нерухомо"}
        </text>
      </svg>
      <figcaption aria-live="polite">
        {falling
          ? "N = 0, вага P = 0; сила тяжіння діє. Це ідеальне спільне падіння без опору повітря."
          : "N = mg, вага P = mg. Вага — сила дії тіла на опору; реакція опори діє на тіло."}{" "}
        Навчальна екранна схема, без реального скидання обладнання.
      </figcaption>
    </figure>
  );
}
