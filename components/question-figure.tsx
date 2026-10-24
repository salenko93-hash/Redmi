"use client";
import { useRef } from "react";
export function QuestionFigure({ src, alt }: { src: string; alt: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="question-figure">
      <button
        type="button"
        className="figure-zoom"
        aria-label="Збільшити рисунок"
        onClick={() => dialog.current?.showModal()}
      >
        <img src={src} alt={alt} loading="lazy" />
        <span>Збільшити рисунок ↗</span>
      </button>
      <dialog
        ref={dialog}
        className="figure-dialog"
        aria-label="Збільшений рисунок до запитання"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Закрити збільшений рисунок
        </button>
        <img src={src} alt={alt} />
      </dialog>
      <figcaption>Рисунок з оригінальної лабораторної роботи</figcaption>
    </figure>
  );
}
