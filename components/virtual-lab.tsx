"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  ArrowDownToLine,
  Check,
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
import { rampMaterials } from "@/lib/ramp";
import { RampScene } from "./ramp-scene";
import { RotationScene } from "./rotation-scene";
import { PendulumScene } from "./pendulum-scene";
import { BalanceScene } from "./balance-scene";
import { DensityScene } from "./density-scene";
import { ElasticScene } from "./elastic-scene";
import { FrictionScene } from "./friction-scene";
import { PressureScene } from "./pressure-scene";
import { HydroScene } from "./hydro-scene";
import { FloatingScene } from "./floating-scene";

function Scene({
  number: n,
  experiment,
  parameters: p,
  result: r,
  phase,
  rotationView,
}: {
  number: number;
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
  rotationView: RotationView;
}) {
  const id = useId().replace(/:/g, "");
  const v = r.values;
  const sceneHeight =
    n === 1
      ? 410
      : n === 2
        ? 460
        : n === 3
          ? 440
          : n === 4
            ? 350
            : n === 5
              ? 400
              : n === 6
                ? 440
                : n === 7
                  ? 460
                  : n === 8
                    ? 470
                    : n === 9
                      ? 590
                      : 540;
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
      {n === 1 && (
        <RampScene
          distance={p.distance}
          angle={p.angle}
          material={p.material}
          airResistance={p.airResistance ?? 0}
          diameter={p.diameter}
          phase={phase}
          id={id}
        />
      )}
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
          experiment={experiment}
          parameters={p}
          result={r}
          phase={phase}
        />
      )}
      {n === 6 && <ElasticScene parameters={p} result={r} phase={phase} />}
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
      {n === 9 && <HydroScene parameters={p} result={r} phase={phase} />}
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
}: {
  number: number;
  experiment: Experiment;
  allowTransfer: boolean;
  onRecord?: (record: SimulationRecord) => void;
  lastRecord?: SimulationRecord;
}) {
  const setup = simulationSetup(number, experiment.id);
  const [parameters, setParameters] = useState<Parameters>(() => ({
    ...initialParameters(number, experiment.id),
    ...lastRecord?.parameters,
    ...(number === 1 && lastRecord
      ? { airResistance: lastRecord.parameters.airResistance ?? 0 }
      : {}),
  }));
  const [rotationView, setRotationView] = useState<RotationView>("perspective");
  const [row, setRow] = useState(lastRecord?.rowIndex ?? 0),
    [phase, setPhase] = useState(0),
    [running, setRunning] = useState(false),
    [recorded, setRecorded] = useState(false),
    [replace, setReplace] = useState(false);
  const result = useMemo(
    () => simulate(number, experiment.id, parameters),
    [number, experiment.id, parameters],
  );
  const phaseRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last = performance.now();
    const milliseconds =
      (number === 1
        ? result.duration
        : Math.min(number === 2 ? 15 : 6, Math.max(1, result.duration))) * 1000;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tick = (now: number) => {
      phaseRef.current = Math.min(
        1,
        phaseRef.current + (now - last) / milliseconds,
      );
      last = now;
      if (reduced) {
        phaseRef.current = 1;
      }
      setPhase(phaseRef.current);
      if (phaseRef.current < 1) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, result.duration, number]);
  function reset() {
    setRunning(false);
    phaseRef.current = 0;
    setPhase(0);
    setRecorded(false);
    setReplace(false);
  }
  function adjust(key: string, value: number) {
    reset();
    setParameters((p) => ({ ...p, [key]: value }));
  }
  function record() {
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
  return (
    <details className="virtual-lab no-print" open>
      <summary>
        <FlaskConical size={20} />
        <span>Віртуальна лабораторія</span>
        <span className="virtual-badge">МОДЕЛЬ</span>
      </summary>
      <div className="virtual-content">
        <p>{setup.instruction}</p>
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
        <div className="virtual-instrument">
          <Scene
            number={number}
            experiment={experiment.id}
            parameters={parameters}
            result={result}
            phase={phase}
            rotationView={rotationView}
          />
          <div className="virtual-toolbar">
            <button
              type="button"
              className="button primary"
              onClick={() => {
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
            <button type="button" className="button secondary" onClick={reset}>
              <RotateCcw size={16} />
              Скинути прилад
            </button>
            <span>
              {running
                ? "Спостерігайте…"
                : phase === 1
                  ? "Дослід завершено"
                  : "Готово до досліду"}
            </span>
          </div>
          <div
            className={`virtual-controls${number === 1 ? " ramp-controls" : ""}`}
          >
            {setup.controls
              .filter((c) => number !== 4 || c.key === "object")
              .map((c) => (
                <label key={c.key}>
                  {c.label}{" "}
                  <strong>
                    {c.options ? "" : `${parameters[c.key]} ${c.unit ?? ""}`}
                  </strong>
                  {c.options ? (
                    <select
                      aria-label={c.label}
                      disabled={running}
                      value={parameters[c.key]}
                      onChange={(e) => adjust(c.key, Number(e.target.value))}
                    >
                      {c.options.map((o, i) => (
                        <option key={o} value={i}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={c.label}
                      disabled={running}
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={parameters[c.key]}
                      onChange={(e) => adjust(c.key, Number(e.target.value))}
                    />
                  )}
                </label>
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
        {number === 1 && (
          <section
            className="ramp-ball-summary"
            aria-label="Властивості кульки"
          >
            <div>
              <strong>{rampMaterials[parameters.material].name}</strong>
              <p>Суцільна однорідна кулька</p>
            </div>
            <div className="ramp-time-readout">
              <span>
                {parameters.airResistance === 1
                  ? "У повітрі · модель v2"
                  : "Ідеальні умови · модель v1"}
              </span>
              <label>
                Час моделі{" "}
                <output aria-label="Час скочування" aria-live="off">
                  {(result.values.t * phase).toFixed(3).replace(".", ",")} с
                </output>
              </label>
            </div>
            <dl>
              <div>
                <dt>Діаметр</dt>
                <dd>{parameters.diameter} мм</dd>
              </div>
              <div>
                <dt>Маса кульки</dt>
                <dd>
                  <output
                    aria-label="Маса кульки"
                    data-mass-grams={result.values.mass * 1000}
                  >
                    {(result.values.mass * 1000).toLocaleString("uk-UA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    г
                  </output>
                </dd>
              </div>
              <div>
                <dt>Густина матеріалу</dt>
                <dd>{result.values.density.toLocaleString("uk-UA")} кг/м³</dd>
              </div>
            </dl>
            <p>
              m = ρ·π·d³/6. Подвоєння діаметра збільшує масу у 8 разів.
              {parameters.airResistance === 1
                ? " Опір повітря сильніше впливає на легшу пластмасову кульку: вона котиться дещо повільніше за сталеву такого самого діаметра. На короткому жолобі різниця невелика. Це модель лише опору повітря, а не всіх властивостей реального жолоба."
                : " В ідеальних умовах обидві суцільні кульки мають однаковий час кочення за сталих шляху й нахилу."}
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
              Кількість кожного номіналу показана явно. Після рівноваги суму мас
              обчисли самостійно.
            </p>
          </section>
        )}
        <p className="muted">
          Анімацію може бути прискорено. Покази часу нижче — фізичний час
          моделі, а не тривалість анімації. Усі дані синтетичні; випадкова
          похибка не додається.
        </p>
        {phase === 1 && (
          <div className="virtual-results">
            <h4>Покази приладів</h4>
            <dl>
              {experiment.fields
                .filter(
                  (f) => !f.calculated && result.readings[f.key] !== undefined,
                )
                .map((f) => (
                  <div key={f.key}>
                    <dt>
                      {f.label}
                      {f.unit ? ` (${f.unit})` : ""}
                    </dt>
                    <dd>{result.readings[f.key]}</dd>
                  </div>
                ))}
            </dl>
            <p role="status">{result.message}</p>
          </div>
        )}
        <div className="virtual-transfer">
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
          <button
            type="button"
            className="button secondary"
            disabled={
              !allowTransfer || phase !== 1 || !result.canRecord || recorded
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
              Перенести покази в «{experiment.rows[row]}»? Поточні вимірювання
              цього рядка буде замінено, а попередні розрахунки очищено.
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
  );
}
