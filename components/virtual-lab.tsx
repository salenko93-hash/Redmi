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
  MODEL_VERSION,
  simulate,
  simulationSetup,
  weights,
  type Parameters,
  type SimulationRecord,
  type SimulationResult,
} from "@/lib/simulation";
import type { Experiment } from "@/lib/types";

function Scene({
  number: n,
  experiment,
  parameters: p,
  result: r,
  phase,
}: {
  number: number;
  experiment: string;
  parameters: Parameters;
  result: SimulationResult;
  phase: number;
}) {
  const id = useId().replace(/:/g, "");
  const v = r.values;
  const ruler = (
    <g stroke="#b7c7b0">
      {Array.from({ length: 19 }, (_, i) => (
        <g key={i}>
          <line
            x1={60 + i * 25}
            x2={60 + i * 25}
            y1="270"
            y2={i % 2 ? 277 : 283}
          />
        </g>
      ))}
      <line x1="60" y1="270" x2="510" y2="270" />
    </g>
  );
  const cylinder = (x: number, level: number, label: string) => (
    <g>
      <path
        d={`M${x} 70V240Q${x + 38} 252 ${x + 76} 240V70`}
        fill="#fff8"
        stroke="#87a6ac"
        strokeWidth="3"
      />
      <rect
        x={x + 3}
        y={240 - level}
        width="70"
        height={level}
        fill="#b6d9df"
        opacity=".8"
      />
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={i}
          x1={x + 58}
          x2={x + 73}
          y1={85 + i * 23}
          y2={85 + i * 23}
          stroke="#5b8590"
        />
      ))}
      <text x={x + 38} y="270" textAnchor="middle">
        {label}
      </text>
    </g>
  );
  const spring = (x: number, y: number, length: number) => (
    <path
      d={`M${x} ${y}v8 ${Array.from({ length: 12 }, (_, i) => `l${i % 2 ? -16 : 16} ${length / 12}`).join(" ")} l8 5`}
      fill="none"
      stroke="#577f66"
      strokeWidth="3"
    />
  );
  return (
    <svg
      className="simulation-scene"
      viewBox="0 0 600 300"
      role="img"
      aria-label={`Віртуальний прилад лабораторної роботи ${n}. ${phase === 1 ? r.message : "Дослід у процесі підготовки або виконання."}`}
    >
      <defs>
        <pattern id={id} width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M25 0H0V25" fill="none" stroke="#dde8d7" strokeWidth=".7" />
        </pattern>
      </defs>
      <rect width="600" height="300" rx="16" fill="#f2f7ed" />
      <rect width="600" height="300" fill={`url(#${id})`} />
      {n === 1 &&
        (() => {
          const y1 = 65,
            y2 = 230,
            x = 80 + phase ** 2 * 420,
            y = y1 + phase ** 2 * (y2 - y1);
          return (
            <g>
              <path
                d={`M70 ${y1 + 16}L520 ${y2 + 16}L70 ${y2 + 16}Z`}
                fill="#dce5ce"
              />
              <line
                x1="70"
                y1={y1 + 16}
                x2="520"
                y2={y2 + 16}
                stroke="#8f9d73"
                strokeWidth="6"
              />
              <circle
                cx={x}
                cy={y}
                r="13"
                fill="#608372"
                stroke="#315a43"
                strokeWidth="2"
              />
              <rect
                x="520"
                y="213"
                width="15"
                height="38"
                rx="4"
                fill="#929e95"
              />
              <text x="90" y="35">
                Шлях: {p.distance} м · Нахил: {p.angle}°
              </text>
              {ruler}
            </g>
          );
        })()}
      {n === 2 && (
        <g>
          <ellipse
            cx="290"
            cy="150"
            rx="170"
            ry="105"
            fill="#e1ebd4"
            stroke="#9eb88e"
            strokeWidth="2"
          />
          <line
            x1="290"
            y1="150"
            x2={290 + 170 * Math.cos(phase * (v.cycles ?? 10) * 2 * Math.PI)}
            y2={150 + 105 * Math.sin(phase * (v.cycles ?? 10) * 2 * Math.PI)}
            stroke="#78976a"
            strokeWidth="2"
          />
          <circle
            cx={290 + 170 * Math.cos(phase * (v.cycles ?? 10) * 2 * Math.PI)}
            cy={150 + 105 * Math.sin(phase * (v.cycles ?? 10) * 2 * Math.PI)}
            r="13"
            fill="#426d53"
          />
          <circle cx="290" cy="150" r="5" fill="#78976a" />
          <text x="60" y="35">
            Повних обертів: {Math.floor(phase * p.cycles)}
          </text>
          <text x="60" y="277">
            Радіус: {p.radius} м
          </text>
        </g>
      )}
      {n === 3 &&
        (() => {
          const len = 95 + v.length * 100,
            angle =
              (v.amplitude / v.length) *
              Math.cos(phase * v.cycles * 2 * Math.PI),
            x = 300 + len * Math.sin(angle),
            y = 45 + len * Math.cos(angle);
          return (
            <g>
              <path
                d="M120 265H200V30H365"
                fill="none"
                stroke="#9caaa0"
                strokeWidth="9"
              />
              <path
                d={`M300 45V${45 + len}`}
                stroke="#a5b49e"
                strokeDasharray="5 5"
              />
              <line
                x1="300"
                y1="45"
                x2={x}
                y2={y}
                stroke="#6b7e6b"
                strokeWidth="2"
              />
              <circle
                cx={x}
                cy={y}
                r={9 + v.mass * 25}
                fill="#bc9d72"
                stroke="#8e7657"
              />
              <text x="350" y="65">
                l = {v.length} м
              </text>
              <text x="350" y="90">
                m = {v.mass} кг
              </text>
              <text x="350" y="115">
                A = {v.amplitude} м
              </text>
              <text x="350" y="255">
                Циклів: {Math.floor(phase * p.cycles)}
              </text>
            </g>
          );
        })()}
      {n === 4 &&
        (() => {
          const tilt = Math.max(-15, Math.min(15, -v.difference)),
            dy = Math.sin((tilt * Math.PI) / 180) * 160;
          return (
            <g>
              <path d="M230 260H370L310 230V120H290V230Z" fill="#95a89b" />
              <line
                x1="130"
                y1={120 - dy}
                x2="470"
                y2={120 + dy}
                stroke="#7f9180"
                strokeWidth="8"
              />
              <circle cx="300" cy="120" r="10" fill="#c3aa79" />
              <path
                d={`M130 ${120 - dy}l-55 95h110Z`}
                fill="none"
                stroke="#91a48a"
              />
              <path
                d={`M470 ${120 + dy}l-55 95h110Z`}
                fill="none"
                stroke="#91a48a"
              />
              <ellipse cx="130" cy={215 - dy} rx="56" ry="9" fill="#c5ac7b" />
              <ellipse cx="470" cy={215 + dy} rx="56" ry="9" fill="#c5ac7b" />
              <rect
                x="110"
                y={172 - dy}
                width="40"
                height="33"
                rx="7"
                fill="#7e9b93"
              />
              {weights
                .filter((w) => p[w.key] > 0)
                .map((w, i) => (
                  <rect
                    key={w.key}
                    x={435 + (i % 4) * 17}
                    y={193 + dy - Math.floor(i / 4) * 17}
                    width="14"
                    height="15"
                    rx="3"
                    fill="#75816f"
                  />
                ))}
              <text x="300" y="35" textAnchor="middle">
                {r.message}
              </text>
              <text x="130" y="285" textAnchor="middle">
                Досліджуване тіло
              </text>
              <text x="470" y="285" textAnchor="middle">
                Набір важків
              </text>
            </g>
          );
        })()}
      {n === 5 &&
        (experiment === "regular" ? (
          <g>
            <path
              d="M190 115l145-40 90 55-145 40Z"
              fill="#d8c59c"
              stroke="#96805a"
            />
            <path d="M190 115v95l90 45v-85Z" fill="#b49b72" stroke="#96805a" />
            <path
              d="M280 170l145-40v95l-145 30Z"
              fill="#c6b087"
              stroke="#96805a"
            />
            <text x="65" y="40">
              Терези: {Number(v.m).toFixed(2)} г
            </text>
            <text x="65" y="70">
              Лінійка: {p.l} × {p.d} × {p.h} см
            </text>
            {ruler}
          </g>
        ) : experiment === "irregular" ? (
          <g>
            {cylinder(120, (v.V1 ?? 100) * 0.65, "До занурення")}
            {cylinder(
              360,
              ((v.V1 ?? 100) + phase * (v.V ?? 20)) * 0.65,
              "Після занурення",
            )}
            <path
              d={`M390 ${40 + phase * 150}l22 8 5 28-15 15-24-9-4-25Z`}
              fill="#8b9b8b"
            />
            <text x="70" y="35">
              Маса зразка: {Number(v.m).toFixed(2)} г
            </text>
          </g>
        ) : (
          <g>
            {cylinder(250, phase * (v.V ?? 100), "Мірна посудина")}
            <text x="60" y="35">
              Порожня посудина: {v.m1} г
            </text>
            <text x="60" y="60">
              Із рідиною: {Number(v.m1 + phase * (v.m2 - v.m1)).toFixed(2)} г
            </text>
          </g>
        ))}
      {n === 6 && (
        <g>
          <path
            d="M90 270H170V30H335"
            fill="none"
            stroke="#99a99a"
            strokeWidth="9"
          />
          {spring(300, 38, 70 + phase * v.x * 500)}
          <rect
            x="277"
            y={130 + phase * v.x * 500}
            width="54"
            height="45"
            rx="6"
            fill="#af9c79"
          />
          <text x="365" y="80">
            m = {p.mass} г
          </text>
          <text x="365" y="110">
            F = {v.F.toFixed(2)} Н
          </text>
          <text x="365" y="140">
            l₀ = {p.initial} см
          </text>
          <path d="M220 40V265" stroke="#bbcab1" strokeWidth="2" />
          {Array.from({ length: 15 }, (_, i) => (
            <line
              key={i}
              x1="215"
              x2={i % 2 ? 230 : 235}
              y1={45 + i * 14}
              y2={45 + i * 14}
              stroke="#9eb18f"
            />
          ))}
        </g>
      )}
      {n === 7 && (
        <g>
          <rect x="40" y="220" width="520" height="15" rx="3" fill="#b9a57a" />
          <g transform={`translate(${60 + phase * 240} 0)`}>
            <rect
              x="0"
              y={p.side === 0 ? 170 : 130}
              width={p.side === 0 ? 100 : 60}
              height={p.side === 0 ? 50 : 90}
              fill="#cfbb90"
              stroke="#9b865b"
            />
            {Array.from({ length: p.loads }, (_, i) => (
              <rect
                key={i}
                x="15"
                y={(p.side === 0 ? 150 : 110) - i * 18}
                width="30"
                height="17"
                fill="#81988b"
              />
            ))}
            <line
              x1="100"
              y1="190"
              x2="180"
              y2="190"
              stroke="#617c65"
              strokeWidth="3"
            />
            <rect
              x="180"
              y="174"
              width="85"
              height="32"
              rx="8"
              fill="#fff"
              stroke="#739477"
            />
            <text x="222" y="195" textAnchor="middle">
              {v.F.toFixed(2)} Н
            </text>
          </g>
          <text x="60" y="40">
            Рівномірне ковзання →
          </text>
          <text x="60" y="70">
            Сила реакції опори: {v.N.toFixed(2)} Н
          </text>
        </g>
      )}
      {n === 8 && (
        <g>
          <rect x="65" y="237" width="470" height="18" rx="5" fill="#d6e1cb" />
          <rect
            x={300 - Math.max(35, v.a * 1000) / 2}
            y={237 - Math.max(40, v.b * 3000)}
            width={Math.max(35, v.a * 1000)}
            height={Math.max(40, v.b * 3000)}
            fill="#cdb58b"
            stroke="#988054"
          />
          {Array.from({ length: v.loads }, (_, i) => (
            <rect
              key={i}
              x="285"
              y={220 - Math.max(40, v.b * 3000) - i * 18}
              width="30"
              height="17"
              fill="#7a9688"
            />
          ))}
          <line
            x1="300"
            y1="250"
            x2="300"
            y2="277"
            stroke="#a48d61"
            strokeWidth="3"
          />
          <text x="55" y="35">
            Сила тиску: {v.F.toFixed(2)} Н
          </text>
          <text x="55" y="60">
            Грань: {v.a} × {v.b} м
          </text>
          <text x="345" y="270">
            Опора
          </text>
        </g>
      )}
      {n === 9 && (
        <g>
          <rect
            x="290"
            y="125"
            width="225"
            height="135"
            rx="8"
            fill="#c5e2e5"
          />
          <path
            d="M290 115v145h225V115"
            fill="none"
            stroke="#8da9ab"
            strokeWidth="3"
          />
          {[150, 400].map((x, i) => (
            <g key={x}>
              <rect
                x={x - 30}
                y="30"
                width="60"
                height="90"
                rx="12"
                fill="#fff"
                stroke="#91ad94"
              />
              {spring(x, 40, 30)}
              <line
                x1={x}
                y1="120"
                x2={x}
                y2={i ? 75 + phase * 90 : 180}
                stroke="#75927b"
              />
              <rect
                x={x - 22}
                y={i ? 75 + phase * 90 : 180}
                width="44"
                height="45"
                rx="6"
                fill="#a5afa7"
              />
              <text x={x} y="108" textAnchor="middle">
                {(i ? v.P1 - phase * (v.P1 - v.P2) : v.P1).toFixed(3)} Н
              </text>
            </g>
          ))}
          <text x="150" y="285" textAnchor="middle">
            У повітрі
          </text>
          <text x="400" y="285" textAnchor="middle">
            Повністю у воді
          </text>
        </g>
      )}
      {n === 10 &&
        (() => {
          const y =
            v.state > 0
              ? 80 + phase * 120
              : v.state === 0
                ? 130
                : 130 + phase * (85 - 65 * (1 - v.fraction) - 130);
          return (
            <g>
              <rect x="170" y="85" width="260" height="180" fill="#bfdfe3" />
              <path
                d="M170 55V265H430V55"
                stroke="#8ca6ac"
                strokeWidth="4"
                fill="none"
              />
              <rect
                x="278"
                y={y}
                width="44"
                height="65"
                rx="15"
                fill="#f5f3dd"
                stroke="#8da390"
              />
              <rect
                x="282"
                y={y + 37}
                width="36"
                height="22"
                rx="7"
                fill="#c6b180"
              />
              <rect
                x="281"
                y={y - 2}
                width="38"
                height="9"
                rx="3"
                fill="#9c9476"
              />
              <text x="50" y="35">
                Маса з піском: {20 + p.sand} г · Об’єм: {p.volume} см³
              </text>
              <text x="300" y="288" textAnchor="middle">
                {phase === 1
                  ? r.message
                  : "Спостерігайте за поведінкою пробірки"}
              </text>
            </g>
          );
        })()}
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
  const [parameters, setParameters] = useState<Parameters>(
    lastRecord?.parameters ?? initialParameters(number, experiment.id),
  );
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
    const milliseconds = Math.min(6, Math.max(1, result.duration)) * 1000;
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
  }, [running, result.duration]);
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
      modelVersion: MODEL_VERSION,
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
        <div className="virtual-instrument">
          <Scene
            number={number}
            experiment={experiment.id}
            parameters={parameters}
            result={result}
            phase={phase}
          />
          <div className="virtual-controls">
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
