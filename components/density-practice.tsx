"use client";
import { useId, useRef, useState } from "react";
import { labs } from "@/lib/labs";
import { labFiveSeries } from "@/lib/lab-five-material";
import { VirtualLab } from "./virtual-lab";
import styles from "./practice-tabs.module.css";
export function DensityPractice() {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className={`${styles.practice} no-print`}>
      <div
        role="tablist"
        aria-label="Тренувальні серії густини"
        className={styles.tabs}
      >
        {labFiveSeries.map((s, i) => (
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
      {labFiveSeries.map((s, i) => (
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
                <strong>{s.title}</strong>
                <p>{s.note}</p>
              </div>
              <VirtualLab
                key={s.id}
                number={5}
                experiment={labs[4].content.experiments.find(
                  (e) => e.id === s.id,
                )!}
                allowTransfer={false}
              />
            </>
          )}
        </div>
      ))}
      <p className={styles.note}>
        Тренування без збереження. Перемикання вкладки скидає прилад; для
        здавання відкрий призначену роботу.
      </p>
    </div>
  );
}
