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
    const interval = window.setInterval(update, 40);
    return () => window.clearInterval(interval);
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
}: {
  clock: ReturnType<typeof useManualStopwatch>;
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
        <span>Вручну</span>
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
          onClick={clock.running ? clock.stop : clock.start}
          aria-label={
            clock.running
              ? "Зупинити секундомір"
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
          {clock.running ? "Стоп" : clock.elapsed > 0 ? "Продовжити" : "Старт"}
        </button>
        <button
          type="button"
          className={styles.reset}
          aria-label="Скинути секундомір"
          onClick={clock.reset}
          disabled={!clock.running && clock.elapsed === 0}
        >
          <RotateCcw size={15} aria-hidden="true" /> Скинути
        </button>
      </div>
      <span className={styles.status} role="status">
        {clock.running
          ? "Відлік триває — зупиніть самостійно"
          : clock.elapsed > 0
            ? "Час зафіксовано — запишіть у таблицю"
            : "Готовий до ручного вимірювання"}
      </span>
      <p id={hint}>
        Старт і стоп натискаєте ви. Прилад не керує секундоміром. Час у секундах
        внесіть у таблицю самостійно.
      </p>
    </section>
  );
}
