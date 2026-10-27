"use client";
import { useId, useRef } from "react";
import { Maximize2 } from "lucide-react";
import { oilLabel } from "@/lib/lab-five-material";
export function OilLabelFigure() {
  const id = useId().replace(/:/g, "");
  const dialog = useRef<HTMLDialogElement>(null);
  const content = (suffix: string) => (
    <div className="oil-label-layout">
      <svg
        viewBox="0 0 220 320"
        role="img"
        aria-label="Навчальна пляшка олії: маса нетто 782 г, об’єм 0,85 л"
      >
        <defs>
          <linearGradient id={`${id}-${suffix}-glass`}>
            <stop stopColor="#a7b8a0" stopOpacity=".65" />
            <stop offset=".16" stopColor="#fffff6" stopOpacity=".6" />
            <stop offset=".45" stopColor="#f0edc8" stopOpacity=".15" />
            <stop offset=".82" stopColor="#fffef2" stopOpacity=".45" />
            <stop offset="1" stopColor="#839b77" stopOpacity=".65" />
          </linearGradient>
          <linearGradient id={`${id}-${suffix}-oil`}>
            <stop stopColor="#ac812b" />
            <stop offset=".22" stopColor="#f3d46d" />
            <stop offset=".52" stopColor="#e5be4b" />
            <stop offset=".8" stopColor="#f8de83" />
            <stop offset="1" stopColor="#b58c32" />
          </linearGradient>
          <linearGradient id={`${id}-${suffix}-cap`}>
            <stop stopColor="#355c44" />
            <stop offset=".35" stopColor="#7e9d64" />
            <stop offset=".65" stopColor="#557b4c" />
            <stop offset="1" stopColor="#2b523a" />
          </linearGradient>
          <clipPath id={`${id}-${suffix}-body`}>
            <path d="M86 37H134V69Q163 84 168 115V282Q168 304 147 304H73Q52 304 52 282V115Q57 84 86 69Z" />
          </clipPath>
        </defs>
        <ellipse
          cx="111"
          cy="307"
          rx="64"
          ry="7"
          fill="#435d36"
          opacity=".13"
        />
        <path
          d="M86 37H134V69Q163 84 168 115V282Q168 304 147 304H73Q52 304 52 282V115Q57 84 86 69Z"
          fill={`url(#${id}-${suffix}-glass)`}
          stroke="#8f9e74"
          strokeWidth="1.2"
        />
        <g clipPath={`url(#${id}-${suffix}-body)`}>
          <path
            d="M48 104Q110 111 174 104V310H48Z"
            fill={`url(#${id}-${suffix}-oil)`}
          />
          <path
            d="M53 104Q110 110 168 104"
            fill="none"
            stroke="#dccb86"
            strokeWidth="1.4"
          />
          {[126, 139, 265, 278, 290].map((y) => (
            <g key={y}>
              <path
                d={`M53 ${y}Q110 ${y + 10} 167 ${y}`}
                fill="none"
                stroke="#9a812e"
                strokeWidth="2"
                opacity=".32"
              />
              <path
                d={`M54 ${y - 2}Q110 ${y + 8} 166 ${y - 2}`}
                fill="none"
                stroke="#fff2b5"
                strokeWidth="1.2"
                opacity=".6"
              />
            </g>
          ))}
          <path
            d="M62 118Q64 94 89 79M61 119V275M152 119V280"
            fill="none"
            stroke="#ffffef"
            strokeWidth="5"
            opacity=".32"
          />
          <path d="M68 124V265" stroke="#fffce6" strokeWidth="2" opacity=".6" />
        </g>
        {[43, 51, 60].map((y) => (
          <path
            key={y}
            d={`M86 ${y}Q110 ${y + 4} 134 ${y}`}
            fill="none"
            stroke="#a7b994"
            strokeWidth="1"
          />
        ))}
        <rect
          x="80"
          y="15"
          width="60"
          height="25"
          rx="4"
          fill={`url(#${id}-${suffix}-cap)`}
          stroke="#426540"
        />
        {Array.from({ length: 13 }, (_, i) => (
          <line
            key={i}
            x1={84 + i * 4.2}
            x2={84 + i * 4.2}
            y1="19"
            y2="35"
            stroke="#abc18a"
            strokeWidth=".7"
            opacity=".5"
          />
        ))}
        <ellipse cx="110" cy="16" rx="27" ry="3" fill="#7c995e" />
        <path d="M83 40H137" stroke="#65834c" strokeWidth="3" />
        <path
          d="M55 153Q110 163 165 153V254Q110 264 55 254Z"
          fill="#f6f2d8"
          stroke="#d2c896"
          strokeWidth=".8"
        />
        <path
          d="M57 158Q110 168 163 158M57 249Q110 259 163 249"
          fill="none"
          stroke="#bcc79a"
          strokeWidth="1"
        />
        <path
          d="M100 181q1-17 20-16-1 17-20 16m0 1q-15-1-13-14 15 1 13 14"
          fill="#7e995c"
        />
        <text
          x="110"
          y="207"
          textAnchor="middle"
          fill="#35583c"
          fontSize="22"
          fontWeight="650"
        >
          ОЛІЯ
        </text>
        <text x="110" y="227" textAnchor="middle" fill="#5d6f44" fontSize="11">
          Нетто 782 г
        </text>
        <text x="110" y="244" textAnchor="middle" fill="#5d6f44" fontSize="12">
          0,85 л
        </text>
        <path
          d="M70 300Q110 309 150 300"
          fill="none"
          stroke="#d9be70"
          strokeWidth="1.5"
        />
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
        Навчальна ілюстрація пляшки. Числові дані відтворено з етикетки у
        джерелі.
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
