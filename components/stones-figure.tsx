"use client";
import { useId, useRef } from "react";
import { Maximize2 } from "lucide-react";
import { stonesLeftWeights, stonesRightWeights } from "@/lib/lab-four-material";
import { BalanceScene } from "./balance-scene";
export function StonesFigure({
  ignoreBagMass = false,
}: {
  ignoreBagMass?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const dialog = useRef<HTMLDialogElement>(null);
  const figure = (suffix: string) => (
    <svg
      className="simulation-scene"
      viewBox="0 0 600 350"
      role="img"
      aria-label="Рівноплечі терези в рівновазі. Ліворуч мішечок із 32 камінцями, 2 г і два важки по 500 мг. Праворуч 50 г, 20 г, 10 г, 2 г і 1 г."
    >
      <BalanceScene
        id={`${id}-${suffix}`}
        difference={0}
        leftLabel="Мішечок із камінцями"
        loads={stonesRightWeights}
        status="Рівноплечі терези в рівновазі"
        bag
        leftExtra={stonesLeftWeights}
      />
    </svg>
  );
  return (
    <figure className="question-figure stones-figure">
      {figure("inline")}
      <div className="stones-loads">
        <div>
          <strong>Ліва шалька</strong>
          <p>Мішечок із 32 однаковими камінцями</p>
          <ul>
            {stonesLeftWeights.map((w) => (
              <li key={w.key}>
                {w.count} × {w.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Права шалька</strong>
          <ul>
            {stonesRightWeights.map((w) => (
              <li key={w.key}>
                {w.count} × {w.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption>
        Векторна схема за рисунком із джерела.{" "}
        {ignoreBagMass
          ? "У цій навчальній задачі масою мішечка знехтуй."
          : "Перевір умову щодо маси мішечка: її потрібно вказати або явно дозволити нею знехтувати."}{" "}
        У реальному досліді масу тари потрібно врахувати.
      </figcaption>
      <button
        type="button"
        className="button secondary stones-zoom"
        onClick={() => dialog.current?.showModal()}
      >
        <Maximize2 size={16} /> Збільшити рисунок
      </button>
      <dialog
        ref={dialog}
        className="figure-dialog stones-dialog"
        aria-label="Збільшена схема терезів"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Закрити схему
        </button>
        {figure("dialog")}
      </dialog>
    </figure>
  );
}
