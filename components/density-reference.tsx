"use client";
import { useId, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import {
  densityEntries,
  densityInGramsPerCm3,
  type MatterState,
} from "@/lib/density-reference";
const groups = [
  { key: "all", label: "Усі" },
  { key: "solid", label: "Тверді" },
  { key: "liquid", label: "Рідини" },
  { key: "gas", label: "Гази" },
] as const;
const format = (value: number, minimumFractionDigits = 0) =>
  value.toLocaleString("uk-UA", {
    minimumFractionDigits,
    maximumFractionDigits: 6,
  });
export function DensityReference() {
  const id = useId(),
    [query, setQuery] = useState(""),
    [state, setState] = useState<MatterState | "all">("all");
  const matches = (entry: (typeof densityEntries)[number]) =>
    (state === "all" || entry.state === state) &&
    entry.name
      .toLocaleLowerCase("uk-UA")
      .includes(query.trim().toLocaleLowerCase("uk-UA"));
  const count = densityEntries.filter(matches).length;
  return (
    <section
      id="density-reference"
      className="density-reference"
      aria-labelledby={`${id}-title`}
    >
      <div className="density-reference-heading">
        <span className="eyebrow">ДОВІДНИК ДО РОБОТИ № 5</span>
        <BookOpen size={22} />
      </div>
      <h3 id={`${id}-title`}>Таблиця густин речовин</h3>
      <p>
        Порівняй виміряну густину з довідковою. Близьке значення допомагає
        припустити матеріал; враховуй похибку, склад і температуру.
      </p>
      <div className="density-reference-controls no-print">
        <label className="density-search">
          <Search size={17} />
          <span className="sr-only">Знайти речовину</span>
          <input
            aria-label="Знайти речовину"
            type="search"
            value={query}
            maxLength={100}
            placeholder="Назва речовини…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Агрегатний стан"
          className="density-filters"
        >
          {groups.map((group) => (
            <button
              type="button"
              key={group.key}
              aria-pressed={state === group.key}
              onClick={() => setState(group.key)}
            >
              {group.label}
              <span>
                {group.key === "all"
                  ? densityEntries.length
                  : densityEntries.filter((e) => e.state === group.key).length}
              </span>
            </button>
          ))}
        </div>
        <p role="status">
          Знайдено: {count} із {densityEntries.length}
        </p>
      </div>
      <div
        className="density-reference-table"
        tabIndex={0}
        role="region"
        aria-label="Довідкові густини речовин"
      >
        <table>
          <caption>1 г/см³ = 1000 кг/м³</caption>
          <thead>
            <tr>
              <th scope="col">Речовина</th>
              <th scope="col">ρ, кг/м³</th>
              <th scope="col">ρ, г/см³</th>
            </tr>
          </thead>
          <tbody>
            {densityEntries.map((entry) => (
              <tr
                key={entry.name}
                hidden={!matches(entry)}
                data-density-state={entry.state}
              >
                <th scope="row">
                  {entry.name}
                  {entry.note && <small>{entry.note}</small>}
                </th>
                <td>{format(entry.density)}</td>
                <td>{format(densityInGramsPerCm3(entry.density), 2)}</td>
              </tr>
            ))}
            {count === 0 && (
              <tr className="density-empty no-print">
                <td colSpan={3}>
                  Нічого не знайдено. Змініть назву або оберіть «Усі».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="density-reference-note">
        За наданою навчальною таблицею, значення округлені. Для газів: 0 °C і
        760 мм рт. ст. Для твердих тіл та рідин умови можуть відрізнятися; рідке
        олово наведено при 409 °C. Густини деревини, сумішей і розчинів залежать
        від складу. Це довідник, а не вимірювання.
      </p>
    </section>
  );
}
