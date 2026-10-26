"use client";
import { useId, useRef, useState } from "react";
import { labs } from "@/lib/labs";
import { labThreeSeries } from "@/lib/lab-three-material";
import { VirtualLab } from "./virtual-lab";
import styles from "./practice-tabs.module.css";
export function PendulumPractice() {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const series = labThreeSeries[active];
  return (
    <div className={`${styles.practice} no-print`}>
      <div
        role="tablist"
        aria-label="Тренувальні серії маятника"
        className={styles.tabs}
      >
        {labThreeSeries.map((s, i) => (
          <button
            type="button"
            key={s.id}
            id={`${id}-tab-${i}`}
            role="tab"
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            ref={(el) => {
              refs.current[i] = el;
            }}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % 3
                  : e.key === "ArrowLeft"
                    ? (i + 2) % 3
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : null;
              if (next !== null) {
                e.preventDefault();
                setActive(next);
                refs.current[next]?.focus();
              }
            }}
          >
            <span>0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      {labThreeSeries.map((s, i) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
          tabIndex={0}
        >
          {active === i && (
            <>
              <div className={styles.conditions}>
                <strong>{series.title}</strong>
                <p>Змінюємо: {series.change}</p>
                <p>Зберігаємо: {series.fixed}</p>
                <small>{series.note}</small>
              </div>
              <VirtualLab
                key={s.id}
                number={3}
                experiment={labs[2].content.experiments.find(
                  (e) => e.id === s.id,
                )!}
                allowTransfer={false}
              />
            </>
          )}
        </div>
      ))}
      <p className={styles.note}>
        Тренування без збереження. Перемикання серії скидає її прилад;
        вимірювання для здавання вводь у призначеній роботі.
      </p>
    </div>
  );
}
