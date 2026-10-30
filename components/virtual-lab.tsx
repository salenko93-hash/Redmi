"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { SimulationControl } from "./simulation-control";
import { ManualStopwatch, useManualStopwatch } from "./manual-stopwatch";
import { usesManualTiming } from "@/lib/experiment-timing";
import type { LearningAction } from "@/lib/learning-progress";
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  ArrowDownToLine,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  initialParameters,
  simulate,
  simulationSetup,
  weights,
  type Parameters,
  type SimulationRecord,
  type SimulationResult,
} from "@/lib/simulation";
import type { Experiment } from "@/lib/types";
import { rotationGeometry, type RotationView } from "@/lib/rotation-view";
import { pendulumGeometry } from "@/lib/pendulum-view";
import { RampViewport } from "./ramp-viewport";
import { RotationScene } from "./rotation-scene";
import { PendulumScene } from "./pendulum-scene";
import { BalanceScene } from "./balance-scene";
import { DensityScene } from "./density-scene";
import { DensityReadouts } from "./density-readouts";
import { densitySceneHeight } from "@/lib/density-view";
import { advanceSimulationClock } from "@/lib/simulation-time";
import { ElasticScene } from "./elastic-scene";
import { ElasticReadouts } from "./elastic-readouts";
import { ELASTIC_SCENE_HEIGHT, elasticTransition } from "@/lib/elastic-view";
import { FrictionScene } from "./friction-scene";
import { FrictionReadouts } from "./friction-readouts";
import { FRICTION_SCENE_HEIGHT } from "@/lib/friction-view";
import { PressureScene } from "./pressure-scene";
import { PressureReadouts } from "./pressure-readouts";
import { PRESSURE_SCENE_HEIGHT } from "@/lib/pressure-view";
import { HydroScene } from "./hydro-scene";
import { HydroReadouts } from "./hydro-readouts";
import { HYDRO_SCENE_HEIGHT } from "@/lib/hydro-view";
import { FloatingScene } from "./floating-scene";
import { FloatingReadouts } from "./floating-readouts";
import {
  FLOATING_SCENE_HEIGHT,
  floatingSandCapacity,
} from "@/lib/floating-view";

function Scene({
  number: n,
  experiment,
  parameters: p,
  result: r,
  phase,
  rotationView,
  elasticStart,
}: {
  number: number;
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  rotationView: RotationView;
  elasticStart: number;
}) {
  const id = useId().replace(/:/g, "");
  const v = r.values;
  if (n === 1)
    return (
      <RampViewport
        distance={p.distance}
        angle={p.angle}
        diameter={p.diameter}
        material={p.material}
        airResistance={p.airResistance ?? 0}
        phase={phase}
        id={id}
        label={`Віртуальний прилад лабораторної роботи 1. ${phase === 1 ? r.message : "Дослід у процесі підготовки або виконання."}`}
      />
    );
  const sceneHeight =
    n === 2
      ? 460
      : n === 3
        ? 500
        : n === 4
          ? 450
          : n === 5
            ? densitySceneHeight(experiment)
            : n === 6
              ? ELASTIC_SCENE_HEIGHT
              : n === 7
                ? FRICTION_SCENE_HEIGHT
                : n === 8
                  ? PRESSURE_SCENE_HEIGHT
                  : n === 9
                    ? HYDRO_SCENE_HEIGHT
                    : FLOATING_SCENE_HEIGHT;
  return (
    <svg
      className="simulation-scene"
      viewBox={`0 0 600 ${sceneHeight}`}
      role="img"
      aria-label={`Віртуальний прилад лабораторної роботи ${n}. ${phase === 1 ? r.message : "Дослід у процесі підготовки або виконання."}`}
    >
      <defs>
        <pattern id={id} width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M25 0H0V25" fill="none" stroke="#dde8d7" strokeWidth=".7" />
        </pattern>
      </defs>
      <rect width="600" height={sceneHeight} rx="16" fill="#f2f7ed" />
      <rect width="600" height={sceneHeight} fill={`url(#${id})`} />
      {n === 2 && (
        <RotationScene
          radius={p.radius}
          cycles={p.cycles}
          phase={phase}
          elapsed={v.t * phase}
          id={id}
          view={rotationView}
        />
      )}
      {n === 3 && (
        <PendulumScene
          series={experiment}
          length={v.length}
          amplitude={v.amplitude}
          mass={v.mass}
          cycles={p.cycles}
          phase={phase}
          elapsed={v.t * phase}
          id={id}
        />
      )}
      {n === 4 && (
        <BalanceScene
          objectIndex={p.object}
          difference={v.difference}
          leftLabel={r.readings.object}
          loads={weights
            .filter((w) => p[w.key] > 0)
            .map((w) => ({ key: w.key, label: w.label, count: p[w.key] }))}
          status={r.message}
          id={id}
        />
      )}
      {n === 5 && (
        <DensityScene
          id={id + "-density"}
          experiment={experiment}
          parameters={p}
          result={r}
          phase={phase}
        />
      )}
      {n === 6 && (
        <ElasticScene
          id={id + "-elastic"}
          parameters={p}
          result={r}
          phase={phase}
          startExtension={elasticStart}
        />
      )}
      {n === 7 && (
        <FrictionScene parameters={p} result={r} phase={phase} id={id} />
      )}
      {n === 8 && (
        <PressureScene
          experiment={experiment}
          parameters={p}
          result={r}
          phase={phase}
          id={id}
        />
      )}
      {n === 9 && (
        <HydroScene parameters={p} result={r} phase={phase} id={id} />
      )}
      {n === 10 && (
        <FloatingScene parameters={p} result={r} phase={phase} id={id} />
      )}
    </svg>
  );
}
export function VirtualLab({
  number,
  experiment,
  allowTransfer,
  onRecord,
  lastRecord,
  onLearningAction,
  measurements,
}: {
  number: number;
  experiment: Experiment;
  allowTransfer: boolean;
  onRecord?: (record: SimulationRecord) => void;
  lastRecord?: SimulationRecord;
  onLearningAction?: (event: LearningAction) => void;
  measurements?: ReactNode;
}) {
  const setup = simulationSetup(number, experiment.id);
  const timed = usesManualTiming(number);
  const stopwatch = useManualStopwatch();
  const [parameters, setParameters] = useState<Parameters>(() => ({
    ...initialParameters(number, experiment.id),
    ...lastRecord?.parameters,
    ...(number === 1 && lastRecord
      ? { airResistance: lastRecord.parameters.airResistance ?? 0 }
      : {}),
  }));
  const [rotationView, setRotationView] = useState<RotationView>("perspective");
  const [elasticStart, setElasticStart] = useState(0);
  const [row, setRow] = useState(lastRecord?.rowIndex ?? 0),
    [simulationPhase, setPhase] = useState(0),
    [simulationRunning, setRunning] = useState(false),
    [recorded, setRecorded] = useState(false),
    [replace, setReplace] = useState(false);
  const result = useMemo(
    () => simulate(number, experiment.id, parameters),
    [number, experiment.id, parameters],
  );
  const phase = timed
    ? Math.min(1, stopwatch.elapsed / (result.duration * 1000))
    : simulationPhase;
  const running = timed ? stopwatch.running && phase < 1 : simulationRunning;
  const runCompleted = useRef(false);
  const actionRef = useRef(onLearningAction);
  actionRef.current = onLearningAction;
  useEffect(() => {
    if (!timed || phase < 1 || runCompleted.current) return;
    runCompleted.current = true;
    actionRef.current?.({
      kind: "RUN_COMPLETED",
      experimentId: experiment.id,
      payload: { parameters: { ...parameters } },
    });
  }, [timed, phase, experiment.id, parameters]);
  const [expanded, setExpanded] = useState(false);
  const [labOpen, setLabOpen] = useState(true);
  const expandButton = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  useEffect(() => {
    if (!expanded) {
      if (wasExpanded.current) expandButton.current?.focus();
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);
  const phaseRef = useRef(0);
  useEffect(() => {
    if (timed || !running) return;
    let frame = 0,
      last = performance.now();
    const milliseconds = Math.min(6, Math.max(1, result.duration)) * 1000;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tick = (now: number) => {
      const next = advanceSimulationClock(
        phaseRef.current,
        last,
        now,
        milliseconds,
      );
      phaseRef.current = next.phase;
      last = next.last;
      if (reduced) {
        phaseRef.current = 1;
      }
      setPhase(phaseRef.current);
      if (phaseRef.current < 1) frame = requestAnimationFrame(tick);
      else {
        setRunning(false);
        actionRef.current?.({
          kind: "RUN_COMPLETED",
          experimentId: experiment.id,
          payload: { parameters: { ...parameters } },
        });
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, result.duration, timed]);
  function reset() {
    if (timed) {
      stopwatch.reset();
      runCompleted.current = false;
    }
    setElasticStart(0);
    setRunning(false);
    phaseRef.current = 0;
    setPhase(0);
    setRecorded(false);
    setReplace(false);
  }
  function adjust(key: string, value: number) {
    const previousExtension =
      number === 6
        ? elasticTransition(elasticStart, result.values.x, phase)
        : 0;
    reset();
    if (number === 6 && key === "mass") setElasticStart(previousExtension);
    setParameters((p) => {
      const next = { ...p, [key]: value };
      if (number === 10)
        next.sand = Math.min(next.sand, floatingSandCapacity(next.volume));
      return next;
    });
  }
  function record() {
    onLearningAction?.({
      kind: "READING_RECORDED",
      experimentId: experiment.id,
      payload: {},
    });
    const readings = Object.fromEntries(
      experiment.fields
        .filter((f) => !f.calculated && result.readings[f.key] !== undefined)
        .map((f) => [f.key, result.readings[f.key]]),
    );
    onRecord?.({
      modelVersion: result.modelVersion,
      labNumber: number,
      experimentId: experiment.id,
      rowIndex: row,
      parameters: { ...parameters },
      readings,
      recordedAt: new Date().toISOString(),
    });
    setRecorded(true);
    setReplace(false);
  }
  const transfer = (
    <>
      <div className="virtual-transfer">
        {timed && (
          <p className="muted">
            {number === 1
              ? "Переноситься лише шлях."
              : "Переносяться умови та кількість циклів."}{" "}
            Час введіть вручну.
          </p>
        )}
        {allowTransfer && (
          <label>
            Рядок таблиці
            <select
              aria-label={`Рядок для ${experiment.title}`}
              value={row}
              onChange={(e) => {
                setRow(Number(e.target.value));
                setRecorded(false);
                setReplace(false);
              }}
            >
              {experiment.rows.map((r, i) => (
                <option key={i} value={i}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="button secondary"
          disabled={
            !allowTransfer ||
            phase !== 1 ||
            !result.canRecord ||
            recorded ||
            (timed && stopwatch.running)
          }
          onClick={() => setReplace(true)}
        >
          {recorded ? <Check size={16} /> : <ArrowDownToLine size={16} />}{" "}
          {recorded ? "Покази перенесено" : "Перенести покази в таблицю"}
        </button>
      </div>
      {replace && (
        <div className="notice">
          <p>
            {timed ? (
              <>
                Перенести {number === 1 ? "шлях" : "покази без часу"} у «
                {experiment.rows[row]}»? Введений вами час залишиться без змін.
                Попередні розрахунки буде очищено.
              </>
            ) : (
              <>
                Перенести покази в «{experiment.rows[row]}»? Поточні вимірювання
                цього рядка буде замінено, а попередні розрахунки очищено.
              </>
            )}
          </p>
          <div className="button-row">
            <button type="button" className="button primary" onClick={record}>
              Підтвердити перенесення
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setReplace(false)}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </>
  );
  const settings = (
    <div className="virtual-settings">
      {number === 2 && (
        <div
          className="rotation-view-controls"
          role="group"
          aria-label="Вигляд установки"
        >
          <button
            type="button"
            className={`button ${rotationView === "perspective" ? "primary" : "secondary"}`}
            aria-pressed={rotationView === "perspective"}
            onClick={() => setRotationView("perspective")}
          >
            Об’ємний вигляд
          </button>
          <button
            type="button"
            className={`button ${rotationView === "top" ? "primary" : "secondary"}`}
            aria-pressed={rotationView === "top"}
            onClick={() => setRotationView("top")}
          >
            Вигляд зверху
          </button>
        </div>
      )}
      <h4>Параметри досліду</h4>
      <div
        className={`virtual-controls${number === 1 ? " ramp-controls" : ""}`}
      >
        {setup.controls
          .filter((c) => number !== 4 || c.key === "object")
          .map((c) => (
            <SimulationControl
              key={c.key}
              label={c.label}
              value={parameters[c.key]}
              min={c.min}
              max={
                number === 10 && c.key === "sand"
                  ? floatingSandCapacity(parameters.volume)
                  : c.max
              }
              step={c.step}
              unit={c.unit}
              options={c.options}
              disabled={timed ? stopwatch.running : running}
              onChange={(value) => adjust(c.key, value)}
            />
          ))}
        {number === 4 && (
          <div className="weight-set">
            {weights.map((w) => (
              <div key={w.key}>
                <span>{w.label}</span>
                <button
                  type="button"
                  disabled={running || !parameters[w.key]}
                  aria-label={`Забрати ${w.label}`}
                  onClick={() => adjust(w.key, parameters[w.key] - 1)}
                >
                  −
                </button>
                <strong>{parameters[w.key]}</strong>
                <button
                  type="button"
                  disabled={running || parameters[w.key] >= 10}
                  aria-label={`Додати ${w.label}`}
                  onClick={() => adjust(w.key, parameters[w.key] + 1)}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  const instrument = (
    <div className="virtual-instrument shared-experiment-workspace">
      <div className="virtual-layout">
        <div className="virtual-stage">
          <Scene
            number={number}
            experiment={experiment.id}
            parameters={parameters}
            result={result}
            phase={phase}
            rotationView={rotationView}
            elasticStart={elasticStart}
          />
        </div>
        <section
          className={`virtual-control-panel${timed ? " ramp-control-panel" : ""}`}
          aria-label="Керування дослідом"
        >
          <h4>Керування дослідом</h4>
          <div
            className="virtual-toolbar"
            role="group"
            aria-label="Керування дослідом"
          >
            {!timed && (
              <>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    onLearningAction?.({
                      kind: running ? "RUN_PAUSED" : "RUN_STARTED",
                      experimentId: experiment.id,
                      payload: {},
                    });
                    setRecorded(false);
                    if (phase >= 1) {
                      phaseRef.current = 0;
                      setPhase(0);
                    }
                    setRunning(!running);
                  }}
                >
                  {running ? <Pause size={16} /> : <Play size={16} />}{" "}
                  {running
                    ? "Пауза"
                    : phase > 0 && phase < 1
                      ? "Продовжити"
                      : "Запустити дослід"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    onLearningAction?.({
                      kind: "RESET",
                      experimentId: experiment.id,
                      payload: {},
                    });
                    reset();
                  }}
                  aria-label="Скинути прилад"
                >
                  <RotateCcw size={16} />
                  Скинути
                </button>
              </>
            )}
            <span>
              {running
                ? "Спостерігайте…"
                : phase === 1
                  ? "Дослід завершено"
                  : phase > 0
                    ? "Дослід призупинено"
                    : "Готово до досліду"}
            </span>
            <button
              ref={expandButton}
              type="button"
              className="button secondary virtual-expand"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {expanded ? "Згорнути" : "Розгорнути"}
            </button>
            {timed && (
              <ManualStopwatch
                labNumber={number}
                clock={stopwatch}
                finished={phase >= 1}
                onStart={() => {
                  if (phase >= 1) reset();
                  setRecorded(false);
                  onLearningAction?.({
                    kind: "RUN_STARTED",
                    experimentId: experiment.id,
                    payload: {},
                  });
                  stopwatch.start();
                }}
                onStop={() => {
                  stopwatch.stop();
                  if (phase < 1)
                    onLearningAction?.({
                      kind: "RUN_PAUSED",
                      experimentId: experiment.id,
                      payload: {},
                    });
                }}
                onReset={() => {
                  onLearningAction?.({
                    kind: "RESET",
                    experimentId: experiment.id,
                    payload: {},
                  });
                  reset();
                }}
              />
            )}
          </div>
        </section>
      </div>
      {number === 5 && (
        <DensityReadouts
          experiment={experiment.id}
          readings={result.readings}
          phase={phase}
        />
      )}
      {number === 6 && (
        <ElasticReadouts
          readings={result.readings}
          phase={phase}
          message={result.message}
        />
      )}
      {number === 7 && (
        <FrictionReadouts
          readings={result.readings}
          phase={phase}
          message={result.message}
        />
      )}
      {number === 8 && (
        <PressureReadouts
          experiment={experiment.id}
          readings={result.readings}
          phase={phase}
        />
      )}
      {number === 9 && (
        <HydroReadouts readings={result.readings} phase={phase} />
      )}
      {number === 10 && (
        <FloatingReadouts
          readings={result.readings}
          phase={phase}
          message={result.message}
        />
      )}
      <div className="experiment-data-panel">
        <section
          className="experiment-settings-panel"
          aria-label="Параметри досліду"
        >
          {settings}
        </section>
        {transfer}
        {(expanded || (number === 1 && labOpen)) && measurements}
      </div>
    </div>
  );
  return (
    <>
      <details
        className="virtual-lab no-print"
        open={labOpen}
        onToggle={(event) => setLabOpen(event.currentTarget.open)}
      >
        <summary>
          <FlaskConical size={20} />
          <span>Віртуальна лабораторія</span>
          <span className="virtual-badge">МОДЕЛЬ</span>
        </summary>
        <div className="virtual-content">
          <p>{setup.instruction}</p>
          {expanded
            ? createPortal(
                <dialog
                  className={`experiment-dialog shared-experiment-dialog${number === 1 ? " ramp-experiment-dialog" : ""}`}
                  aria-label={`Керування дослідом: ${experiment.title}`}
                  ref={(node) => {
                    if (node && !node.open) node.showModal();
                  }}
                  onCancel={(event) => {
                    event.preventDefault();
                    setExpanded(false);
                  }}
                  onClose={() => setExpanded(false)}
                >
                  <h3 className="experiment-dialog-title">
                    {experiment.title}
                  </h3>
                  {instrument}
                </dialog>,
                document.body,
              )
            : instrument}
          {number === 2 && (
            <section
              className="rotation-readout"
              aria-label="Відлік руху по колу"
            >
              <dl>
                <div>
                  <dt>Час моделі</dt>
                  <dd>
                    <output aria-label="Час моделі" aria-live="off">
                      {(result.values.t * phase).toFixed(2).replace(".", ",")} с
                    </output>
                  </dd>
                </div>
                <div>
                  <dt>Повних обертів</dt>
                  <dd>
                    <output aria-label="Повних обертів" aria-live="off">
                      {
                        rotationGeometry(
                          parameters.radius,
                          parameters.cycles,
                          phase,
                          rotationView,
                        ).completed
                      }{" "}
                      / {parameters.cycles}
                    </output>
                  </dd>
                </div>
              </dl>
              <p>
                Об’ємний вигляд показує коло під кутом. Для перевірки радіуса
                оберіть вигляд зверху: його вимірюють від осі до центра кульки.
                Нитка показана у проєкції; її фізична довжина й натяг не
                розраховуються.
              </p>
            </section>
          )}
          {number === 3 && (
            <section className="pendulum-readout" aria-label="Покази маятника">
              <dl>
                <div>
                  <dt>Час моделі</dt>
                  <dd>
                    <output aria-label="Час маятника" aria-live="off">
                      {(result.values.t * phase).toFixed(2).replace(".", ",")} с
                    </output>
                  </dd>
                </div>
                <div>
                  <dt>Повних коливань</dt>
                  <dd>
                    <output aria-label="Лічильник маятника" aria-live="off">
                      {
                        pendulumGeometry(
                          result.values.length,
                          result.values.amplitude,
                          parameters.cycles,
                          phase,
                        ).completed
                      }{" "}
                      / {parameters.cycles}
                    </output>
                  </dd>
                </div>
              </dl>
              <p>
                Довжина — від підвісу до центра кульки в положенні рівноваги. На
                установці довжина й кут мають сталий масштаб; нижня шкала
                дугової координати збільшена окремо. Розмір кульки схематичний,
                зовнішній розмір змінних тягарців сталий. Відтворення 1×, без
                затухання; модель малих кутів.
              </p>
            </section>
          )}
          {number === 4 && (
            <section
              className="balance-selection"
              aria-label="Важки на правій шальці"
            >
              <div>
                <h4>На правій шальці</h4>
                <button
                  type="button"
                  className="button secondary"
                  disabled={
                    running || !weights.some((w) => parameters[w.key] > 0)
                  }
                  onClick={() => {
                    reset();
                    setParameters((p) => ({
                      ...p,
                      ...Object.fromEntries(weights.map((w) => [w.key, 0])),
                    }));
                  }}
                >
                  Прибрати всі важки
                </button>
              </div>
              <p role="status" className="balance-status">
                {result.message}
              </p>
              {weights.some((w) => parameters[w.key] > 0) ? (
                <ul>
                  {weights
                    .filter((w) => parameters[w.key] > 0)
                    .map((w) => (
                      <li key={w.key} data-selected-weight={w.key}>
                        {parameters[w.key]} × {w.label}
                      </li>
                    ))}
                </ul>
              ) : (
                <p>Шалька з важками порожня.</p>
              )}
              <p>
                Кількість кожного номіналу показана явно. Великі кількості на
                рисунку згруповано; повний склад наведено в цьому переліку.
                Після рівноваги суму мас обчисли самостійно.
              </p>
            </section>
          )}
          {number === 10 && (
            <p className="muted">
              Місткість: до {floatingSandCapacity(parameters.volume)} г піску
              для обраної пробірки. При зменшенні об’єму надлишок піску
              прибирається. Насипна густина — 1,6 г/см³; вільний об’єм — V − 10
              см³.
            </p>
          )}
          <p className="muted">
            {number === 10
              ? "Показано напрям руху, а не точний розрахунок часу. На дні з’являється реакція опори. "
              : number === 9
                ? "Показано повільне підняття посудини як послідовність рівноважних станів. Швидкість підйому не вимірюється. "
                : number === 8
                  ? "Відлік показує огляд розмірів нерухомого бруска, а не рух чи зміну сили. "
                  : timed
                    ? "Відтворення 1×: рух і відлік використовують фізичний час моделі. "
                    : "Анімацію може бути прискорено. Покази часу нижче — фізичний час моделі, а не тривалість анімації. "}
            {timed
              ? "Рух змодельовано. Ручне вимірювання залежить від реакції учня; модельний час — довідковий."
              : "Усі дані синтетичні; випадкова похибка не додається."}
          </p>
          {phase === 1 &&
            number !== 5 &&
            number !== 6 &&
            number !== 7 &&
            number !== 8 &&
            number !== 9 &&
            number !== 10 && (
              <div className="virtual-results">
                <h4>Покази приладів</h4>
                <dl>
                  {experiment.fields
                    .filter(
                      (f) =>
                        !f.calculated && result.readings[f.key] !== undefined,
                    )
                    .map((f) => (
                      <div key={f.key}>
                        <dt>
                          {timed && f.key === "t"
                            ? "Довідковий час моделі"
                            : f.label}
                          {f.unit ? ` (${f.unit})` : ""}
                        </dt>
                        <dd>{result.readings[f.key]}</dd>
                      </div>
                    ))}
                </dl>
                <p role="status">{result.message}</p>
              </div>
            )}
          {!allowTransfer && (
            <p className="muted">
              Тут можна тренуватися з приладом. Перенесення доступне в незданій
              роботі, яку вчитель призначив у режимі «Віртуальний експеримент».
            </p>
          )}
          <details className="virtual-assumptions">
            <summary>Фізична модель та її межі</summary>
            <p>{setup.assumption}</p>
            <p>
              Модель не підтверджує навички роботи з реальним обладнанням. Не
              підміняйте нею реальні вимірювання.
            </p>
          </details>
        </div>
      </details>
      {!expanded && measurements && (number !== 1 || !labOpen) && (
        <div className="measurements-below">{measurements}</div>
      )}
    </>
  );
}
