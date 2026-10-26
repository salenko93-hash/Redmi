"use client";
import { useId, useRef, useState } from "react";
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
      <rect x="54" y="145" width="492" height="150" fill="#bedee5" />
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
          <rect
            x={105 + i * 160}
            y={145 - (1 - fraction) * 70}
            width="70"
            height="70"
            fill={["#dec98a", "#a8c6a5", "#9bbcd2"][i]}
            stroke={["#a78945", "#668663", "#638aab"][i]}
            strokeWidth="2"
          />
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
