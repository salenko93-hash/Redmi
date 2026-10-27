"use client";
import { useId, useRef, useState } from "react";
import { FloatingDefinitions } from "./floating-equipment";
import { Maximize2 } from "lucide-react";
function BodiesPlot({ active }: { active: number | null }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 600 340"
      className="simulation-scene"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>
        Три тіла однакового об’єму плавають у воді
      </title>
      <desc id={`${id}-desc`}>
        Однакові за розміром тіла 1, 2 і 3. У тіла 1 найбільша занурена частина,
        у 2 найменша, у 3 проміжна. Усі перебувають у рівновазі без сторонніх
        опор.
      </desc>
      <FloatingDefinitions id={id} />
      <defs>
        <clipPath id={`${id}-wet`}>
          <rect x="54" y="145" width="492" height="150" />
        </clipPath>
      </defs>
      <path
        d="M50 125V295Q50 307 64 307H536Q550 307 550 295V125"
        fill={`url(#${id}-glass)`}
        stroke="#92b1ad"
      />
      <rect
        x="54"
        y="145"
        width="492"
        height="150"
        fill={`url(#${id}-water)`}
      />
      <ellipse cx="300" cy="145" rx="246" ry="5" fill="#b7ddde" opacity=".6" />
      <path
        d="M50 125V295Q50 307 64 307H536Q550 307 550 295V125"
        fill="none"
        stroke="#7f9da4"
        strokeWidth="4"
      />
      {[0.85, 0.12, 0.45].map((fraction, i) => (
        <g
          key={i}
          data-body-number={i + 1}
          opacity={active === null || active === i + 1 ? 1 : 0.25}
        >
          <path
            d={`M${105 + i * 160} ${145 - (1 - fraction) * 70}l13-7h70l-13 7Z`}
            fill={["#eddbac", "#d3e3c3", "#c6dce7"][i]}
            stroke="#91a184"
            strokeWidth=".8"
          />
          <path
            d={`M${175 + i * 160} ${145 - (1 - fraction) * 70}l13-7v70l-13 7Z`}
            fill={["#ab965c", "#7d9c72", "#7297ac"][i]}
            stroke="#819582"
            strokeWidth=".8"
          />
          <rect
            x={105 + i * 160}
            y={145 - (1 - fraction) * 70}
            width="70"
            height="70"
            fill={["#dec98a", "#a8c6a5", "#9bbcd2"][i]}
            stroke={["#a78945", "#668663", "#638aab"][i]}
            strokeWidth="2"
          />
          <g clipPath={`url(#${id}-wet)`}>
            <rect
              x={105 + i * 160}
              y={145 - (1 - fraction) * 70}
              width="83"
              height="70"
              fill="#73b3c7"
              opacity=".2"
            />
          </g>
          <text
            x={140 + i * 160}
            y={190 - (1 - fraction) * 70}
            textAnchor="middle"
            style={{ fontSize: 24, fontWeight: 650 }}
          >
            {i + 1}
          </text>
        </g>
      ))}
      <line x1="54" x2="546" y1="145" y2="145" stroke="#77a9b4" />
      <path
        d="M58 154V286M542 154V286"
        stroke="#fff"
        strokeWidth="3"
        opacity=".6"
      />
      <path d="M50 125Q300 141 550 125" stroke="#9ab8b3" fill="none" />
      <text x="300" y="335" textAnchor="middle" style={{ fontSize: 12 }}>
        Якісне відтворення рисунка · числових часток не задано
      </text>
    </svg>
  );
}
export function FloatingBodiesFigure() {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="question-figure floating-bodies-figure">
      <BodiesPlot active={active} />
      <div
        className="button-row no-print"
        role="group"
        aria-label="Виділити тіло на рисунку"
      >
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`button ${active === n ? "primary" : "secondary"}`}
            aria-pressed={active === n}
            onClick={() => setActive(active === n ? null : n)}
          >
            Тіло {n}
          </button>
        ))}
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.showModal()}
        >
          Збільшити рисунок <Maximize2 size={15} />
        </button>
      </div>
      <figcaption>
        Відтворено за джерелом: тіло 1 занурене найбільше, тіло 2 — найменше,
        тіло 3 — між ними. Повні об’єми однакові; за рисунком порівнюй
        занурення, не вимірюй числові частки.
      </figcaption>
      <dialog
        ref={dialog}
        className="figure-dialog"
        aria-label="Збільшений рисунок плаваючих тіл"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Закрити рисунок
        </button>
        <BodiesPlot active={active} />
      </dialog>
    </figure>
  );
}
