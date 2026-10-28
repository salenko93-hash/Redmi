"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LearningAction,
  LearningInput,
  LearningReport,
} from "@/lib/learning-progress";

export function useLearningJournal(assignmentId: string, active: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [report, setReport] = useState<LearningReport | null>(null);
  const queue = useRef<LearningInput[]>([]);
  const allowed = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const endpoint = `/api/assignments/${assignmentId}/learning`;
  const refresh = useCallback(async () => {
    if (!active) return;
    const current = generation.current;
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ?? "Не вдалося завантажити навчальний поступ.",
        );
      if (current !== generation.current) return;
      allowed.current = data.enabled;
      if (!data.enabled) {
        queue.current = [];
        setPending(0);
      }
      setEnabled(data.enabled);
      setReport(data.report);
      setLoaded(true);
    } catch (err) {
      if (current === generation.current)
        setError(
          err instanceof Error ? err.message : "Немає зв’язку із журналом.",
        );
    }
  }, [endpoint, active]);
  const flush = useCallback(async () => {
    if (!active || !allowed.current) return;
    if (inFlight.current) return inFlight.current;
    if (!queue.current.length) return;
    const current = generation.current;
    const task = (async () => {
      try {
        while (
          queue.current.length &&
          allowed.current &&
          current === generation.current
        ) {
          const batch = queue.current.slice(0, 20);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events: batch }),
            keepalive: true,
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error ?? "Не вдалося зберегти навчальні дії.");
          if (current !== generation.current) return;
          const sent = new Set(batch.map((event) => event.eventId));
          queue.current = queue.current.filter(
            (event) => !sent.has(event.eventId),
          );
          setPending(queue.current.length);
          setError(
            data.capped
              ? "Досягнуто межі журналу цієї роботи. Звіт і досліди продовжують працювати."
              : "",
          );
        }
        await refresh();
      } catch (err) {
        if (current === generation.current)
          setError(
            err instanceof Error ? err.message : "Журнал очікує з’єднання.",
          );
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = task;
    return task;
  }, [endpoint, active, refresh]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => void flush(), 5000);
    const online = () => void flush();
    window.addEventListener("online", online);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", online);
    };
  }, [active, flush]);
  const emit = useCallback(
    (event: LearningAction) => {
      if (!active || !allowed.current) return;
      if (queue.current.length >= 100) {
        setError(
          "Журнал переповнений без з’єднання. Частина нових навчальних дій не записується; відповіді зберігаються окремо.",
        );
        return;
      }
      queue.current.push({
        ...event,
        eventId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
        occurredAt: new Date().toISOString(),
      } as LearningInput);
      setPending(queue.current.length);
    },
    [active],
  );
  async function toggle(next: boolean) {
    setBusy(true);
    setError("");
    generation.current++;
    allowed.current = false;
    queue.current = [];
    setPending(0);
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ?? "Не вдалося змінити налаштування журналу.",
        );
      allowed.current = data.enabled;
      setEnabled(data.enabled);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Немає з’єднання.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return {
    enabled,
    loaded,
    busy,
    error,
    pending,
    report,
    emit,
    flush,
    refresh,
    toggle,
  };
}
