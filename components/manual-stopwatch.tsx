"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Play, RotateCcw, Square, Timer } from "lucide-react";
import styles from "./manual-stopwatch.module.css";

/** Owned by VirtualLab so moving the instrument into its dialog keeps the clock. */
export function useManualStopwatch() {
  const accumulated = useRef(0);
  const startedAt = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const update = () =>
      setElapsed(
        accumulated.current +
          Math.max(
            0,
            performance.now() - (startedAt.current ?? performance.now()),
          ),
      );
    let frame = 0;
    const tick = () => {
      update();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  function start() {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    setRunning(true);
  }
  function stop() {
    if (startedAt.current === null) return;
    accumulated.current += Math.max(0, performance.now() - startedAt.current);
    startedAt.current = null;
    setElapsed(accumulated.current);
    setRunning(false);
  }
  function reset() {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsed(0);
    setRunning(false);
  }
  return { elapsed, running, start, stop, reset };
}

export function ManualStopwatch({
  clock,
  finished,
  onStart,
  onStop,
  onReset,
  labNumber = 1,
}: {
  clock: ReturnType<typeof useManualStopwatch>;
  finished: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  labNumber?: number;
}) {
  const hint = useId();
  const seconds = (Math.floor(clock.elapsed / 10) / 100)
    .toFixed(2)
    .replace(".", ",");
  return (
    <section className={styles.root} aria-label="Ручний секундомір">
      <div className={styles.heading}>
        <Timer size={17} aria-hidden="true" />
        <strong>Секундомір</strong>
        <span>Керує дослідом</span>
      </div>
      <div className={styles.display}>
        <output
          role="timer"
          aria-label="Час ручного секундоміра"
          aria-live="off"
          aria-describedby={hint}
        >
          {seconds}
        </output>
        <span>с</span>
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.primary}
          onClick={clock.running ? onStop : onStart}
          aria-label={
            clock.running
              ? "Зупинити секундомір"
              : finished
                ? "Новий дослід секундоміром"
                : clock.elapsed > 0
                  ? "Продовжити секундомір"
                  : "Запустити секундомір"
          }
        >
          {clock.running ? (
            <Square size={15} aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          {clock.running
            ? "Стоп"
            : finished
              ? "Новий дослід"
              : clock.elapsed > 0
                ? "Продовжити"
                : "Старт"}
        </button>
        <button
          type="button"
          className={styles.reset}
          aria-label="Скинути секундомір"
          onClick={onReset}
          disabled={!clock.running && clock.elapsed === 0}
        >
          <RotateCcw size={15} aria-hidden="true" /> Скинути
        </button>
      </div>
      <span className={styles.status} role="status">
        {clock.running
          ? finished
            ? labNumber === 1
              ? "Кулька на фініші — натисніть «Стоп»"
              : "Задану кількість циклів виконано — натисніть «Стоп»"
            : "Дослід і відлік тривають"
          : clock.elapsed > 0
            ? finished
              ? "Час зафіксовано — запишіть у таблицю"
              : "Дослід і відлік призупинено"
            : "Готовий до ручного вимірювання"}
      </span>
      <p id={hint}>
        Старт запускає {labNumber === 1 ? "кульку" : "рух"} й відлік. Стоп
        призупиняє дослід. Скинути повертає на початок. Час запишіть у таблицю
        нижче.
      </p>
    </section>
  );
}
