"use client";
import { useState } from "react";
import { Workspace } from "./workspace";
import type { LabContent } from "@/lib/types";
export function LibraryWorkspace({
  id,
  userId,
  content,
  number,
  teacher,
}: {
  id: string;
  userId: string;
  content: LabContent;
  number: number;
  teacher: boolean;
}) {
  const [demo, setDemo] = useState(false);
  return (
    <>
      <section className="preview-banner" aria-label="Режим перегляду">
        <div>
          <strong>
            {demo
              ? "Пробне проходження — відповіді не зберігаються"
              : "Перегляд шаблону — відповіді не зберігаються"}
          </strong>
          <p>
            {demo
              ? "Можна вводити відповіді й випробувати прилади. Ця спроба не потрапляє до журналу та зникає після виходу."
              : "Поля доступні тільки для читання. Учням потрібно відкрити призначену роботу через «Мій простір»."}
          </p>
        </div>
        {teacher && (
          <button className="button secondary" onClick={() => setDemo(!demo)}>
            {demo ? "Повернутися до шаблону" : "Спробувати як учень"}
          </button>
        )}
      </section>
      <Workspace
        key={demo ? "demo" : "preview"}
        preview={!demo}
        sandbox={demo}
        assignmentId={id}
        userId={userId}
        content={content}
        number={number}
        initial={null}
        feedbackMode="PRACTICE"
        experimentMode={demo ? "SIMULATION" : "TEMPLATE"}
      />
    </>
  );
}
