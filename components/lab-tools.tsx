"use client";
import { Calculator } from "lucide-react";
import { densityEntries } from "@/lib/density-reference";
import { ResearchCalculator } from "./research-calculator";
export function LabTools({ number }: { number: number }) {
  return (
    <section className="tools" aria-label="Інструменти дослідника">
      <div className="tools-heading">
        <Calculator size={17} /> Інструменти дослідника
      </div>
      <div className="tools-content">
        <ResearchCalculator />
        {[5, 9, 10].includes(number) && (
          <>
            <h4>Густини, кг/м³</h4>
            <p className="muted">
              Орієнтовні значення; залежать від складу й температури.
            </p>
            {densityEntries
              .filter((e) =>
                [
                  "Вода чиста",
                  "Гліцерин",
                  "Алюміній",
                  "Залізо",
                  "Мідь",
                  "Олія",
                ].includes(e.name),
              )
              .map(({ name, density }) => (
                <div className="reference-row" key={name}>
                  <span>{name}</span>
                  <strong>{density.toLocaleString("uk-UA")}</strong>
                </div>
              ))}
            <a
              className="density-reference-link"
              href="/materials/5#density-reference"
              target="_blank"
              rel="noreferrer"
            >
              Повна таблиця густин ↗
            </a>
          </>
        )}
      </div>
    </section>
  );
}
