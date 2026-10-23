"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpRight, Clock3, Check, LockKeyhole } from "lucide-react";
import { LabIcon } from "./icons";
export type LabCard = {
  id: string;
  number: number;
  title: string;
  category: string;
  minutes: number;
  version: number;
  assignmentId?: string;
  status?: string;
  score?: number | null;
  className?: string;
  classroomId?: string;
  classProgress?: string;
  dueAt?: string | null;
};
export const statuses: Record<string, string> = {
  DRAFT: "У процесі",
  SUBMITTED: "На перевірці",
  RETURNED: "На доопрацювання",
  GRADED: "Оцінено",
};
export function LabGrid({
  cards,
  teacher = false,
  library = false,
}: {
  cards: LabCard[];
  teacher?: boolean;
  library?: boolean;
}) {
  const [filter, setFilter] = useState("Усі роботи"),
    [search, setSearch] = useState("");
  const filters = library
    ? ["Усі роботи", "Рух", "Речовина", "Сили", "Рідини"]
    : [
        "Усі роботи",
        "Не розпочато",
        "У процесі",
        "На перевірці",
        "На доопрацювання",
        "Оцінено",
      ];
  const shown = cards.filter(
    (c) =>
      (!search ||
        `${c.title} ${c.number}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === "Усі роботи" ||
        (library
          ? c.category === filter
          : (statuses[c.status ?? ""] ?? "Не розпочато") === filter)),
  );
  return (
    <>
      <div className="grid-toolbar">
        <div className="tabs">
          {filters.map((f) => (
            <button
              key={f}
              className={f === filter ? "selected" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Пошук робіт"
            placeholder="Знайти роботу…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="lab-grid">
        {shown.map((c) => (
          <Link
            className={"lab-card " + (c.status === "GRADED" ? "completed" : "")}
            href={
              library
                ? `/library/${c.id}`
                : teacher
                  ? `/classes/${c.classroomId ?? ""}`
                  : `/work/${c.assignmentId}`
            }
            key={c.assignmentId ?? c.id}
          >
            <div className="card-top">
              <span className={"lab-symbol tone-" + ((c.number - 1) % 4)}>
                <LabIcon number={c.number} />
              </span>
              <span className={"status " + (c.status ?? "NEW").toLowerCase()}>
                {c.status === "GRADED" && <Check size={12} />}{" "}
                {library
                  ? c.category
                  : (statuses[c.status ?? ""] ?? "Не розпочато")}
              </span>
            </div>
            <span className="lab-number">
              ЛАБОРАТОРНА РОБОТА {String(c.number).padStart(2, "0")}
            </span>
            <h3>{c.title}</h3>
            <p>
              {library
                ? `Дослідження · ${c.category.toLowerCase()}`
                : (c.className ?? "Практичне дослідження")}
            </p>
            <div className="card-bottom">
              <span>
                <Clock3 size={14} />
                {c.minutes} хв{" "}
                {c.classProgress && (
                  <strong className="score-inline">{c.classProgress}</strong>
                )}
                {c.score != null && (
                  <strong className="score-inline">{c.score}/12</strong>
                )}
              </span>
              <span className="card-arrow">
                <ArrowUpRight size={18} />
              </span>
            </div>
            {c.dueAt && (
              <small className="due">
                До{" "}
                {new Date(c.dueAt).toLocaleDateString("uk-UA", {
                  timeZone: "Europe/Kyiv",
                })}
              </small>
            )}
          </Link>
        ))}
      </div>
      {!shown.length && (
        <div className="empty">
          <Search size={30} />
          <h3>Поки немає робіт</h3>
          <p>
            {cards.length
              ? "Змініть фільтр або пошуковий запит."
              : "Приєднайтеся до класу або призначте першу роботу."}
          </p>
          <Link href="/classes" className="button secondary">
            Перейти до класів
          </Link>
        </div>
      )}
    </>
  );
}
