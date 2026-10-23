"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer, Plus } from "lucide-react";
import { densityReference } from "@/lib/labs";
export function LabTools({ number }: { number: number }) {
  const [running, setRunning] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [count, setCount] = useState(0);
  const start = useRef(0),
    base = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setElapsed(base.current + performance.now() - start.current),
      50,
    );
    return () => clearInterval(id);
  }, [running]);
  return (
    <details className="tools">
      <summary>
        <Timer size={17} /> Інструменти дослідника
      </summary>
      <div className="tools-content">
        <p className="muted">
          Таймер допомагає вимірювати час, але реакція людини впливає на
          точність.
        </p>
        <div className="stopwatch" aria-live="off">
          {(elapsed / 1000).toFixed(2)} <small>с</small>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              if (running) {
                base.current = base.current + performance.now() - start.current;
                setElapsed(base.current);
              } else start.current = performance.now();
              setRunning(!running);
            }}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}{" "}
            {running ? "Пауза" : "Старт"}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Скинути таймер"
            onClick={() => {
              setRunning(false);
              base.current = 0;
              setElapsed(0);
              setCount(0);
            }}
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setCount(count + 1)}
          >
            <Plus size={16} /> Цикл: {count}
          </button>
        </div>
        {[5, 9, 10].includes(number) && (
          <>
            <h4>Густини, кг/м³</h4>
            <p className="muted">
              Орієнтовні значення; залежать від складу й температури.
            </p>
            {densityReference.map(([name, value]) => (
              <div className="reference-row" key={name}>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </>
        )}
      </div>
    </details>
  );
}
