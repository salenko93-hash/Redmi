"use client";
import { useId, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
function StiffnessPlot({ active }: { active: number | null }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 600 350"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className="stiffness-plot"
    >
      <title id={`${id}-title`}>
        Сила пружності залежно від видовження: дві пружини
      </title>
      <desc id={`${id}-desc`}>
        Дві прямі починаються в нулі. Пряма 1 має більший нахил, ніж пряма 2.
        Осі F у ньютонах та x у метрах; числових поділок немає.
      </desc>
      <rect width="600" height="350" rx="16" fill="#f8faf6" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <g key={i} stroke="#e0e7da">
          <line x1={65 + 54 * i} x2={65 + 54 * i} y1="50" y2="285" />
          <line x1="65" x2="515" y1={285 - i * 28} y2={285 - i * 28} />
        </g>
      ))}
      <path
        d="M65 44V285H532M60 53L65 44L70 53M523 280L532 285L523 290"
        fill="none"
        stroke="#526950"
        strokeWidth="2"
      />
      <text x="24" y="28">
        Fпруж, Н
      </text>
      <text x="527" y="322" textAnchor="end">
        x, м
      </text>
      <text x="48" y="307">
        0
      </text>
      <line
        x1="173"
        x2="173"
        y1="60"
        y2="285"
        stroke="#a1b083"
        strokeDasharray="5 5"
      />
      <g
        data-spring-line="1"
        opacity={active === null || active === 1 ? 1 : 0.25}
      >
        <path d="M65 285L195 61" stroke="#b46c38" strokeWidth="4" fill="none" />
        <path
          d="M65 98.9077H173"
          stroke="#b46c38"
          strokeDasharray="3 4"
          fill="none"
          opacity=".55"
        />
        <circle
          data-spring-comparison="1"
          cx="173"
          cy="98.9077"
          r="4"
          fill="#fbf8eb"
          stroke="#b46c38"
          strokeWidth="2"
        />
        <text x="200" y="69" fill="#94572f">
          1
        </text>
      </g>
      <g
        data-spring-line="2"
        opacity={active === null || active === 2 ? 1 : 0.25}
      >
        <path d="M65 285L495 87" stroke="#356a80" strokeWidth="4" fill="none" />
        <path
          d="M65 235.2698H173"
          stroke="#356a80"
          strokeDasharray="3 4"
          fill="none"
          opacity=".55"
        />
        <circle
          data-spring-comparison="2"
          cx="173"
          cy="235.2698"
          r="4"
          fill="#fbf8eb"
          stroke="#356a80"
          strokeWidth="2"
        />
        <text x="508" y="91" fill="#356a80">
          2
        </text>
      </g>
      <text x="173" y="309" textAnchor="middle" style={{ fontSize: 11 }}>
        Одне x
      </text>
      <text x="293" y="341" textAnchor="middle" style={{ fontSize: 12 }}>
        Якісний графік · без числової шкали
      </text>
    </svg>
  );
}
export function StiffnessFigure() {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="question-figure stiffness-figure">
      <StiffnessPlot active={active} />
      <div
        className="stiffness-controls"
        role="group"
        aria-label="Виділити пружину"
      >
        {[1, 2].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={active === n}
            onClick={() => setActive(active === n ? null : n)}
          >
            Пружина {n}
          </button>
        ))}
        <button type="button" onClick={() => dialog.current?.showModal()}>
          Збільшити графік <Maximize2 size={15} />
        </button>
      </div>
      <figcaption>
        Перемальовано за джерелом. Позначення 1 і 2 збережено; пунктир допомагає
        порівняти сили за одного x. Числові значення жорсткості з цього рисунка
        визначити неможливо.
      </figcaption>
      <dialog
        ref={dialog}
        className="figure-dialog"
        aria-label="Збільшений графік пружин"
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
        <StiffnessPlot active={active} />
      </dialog>
    </figure>
  );
}
