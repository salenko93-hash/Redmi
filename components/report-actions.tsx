"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Download, Printer } from "lucide-react";
import type { ReportData } from "@/lib/report-types";
import { ReportDocument } from "./report-document";
import { waitForReportAssets } from "@/lib/report-export";

export function ReportActions({ data }: { data: ReportData }) {
  const [active, setActive] = useState<"pdf" | "print" | null>(null);
  const [snapshot, setSnapshot] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null),
    busy = useRef(false);
  const cleanupPrint = useRef<(() => void) | null>(null);
  const focus = useRef<HTMLElement | null>(null);
  function reset() {
    busy.current = false;
    setActive(null);
    setSnapshot(null);
    requestAnimationFrame(() => focus.current?.focus());
  }
  useEffect(
    () => () => {
      cleanupPrint.current?.();
    },
    [],
  );
  async function start(action: "pdf" | "print") {
    if (busy.current) return;
    busy.current = true;
    focus.current = document.activeElement as HTMLElement;
    flushSync(() => {
      setError("");
      setSnapshot(JSON.parse(JSON.stringify(data)));
      setActive(action);
    });
    try {
      await waitForReportAssets(root.current!);
      if (action === "pdf") {
        const { downloadReportPdf } = await import("@/lib/report-export");
        await downloadReportPdf(
          root.current!,
          data.meta.title,
          `FizLab-Lab-${String(data.number).padStart(2, "0")}.pdf`,
        );
        reset();
      } else {
        const media = window.matchMedia("print");
        const finish = () => {
          // Some browsers emit afterprint before leaving print media; keep the report mounted until then.
          if (media.matches) return;
          cleanupPrint.current?.();
          reset();
        };
        const changed = (event: MediaQueryListEvent) => {
          if (!event.matches) finish();
        };
        document.body.classList.add("report-print-active");
        window.addEventListener("afterprint", finish);
        media.addEventListener("change", changed);
        cleanupPrint.current = () => {
          document.body.classList.remove("report-print-active");
          window.removeEventListener("afterprint", finish);
          media.removeEventListener("change", changed);
          cleanupPrint.current = null;
        };
        window.print();
      }
    } catch {
      cleanupPrint.current?.();
      reset();
      setError(
        action === "pdf"
          ? "Не вдалося підготувати PDF. Спробуйте знову або скористайтеся кнопкою «Друкувати»."
          : "Не вдалося відкрити друк. Спробуйте знову.",
      );
    }
  }
  return (
    <div className="report-actions no-print">
      <div
        className="report-buttons"
        role="group"
        aria-label="Збереження та друк звіту"
      >
        <button
          type="button"
          className="text-button"
          disabled={active !== null}
          onClick={() => void start("pdf")}
        >
          <Download size={16} />
          {active === "pdf" ? "Готуємо PDF…" : "Зберегти PDF"}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={active !== null}
          onClick={() => void start("print")}
        >
          <Printer size={16} />
          {active === "print" ? "Підготовлено до друку" : "Друкувати"}
        </button>
      </div>
      {active === "pdf" && <span role="status">Формуємо повний звіт…</span>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {active &&
        snapshot &&
        createPortal(
          <div className="report-export" ref={root} aria-hidden="true" inert>
            <ReportDocument data={snapshot} />
          </div>,
          document.body,
        )}
    </div>
  );
}
