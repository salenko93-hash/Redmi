"use client";
import { useId, useRef } from "react";
import { Maximize2 } from "lucide-react";
import { oilLabel } from "@/lib/lab-five-material";
export function OilLabelFigure() {
  const id = useId().replace(/:/g, "");
  const dialog = useRef<HTMLDialogElement>(null);
  const content = (suffix: string) => (
    <div className="oil-label-layout">
      <svg viewBox="0 0 220 320" role="img" aria-label="Схематична пляшка олії">
        <defs>
          <linearGradient id={`${id}-${suffix}`}>
            <stop offset="0" stopColor="#e6b743" />
            <stop offset=".5" stopColor="#f4d680" />
            <stop offset="1" stopColor="#d5a238" />
          </linearGradient>
        </defs>
        <rect x="79" y="12" width="62" height="24" rx="5" fill="#5c7650" />
        <path
          d="M84 36H136V68Q169 84 173 117V285Q173 306 151 306H69Q47 306 47 285V117Q51 84 84 68Z"
          fill={`url(#${id}-${suffix})`}
          stroke="#b89750"
          strokeWidth="2"
        />
        <rect x="54" y="162" width="112" height="95" rx="8" fill="#f8f5dc" />
        <text
          x="110"
          y="202"
          textAnchor="middle"
          fill="#456142"
          fontSize="22"
          fontWeight="650"
        >
          ОЛІЯ
        </text>
        <text x="110" y="231" textAnchor="middle" fill="#687852" fontSize="11">
          Дані з етикетки
        </text>
      </svg>
      <div>
        <span className="eyebrow">НАВЧАЛЬНА ЕТИКЕТКА</span>
        <dl>
          <div>
            <dt>Маса нетто</dt>
            <dd>
              {oilLabel.netMass} <span>г</span>
            </dd>
          </div>
          <div>
            <dt>Об’єм</dt>
            <dd>
              {oilLabel.volume} <span>л</span>
            </dd>
          </div>
        </dl>
        <p>
          Нетто — маса олії без пляшки. Узгодь одиниці перед обчисленням
          густини.
        </p>
      </div>
    </div>
  );
  return (
    <figure className="question-figure oil-label-figure">
      {content("inline")}
      <figcaption>
        Дані відтворено з етикетки у джерелі. Вигляд пляшки схематичний.
      </figcaption>
      <button
        type="button"
        className="button secondary oil-label-zoom"
        onClick={() => dialog.current?.showModal()}
      >
        <Maximize2 size={16} /> Збільшити етикетку
      </button>
      <dialog
        ref={dialog}
        className="figure-dialog oil-label-dialog"
        aria-label="Збільшена етикетка олії"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Закрити етикетку
        </button>
        {content("dialog")}
      </dialog>
    </figure>
  );
}
