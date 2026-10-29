"use client";
import { rampCreativeInstruction } from "@/lib/lab-one-material";
import { useLearningJournal } from "./use-learning-journal";
import { LearningJournal } from "./learning-journal";
import { ReportActions } from "./report-actions";
import type { ReportMeta } from "@/lib/report-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CloudUpload,
  CloudOff,
  Send,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  Download,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import type { Answers, LabContent } from "@/lib/types";
import {
  emptyAnswers,
  fieldFeedback,
  progress,
  completeness,
} from "@/lib/physics";
import { LabTools } from "./lab-tools";
import { DensityReference } from "./density-reference";
import { ExperimentGraph } from "./graph";
import {
  questionFigure,
  questionWithInlineFigure,
} from "@/lib/question-figures";
import { QuestionFigure } from "./question-figure";
import { SpeedTimeFigure } from "./speed-time-figure";
import { StonesFigure } from "./stones-figure";
import { OilLabelFigure } from "./oil-label-figure";
import { StiffnessFigure } from "./stiffness-figure";
import { WeightlessnessFigure } from "./weightlessness-figure";
import { FloatingBodiesFigure } from "./floating-bodies-figure";
import { ForceDiagram } from "./force-diagram";
import { VirtualLab } from "./virtual-lab";
import { simulationSetup, type SimulationRecord } from "@/lib/simulation";
const steps = ["Підготовка", "Експеримент", "Запитання", "Висновок"];
const conclusionLabels = [
  "Що досліджували та як?",
  "Які результати отримали? Наведіть числові значення.",
  "Чи підтвердився прогноз? Поясніть відмінності.",
  "Що вплинуло на точність і як покращити дослід?",
];
type Comment = { id: string; field: string; body: string };
type Initial = {
  id: string;
  answers: unknown;
  revision: number;
  status: string;
  score: number | null;
  feedback: string | null;
  comments: Comment[];
  attempts: {
    id: string;
    createdAt: string;
    score: number | null;
    feedback: string | null;
    answers?: unknown;
  }[];
} | null;
export function Workspace({
  assignmentId,
  userId,
  content,
  number,
  initial,
  feedbackMode,
  experimentMode,
  preview = false,
  sandbox = false,
  reportMeta,
  archived = false,
}: {
  assignmentId: string;
  userId: string;
  content: LabContent;
  number: number;
  initial: Initial;
  feedbackMode: string;
  experimentMode: string;
  preview?: boolean;
  sandbox?: boolean;
  reportMeta?: ReportMeta;
  archived?: boolean;
}) {
  const router = useRouter();
  const learning = useLearningJournal(
    assignmentId,
    !preview && !sandbox && !archived,
  );
  const materialHref = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(number)
    ? `/materials/${number}`
    : null;
  const [answers, setAnswers] = useState<Answers>(
    (initial?.answers && Object.keys(initial.answers as object).length
      ? initial.answers
      : emptyAnswers(content)) as Answers,
  );
  const [step, setStep] = useState(0),
    [state, setState] = useState(
      archived
        ? "Архів · тільки перегляд"
        : sandbox
          ? "Пробне проходження · не зберігається"
          : preview
            ? "Перегляд шаблону"
            : "Збережено",
    ),
    [error, setError] = useState(""),
    [missing, setMissing] = useState<string[]>([]),
    [conflict, setConflict] = useState(false),
    [sending, setSending] = useState(false),
    [confirmSubmit, setConfirmSubmit] = useState(false);
  const readOnly =
    archived ||
    preview ||
    sending ||
    (!!initial && ["SUBMITTED", "GRADED"].includes(initial.status));
  const revision = useRef(initial?.revision ?? 0),
    latest = useRef(answers),
    dirty = useRef(false),
    busy = useRef<Promise<boolean> | null>(null),
    blocked = useRef(false),
    ready = useRef(false),
    mounted = useRef(false);
  const storageKey = `fizlab:${userId}:${assignmentId}`;
  const persist = useCallback(() => {
    if (sandbox) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers: latest.current,
          revision: revision.current,
          dirty: dirty.current,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      setError(
        "Браузер не дозволяє локальне збереження. Перевіряйте стан серверного збереження.",
      );
    }
  }, [storageKey, sandbox]);
  function change(a: Answers) {
    latest.current = a;
    dirty.current = true;
    setAnswers(a);
    setError("");
    if (sandbox) {
      setState("Пробне проходження · не зберігається");
      return;
    }
    persist();
    if (!blocked.current)
      setState(
        navigator.onLine
          ? "Є незбережені зміни"
          : "Немає з’єднання · збережено на пристрої",
      );
  }
  function recordSimulation(record: SimulationRecord) {
    const e = content.experiments.find((e) => e.id === record.experimentId);
    if (!e || readOnly || experimentMode !== "SIMULATION") return;
    const current = latest.current;
    const rows = e.rows.map((_, i) => ({
      ...current.experiments?.[e.id]?.[i],
    }));
    // New readings invalidate previous calculations and material identification in this row.
    rows[record.rowIndex] = { ...record.readings };
    const simulationRecords = [
      ...(current.simulationRecords ?? []).filter(
        (r) =>
          r.experimentId !== record.experimentId ||
          r.rowIndex !== record.rowIndex,
      ),
      record,
    ];
    change({
      ...current,
      experiments: { ...current.experiments, [e.id]: rows },
      simulationRecords,
    });
  }
  const save = useCallback(
    async (submit = false): Promise<boolean> => {
      if (sandbox || readOnly || blocked.current) return false;
      if (busy.current) {
        await busy.current;
        if (blocked.current) return false;
      }
      if (!dirty.current && !submit) return true;
      if (!navigator.onLine) {
        setState("Немає з’єднання · збережено на пристрої");
        persist();
        return false;
      }
      const snapshot = JSON.parse(JSON.stringify(latest.current)) as Answers;
      setState("Зберігається…");
      const task = (async () => {
        try {
          if (submit) await learning.flush();
          const r = await fetch(`/api/assignments/${assignmentId}/submission`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: snapshot,
              revision: revision.current,
              submit,
            }),
          });
          const d = await r.json();
          if (r.status === 409) {
            blocked.current = true;
            setConflict(true);
            setState("Конфлікт версій");
            throw new Error(d.error);
          }
          if (!r.ok) {
            if (d.missing) setMissing(d.missing);
            throw new Error(d.error ?? "Помилка збереження");
          }
          revision.current = d.revision;
          dirty.current =
            JSON.stringify(latest.current) !== JSON.stringify(snapshot);
          persist();
          setState(dirty.current ? "Є незбережені зміни" : "Збережено");
          setError("");
          void learning.refresh();
          if (submit) {
            dirty.current = false;
            try {
              localStorage.removeItem(storageKey);
            } catch {}
            router.refresh();
          }
          return true;
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Немає зв’язку із сервером. Чернетка залишилась на цьому пристрої.",
          );
          if (!blocked.current)
            setState("Помилка збереження · є локальна копія");
          persist();
          return false;
        } finally {
          busy.current = null;
        }
      })();
      busy.current = task;
      return task;
    },
    [readOnly, assignmentId, persist, router, storageKey, sandbox],
  );
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (readOnly || sandbox) {
      ready.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const local = JSON.parse(raw);
        if (local.dirty) {
          if (local.revision === revision.current) {
            latest.current = local.answers;
            dirty.current = true;
            setAnswers(local.answers);
            setState("Відновлено локальну чернетку");
          } else {
            revision.current = local.revision;
            latest.current = local.answers;
            dirty.current = true;
            setAnswers(local.answers);
            blocked.current = true;
            setConflict(true);
            setError(
              "На пристрої є незбережена чернетка іншої версії. Завантажте її копію перед переходом до серверних даних.",
            );
          }
        }
      }
    } catch {
      setError("Не вдалося прочитати локальну чернетку.");
    }
    ready.current = true;
  }, [readOnly, storageKey, sandbox]);
  useEffect(() => {
    if (sandbox || !ready.current || readOnly || !dirty.current) return;
    const t = setTimeout(() => void save(), 1000);
    return () => clearTimeout(t);
  }, [answers, readOnly, save, sandbox]);
  useEffect(() => {
    if (sandbox) return;
    const online = () => void save();
    const offline = () => {
      if (!readOnly) setState("Немає з’єднання · збережено на пристрої");
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        persist();
        e.preventDefault();
      }
    };
    const interval = setInterval(() => {
      if (dirty.current && !busy.current) void save();
    }, 15000);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeunload", unload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeunload", unload);
    };
  }, [save, persist, readOnly, sandbox]);
  const comments = (field: string) =>
    initial?.comments
      .filter((c) => c.field === field)
      .map((c) => (
        <p key={c.id} className="teacher-comment">
          Коментар учителя: {c.body}
        </p>
      ));
  const reviewMode = readOnly && !!initial;
  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() =>
      document.getElementById("workspace-start")?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
  }
  const shownSteps = reviewMode ? [0, 1, 2, 3] : [step];
  return (
    <div className="workspace" id="workspace-start">
      <div className="work-status-bar">
        <span className="save-state" role="status">
          {state.includes("Немає") ? (
            <CloudOff size={17} />
          ) : (
            <CloudUpload size={17} />
          )}{" "}
          {state}
        </span>
        <span>
          {preview ? "Шаблон" : `${progress(content, answers)}% заповнено`}
        </span>
        <ReportActions
          data={{
            meta: reportMeta ?? { title: `Лабораторна робота № ${number}` },
            number,
            content,
            answers,
            status: sandbox
              ? "Пробне проходження"
              : preview && !initial
                ? "Навчальний шаблон"
                : (initial?.status ?? "DRAFT"),
            experimentMode,
            score: initial?.score ?? null,
            feedback: initial?.feedback ?? null,
            comments: initial?.comments ?? [],
          }}
        />
      </div>
      {initial?.feedback && (
        <section className="feedback-banner">
          <h3>
            {initial.status === "RETURNED"
              ? "Роботу повернуто на доопрацювання"
              : "Відгук учителя"}
            {initial.score !== null && (
              <span className="grade">{initial.score}/12</span>
            )}
          </h3>
          <p>{initial.feedback}</p>
        </section>
      )}
      {initial?.status === "SUBMITTED" && (
        <p className="notice">
          Роботу здано. Редагування відкриється, якщо вчитель поверне її на
          доопрацювання.
        </p>
      )}
      {conflict && (
        <div className="error conflict">
          <strong>Чернетки відрізняються.</strong>
          <p>
            Автозбереження зупинено, щоб не перезаписати іншу версію. Збережіть
            локальну копію, потім відкрийте дані сервера й перенесіть потрібні
            зміни вручну.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    { answers: latest.current, revision: revision.current },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              );
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `lab-${number}-draft.json`;
              link.click();
              URL.revokeObjectURL(link.href);
            }}
          >
            Завантажити поточну чернетку
          </button>
          <button
            className="button secondary"
            onClick={() => {
              const local = localStorage.getItem(storageKey);
              if (local) localStorage.setItem(storageKey + ":backup", local);
              localStorage.removeItem(storageKey);
              dirty.current = false;
              window.location.reload();
            }}
          >
            Відкрити серверну версію
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {missing.length > 0 && (
        <details className="error" open>
          <summary>Ще потрібно заповнити: {missing.length}</summary>
          <ul>
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </details>
      )}
      <nav className="work-steps no-print" aria-label="Етапи роботи">
        {steps.map((s, i) => (
          <button
            key={s}
            className={i === step ? "current" : ""}
            onClick={() => goToStep(i)}
          >
            <span>{i + 1}</span>
            {s}
          </button>
        ))}
      </nav>
      <div className="work-columns">
        <div className="work-main">
          {shownSteps.includes(0) && (
            <section className="panel work-section">
              <div className="eyebrow">01 / ПІДГОТОВКА</div>
              <h2>Спочатку — запитання</h2>
              {materialHref && (
                <a
                  href={materialHref}
                  target="_blank"
                  rel="noreferrer"
                  className="lab-material-link no-print"
                >
                  <BookOpen size={20} />
                  <span>
                    <strong>Сучасна вебпам’ятка до роботи № {number}</strong>
                    <small>
                      {number === 1
                        ? "Уточнена методика, графік і тренувальний прилад"
                        : number === 2
                          ? "Уточнена методика, формули й лічильник обертів"
                          : number === 3
                            ? "Три серії дослідів і тренувальний маятник"
                            : number === 4
                              ? "Правила зважування, одиниці й інтерактивні терези"
                              : number === 5
                                ? "Три способи визначення густини та інтерактивні прилади"
                                : number === 6
                                  ? "Пружність, закон Гука й перевірка після розвантаження"
                                  : number === 7
                                    ? "Тертя ковзання, реакція опори й порівняння граней"
                                    : number === 8
                                      ? "Дві серії тиску, площа опори й модель невагомості"
                                      : number === 9
                                        ? "Два покази динамометра, повне занурення й густина"
                                        : "Середня густина, три стани плавання й схема сил"}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </a>
              )}
              <h4>Мета дослідження</h4>
              <p>{content.purpose}</p>
              <h4>Обладнання</h4>
              <div className="equipment">
                {content.equipment.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
              <h4>Що варто знати</h4>
              <div className="theory">{content.theory}</div>
              <div className="method-notes">
                <strong>Умови та методичні уточнення</strong>
                <ul>
                  {content.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
              <label className="question-label">
                Мій прогноз<span>{content.prediction}</span>
                <textarea
                  rows={4}
                  placeholder="Я припускаю, що… тому що…"
                  value={answers.prediction ?? ""}
                  disabled={readOnly}
                  onChange={(e) =>
                    change({ ...answers, prediction: e.target.value })
                  }
                />
              </label>
              {comments("prediction")}
              {experimentMode === "DATA" && (
                <label>
                  Джерело даних
                  <textarea
                    rows={2}
                    disabled={readOnly}
                    placeholder="Назва набору вчителя або посилання на відео"
                    value={answers.source ?? ""}
                    onChange={(e) =>
                      change({ ...answers, source: e.target.value })
                    }
                  />
                </label>
              )}
            </section>
          )}
          {shownSteps.includes(1) &&
            content.experiments.map((e) => (
              <section key={e.id} className="panel work-section">
                <div className="eyebrow">02 / ЕКСПЕРИМЕНТ</div>
                <h2>{e.title}</h2>
                <ol className="instructions">
                  {e.instructions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
                <VirtualLab
                  number={number}
                  experiment={e}
                  allowTransfer={!readOnly && experimentMode === "SIMULATION"}
                  onRecord={recordSimulation}
                  onLearningAction={
                    !readOnly && !sandbox ? learning.emit : undefined
                  }
                  lastRecord={answers.simulationRecords
                    ?.filter((r) => r.experimentId === e.id)
                    .at(-1)}
                />
                <div className="experiment-rows">
                  {e.rows.map((label, i) => (
                    <div className="experiment-row" key={i}>
                      <h4>
                        <span>{i + 1}</span>
                        {label}
                      </h4>
                      {answers.simulationRecords?.some(
                        (r) => r.experimentId === e.id && r.rowIndex === i,
                      ) && (
                        <p className="model-source">
                          Джерело: віртуальна лабораторія · дані моделі.
                          Розрахунки виконайте самостійно.
                        </p>
                      )}
                      <div className="measurement-grid">
                        {e.fields.map((f) => {
                          const row = answers.experiments?.[e.id]?.[i] ?? {};
                          const feedback =
                            feedbackMode === "PRACTICE"
                              ? fieldFeedback(f, row)
                              : null;
                          return (
                            <label
                              key={f.key}
                              className={f.calculated ? "calculated-field" : ""}
                            >
                              {f.label} {f.unit && <small>{f.unit}</small>}
                              {f.calculated && (
                                <span className="field-tag">розрахунок</span>
                              )}
                              <input
                                aria-label={`${e.title}, ${label}: ${f.label}`}
                                inputMode={
                                  f.type === "text" ? "text" : "decimal"
                                }
                                value={row[f.key] ?? ""}
                                disabled={readOnly}
                                maxLength={1000}
                                placeholder={
                                  f.calculated
                                    ? "Обчисліть самостійно"
                                    : "Введіть значення"
                                }
                                onChange={(ev) => {
                                  const rows = e.rows.map((_, j) => ({
                                    ...answers.experiments?.[e.id]?.[j],
                                  }));
                                  rows[i][f.key] = ev.target.value;
                                  change({
                                    ...answers,
                                    experiments: {
                                      ...answers.experiments,
                                      [e.id]: rows,
                                    },
                                  });
                                }}
                              />
                              {feedback && (
                                <small className="field-error">
                                  {feedback}
                                </small>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <ExperimentGraph
                  experiment={e}
                  rows={answers.experiments?.[e.id] ?? []}
                  axes={answers.graphAxes?.[e.id]}
                  readOnly={readOnly}
                  onChange={(axes) =>
                    change({
                      ...answers,
                      graphAxes: { ...answers.graphAxes, [e.id]: axes },
                    })
                  }
                />
                {(answers.simulationRecords ?? [])
                  .filter((r) => r.experimentId === e.id)
                  .map((r) => (
                    <details className="model-history" key={r.rowIndex}>
                      <summary>
                        Віртуальний дослід · {e.rows[r.rowIndex]} · модель v
                        {r.modelVersion}
                      </summary>
                      <p className="muted">
                        {new Date(r.recordedAt).toLocaleString("uk-UA", {
                          timeZone: "Europe/Kyiv",
                        })}
                        . Це покази під час перенесення; поточні клітинки учень
                        міг змінити вручну.
                      </p>
                      {number === 1 && (
                        <p className="muted">
                          {r.modelVersion === 2
                            ? "Умови: опір повітря; суцільна кулька, модель v2."
                            : "Умови: ідеальне кочення без опору, модель v1."}
                        </p>
                      )}
                      <dl className="model-parameters">
                        {simulationSetup(number, e.id)
                          .controls.filter(
                            (c) => r.parameters[c.key] !== undefined,
                          )
                          .map((c) => (
                            <div key={c.key}>
                              <dt>{c.label}</dt>
                              <dd>
                                {c.options
                                  ? c.options[r.parameters[c.key]]
                                  : `${r.parameters[c.key]} ${c.unit ?? ""}`}
                              </dd>
                            </div>
                          ))}
                      </dl>
                      <h4>Покази під час перенесення</h4>
                      <dl className="model-parameters">
                        {Object.entries(r.readings).map(([key, value]) => (
                          <div key={key}>
                            <dt>
                              {e.fields.find((f) => f.key === key)?.label ??
                                key}
                            </dt>
                            <dd>
                              {value}
                              {e.fields.find((f) => f.key === key)?.unit
                                ? " " +
                                  e.fields.find((f) => f.key === key)?.unit
                                : ""}
                              {answers.experiments?.[e.id]?.[r.rowIndex]?.[
                                key
                              ] !== value && (
                                <span className="field-error">
                                  Клітинку змінено після перенесення
                                </span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ))}
                {comments(e.id)}
              </section>
            ))}
          {number === 5 &&
            (shownSteps.includes(1) || shownSteps.includes(3)) && (
              <section className="panel no-print">
                <DensityReference />
              </section>
            )}
          {shownSteps.includes(1) && content.diagram && (
            <section className="panel">
              <h2>Схеми сил</h2>
              <p>
                Установіть співвідношення сил і зазначте, рухається тіло чи
                перебуває в рівновазі.
              </p>
              <ForceDiagram
                value={answers.diagram ?? emptyAnswers(content).diagram!}
                readOnly={readOnly}
                onChange={(diagram) => change({ ...answers, diagram })}
              />
              {comments("diagram")}
            </section>
          )}
          {shownSteps.includes(2) && (
            <section className="panel work-section">
              <div className="eyebrow">03 / ПОЯСНЕННЯ</div>
              <h2>Розуміти більше, ніж формулу</h2>
              {content.questions.map((q, i) => (
                <div key={i}>
                  <label className="question-label">
                    <span className="question-number">{i + 1}</span>
                    {questionFigure(number, q)
                      ? questionWithInlineFigure(q)
                      : q}
                  </label>
                  {questionFigure(number, q) &&
                    (number === 1 ? (
                      <SpeedTimeFigure />
                    ) : number === 4 ? (
                      <StonesFigure
                        ignoreBagMass={q.includes("масою мішечка знехтуй")}
                      />
                    ) : number === 5 ? (
                      <OilLabelFigure />
                    ) : number === 6 ? (
                      <StiffnessFigure />
                    ) : number === 10 ? (
                      <FloatingBodiesFigure />
                    ) : (
                      <QuestionFigure {...questionFigure(number, q)!} />
                    ))}
                  {number === 8 && /невагом/i.test(q) && (
                    <WeightlessnessFigure />
                  )}
                  <label className="answer-label">
                    Ваша відповідь на запитання {i + 1}
                    <textarea
                      rows={4}
                      value={answers.questions?.[i] ?? ""}
                      disabled={readOnly}
                      placeholder="Відповідь і пояснення…"
                      onChange={(e) => {
                        const questions = content.questions.map(
                          (_, j) => answers.questions?.[j] ?? "",
                        );
                        questions[i] = e.target.value;
                        change({ ...answers, questions });
                      }}
                    />
                  </label>
                  {comments("question-" + i)}
                </div>
              ))}
            </section>
          )}
          {shownSteps.includes(3) && (
            <section className="panel work-section">
              <div className="eyebrow">04 / ВИСНОВОК</div>
              <h2>Що вдалося з’ясувати?</h2>
              {conclusionLabels.map((q, i) => (
                <label className="question-label" key={q}>
                  {q}
                  <textarea
                    rows={3}
                    disabled={readOnly}
                    value={answers.conclusion?.[i] ?? ""}
                    onChange={(e) => {
                      const conclusion = conclusionLabels.map(
                        (_, j) => answers.conclusion?.[j] ?? "",
                      );
                      conclusion[i] = e.target.value;
                      change({ ...answers, conclusion });
                    }}
                  />
                </label>
              ))}
              {comments("conclusion")}
              <details className="creative">
                <summary>✦ Творче завдання · необов’язково</summary>
                <p>
                  {number === 1
                    ? rampCreativeInstruction(content.creative)
                    : content.creative}
                </p>
                <textarea
                  aria-label="Творче завдання"
                  rows={4}
                  disabled={readOnly}
                  value={answers.creative ?? ""}
                  onChange={(e) =>
                    change({ ...answers, creative: e.target.value })
                  }
                />
              </details>
            </section>
          )}
          {!reviewMode && (
            <div className="work-navigation no-print">
              <button
                className="button secondary"
                disabled={step === 0}
                onClick={() => goToStep(step - 1)}
              >
                <ArrowLeft size={16} />
                Назад
              </button>
              {step < 3 ? (
                <button
                  className="button primary"
                  onClick={() => goToStep(step + 1)}
                >
                  Далі
                  <ChevronRight size={17} />
                </button>
              ) : (
                !preview &&
                !archived && (
                  <button
                    className="button primary"
                    disabled={sending || conflict}
                    onClick={() => {
                      if (sandbox) {
                        const gaps = completeness(content, answers);
                        setMissing(gaps);
                        setState(
                          gaps.length
                            ? "Пробне проходження: заповніть пропущені поля"
                            : "Пробне проходження завершено · не збережено",
                        );
                      } else setConfirmSubmit(true);
                    }}
                  >
                    <Send size={17} />
                    {sandbox ? "Завершити пробне проходження" : "Здати роботу"}
                  </button>
                )
              )}
            </div>
          )}
          {confirmSubmit && (
            <div className="panel submit-confirm no-print">
              <h3>Надіслати роботу вчителю?</h3>
              <p>
                Після здавання відповіді будуть доступні для перегляду.
                Редагування відкриється після повернення на доопрацювання.
              </p>
              <div className="button-row">
                <button
                  className="button primary"
                  disabled={sending}
                  onClick={async () => {
                    setSending(true);
                    setMissing([]);
                    const ok = await save(true);
                    setSending(false);
                    if (ok) setConfirmSubmit(false);
                  }}
                >
                  {sending ? "Надсилається…" : "Підтвердити здавання"}
                </button>
                <button
                  className="button secondary"
                  onClick={() => setConfirmSubmit(false)}
                >
                  Продовжити редагування
                </button>
              </div>
            </div>
          )}
          {initial?.attempts && initial.attempts.length > 0 && (
            <details className="panel">
              <summary>Історія спроб · {initial.attempts.length}</summary>
              {initial.attempts.map((a, i) => (
                <div className="attempt" key={a.id}>
                  <strong>Спроба {i + 1}</strong>
                  <small>
                    {new Date(a.createdAt).toLocaleString("uk-UA", {
                      timeZone: "Europe/Kyiv",
                    })}
                  </small>
                  <p>
                    {a.score !== null
                      ? "Оцінка: " + a.score + "/12"
                      : "Без оцінки"}{" "}
                    · {a.feedback ?? "Очікує перевірки"}
                  </p>
                  {a.answers != null && (
                    <button
                      className="text-button"
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify(a.answers, null, 2)],
                          { type: "application/json" },
                        );
                        const el = document.createElement("a");
                        el.href = URL.createObjectURL(blob);
                        el.download = `lab-${number}-attempt-${i + 1}.json`;
                        el.click();
                        URL.revokeObjectURL(el.href);
                      }}
                    >
                      Завантажити відповіді цієї спроби
                    </button>
                  )}
                </div>
              ))}
            </details>
          )}
        </div>
        <aside className="work-aside no-print">
          <LabTools number={number} />
          {!preview && !sandbox && !archived && (
            <LearningJournal journal={learning} />
          )}
          <div className="panel">
            <span className="eyebrow">ВАШ МАРШРУТ</span>
            <h3>{steps[step]}</h3>
            <p className="muted">
              {preview && !initial
                ? "Навчальний шаблон · тільки перегляд."
                : sandbox
                  ? "Пробне проходження · без збереження."
                  : experimentMode === "SIMULATION"
                    ? "Режим: віртуальний експеримент (модель)."
                    : experimentMode === "DATA"
                      ? "Режим: аналіз наданих даних."
                      : "Режим: реальний експеримент."}
            </p>
            <p className="muted">
              {feedbackMode === "PRACTICE"
                ? "Підказки до обчислень увімкнено."
                : "Самостійна робота: перевірка обчислень відкриється після оцінювання."}
            </p>
            <details className="stage-reference" open>
              <summary>Формули та одиниці</summary>
              <p>{content.theory}</p>
            </details>
            <p className="muted">
              {
                [
                  "Прочитайте умови та запишіть власний прогноз.",
                  "Змінюйте одну величину за раз. Перевіряйте одиниці вимірювання.",
                  "Рисунки розміщено біля відповідних запитань. Пояснюйте відповідь.",
                  "Порівняйте результати з прогнозом і поясніть джерела похибок.",
                ][step]
              }
            </p>
            <a
              className="button secondary wide"
              target="_blank"
              rel="noreferrer"
              href={materialHref ?? `/originals/lab-${number}.pdf`}
            >
              {materialHref ? <BookOpen size={16} /> : <Download size={16} />}
              {materialHref ? "Вебпам’ятка до роботи" : "Оригінальний PDF"}
            </a>
          </div>
          {!readOnly && !sandbox && (
            <button
              className={"help-button " + (answers.help ? "requested" : "")}
              onClick={() => {
                if (!answers.help)
                  learning.emit({ kind: "HELP_REQUESTED", payload: {} });
                change({ ...answers, help: !answers.help });
              }}
            >
              <HelpCircle size={18} />
              {answers.help
                ? "Учитель бачить запит допомоги"
                : "Потрібна допомога"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
