"use client";
import { useId, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { speedIntervals } from "@/lib/lab-one-material";

function SpeedPlot({ active }: { active: number | null }) {
  const id = useId();
  const x = (t: number) => 64 + t * 11.2;
  const y = (v: number) => 254 - v * 1.95;
  return (
    <svg
      viewBox="0 0 620 310"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className="speed-time-plot"
    >
      <title id={`${id}-title`}>Залежність швидкості від часу</title>
      <desc id={`${id}-desc`}>
        25 м/с від 0 до 20 с, 50 м/с від 20 до 30 с, 100 м/с від 30 до 45 с.
        Переходи між ділянками ідеалізовані.
      </desc>
      <rect width="620" height="310" rx="16" fill="#f8faf6" />
      {active !== null && (
        <rect
          x={x(speedIntervals[active].start)}
          y="40"
          width={
            (speedIntervals[active].end - speedIntervals[active].start) * 11.2
          }
          height="214"
          fill="#e4edcf"
        />
      )}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1="64" x2="578" y1={y(v)} y2={y(v)} stroke="#dde6da" />
          <text x="52" y={y(v) + 5} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {[0, 10, 20, 30, 40, 45].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1="40" y2="254" stroke="#dde6da" />
          <text x={x(t)} y="280" textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
      <path d="M64 35V254H586" fill="none" stroke="#526950" strokeWidth="2" />
      <text x="22" y="24">
        v, м/с
      </text>
      <text x="581" y="300" textAnchor="end">
        t, с
      </text>
      {speedIntervals.slice(1).map((segment, i) => (
        <line
          key={segment.start}
          x1={x(segment.start)}
          x2={x(segment.start)}
          y1={y(speedIntervals[i].speed)}
          y2={y(segment.speed)}
          stroke="#8b9e84"
          strokeDasharray="5 5"
        />
      ))}
      {speedIntervals.map((segment, i) => (
        <g
          key={segment.start}
          opacity={active === null || active === i ? 1 : 0.3}
        >
          <line
            x1={x(segment.start)}
            x2={x(segment.end)}
            y1={y(segment.speed)}
            y2={y(segment.speed)}
            stroke="#2f6851"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle
            cx={x(segment.start)}
            cy={y(segment.speed)}
            r="5"
            fill="#2f6851"
          />
          <circle
            cx={x(segment.end)}
            cy={y(segment.speed)}
            r="5"
            fill="#fff"
            stroke="#2f6851"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}

export function SpeedTimeFigure() {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="question-figure speed-time-figure">
      <SpeedPlot active={active} />
      <div
        className="speed-intervals"
        role="group"
        aria-label="Виділити проміжок часу"
      >
        {speedIntervals.map((s, i) => (
          <button
            type="button"
            key={s.start}
            aria-pressed={active === i}
            onClick={() => setActive(active === i ? null : i)}
          >
            {s.start}–{s.end} с
          </button>
        ))}
        <button
          type="button"
          className="speed-zoom"
          onClick={() => dialog.current?.showModal()}
        >
          Збільшити графік <Maximize2 size={15} aria-hidden="true" />
        </button>
      </div>
      <figcaption>
        Навчальний графік, перемальований за оригіналом. Пунктир позначає
        ідеалізовані миттєві переходи між ділянками.
      </figcaption>
      <details className="speed-data">
        <summary>Текстові дані графіка</summary>
        <table>
          <caption>Швидкість на проміжках часу</caption>
          <thead>
            <tr>
              <th scope="col">Час, с</th>
              <th scope="col">Швидкість, м/с</th>
            </tr>
          </thead>
          <tbody>
            {speedIntervals.map((s) => (
              <tr key={s.start}>
                <td>
                  {s.start}–{s.end}
                </td>
                <td>{s.speed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <dialog
        ref={dialog}
        className="figure-dialog speed-dialog"
        aria-label="Збільшений графік швидкості"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Закрити графік
        </button>
        <SpeedPlot active={active} />
      </dialog>
    </figure>
  );
}
