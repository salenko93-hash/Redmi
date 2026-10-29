"use client";
import type { ReportData } from "@/lib/report-types";
import {
  questionFigure,
  questionWithInlineFigure,
} from "@/lib/question-figures";
import { rampCreativeInstruction } from "@/lib/lab-one-material";
import { simulationSetup } from "@/lib/simulation";
import { statuses } from "@/lib/submission-status";
import { ExperimentGraph } from "./graph";
import { ForceDiagram } from "./force-diagram";
import { SpeedTimeFigure } from "./speed-time-figure";
import { StonesFigure } from "./stones-figure";
import { OilLabelFigure } from "./oil-label-figure";
import { StiffnessFigure } from "./stiffness-figure";
import { FloatingBodiesFigure } from "./floating-bodies-figure";
import { WeightlessnessFigure } from "./weightlessness-figure";

const conclusionLabels = [
  "Що досліджували та як?",
  "Які результати отримали? Наведіть числові значення.",
  "Чи підтвердився прогноз? Поясніть відмінності.",
  "Що вплинуло на точність і як покращити дослід?",
];
const value = (text?: string | null) => (text?.trim() ? text : "—");

/** A complete static report, independent of the current worksheet step or textarea height. */
export function ReportDocument({ data }: { data: ReportData }) {
  const { meta, number, content, answers } = data;
  const comments = (field: string) =>
    data.comments
      .filter((c) => c.field === field)
      .map((c) => (
        <p className="report-comment" key={c.id}>
          <strong>Коментар учителя: </strong>
          {c.body}
        </p>
      ));
  return (
    <article className="report-document">
      <header>
        <p>ФізЛаб · Лабораторна робота № {number}</p>
        <h1>{meta.title}</h1>
        <p>
          <strong>Учень / учениця: </strong>
          {meta.studentName ?? "Не зазначено"}
          <br />
          <strong>Клас: </strong>
          {meta.classroom ?? "Не зазначено"}
        </p>
        <p>
          <strong>Статус: </strong>
          {statuses[data.status as keyof typeof statuses] ?? data.status}.
          Експорт поточних відповідей.
        </p>
        <p>
          <strong>Режим: </strong>
          {data.experimentMode === "SIMULATION"
            ? "Віртуальний експеримент · модельні дані"
            : data.experimentMode === "DATA"
              ? "Аналіз наданих даних"
              : data.experimentMode === "REAL"
                ? "Реальний експеримент"
                : "Навчальний шаблон / тренування"}
        </p>
        {data.score !== null && (
          <p>
            <strong>Оцінка: </strong>
            {data.score}/12
          </p>
        )}
        {data.feedback && (
          <p>
            <strong>Відгук учителя: </strong>
            {data.feedback}
          </p>
        )}
      </header>
      <section>
        <h2>1. Підготовка</h2>
        <h3>Мета дослідження</h3>
        <p>{content.purpose}</p>
        <h3>Обладнання</h3>
        <p>{content.equipment.join("; ")}</p>
        <h3>Теорія</h3>
        <p>{content.theory}</p>
        <h3>Умови та методичні уточнення</h3>
        <ul>
          {content.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
        <h3>Мій прогноз</h3>
        <p>{content.prediction}</p>
        <p className="report-answer">{value(answers.prediction)}</p>
        {comments("prediction")}
        {data.experimentMode === "DATA" && (
          <>
            <h3>Джерело даних</h3>
            <p>{value(answers.source)}</p>
          </>
        )}
      </section>
      <section>
        <h2>2. Експеримент</h2>
        {content.experiments.map((experiment) => (
          <section key={experiment.id}>
            <h3>{experiment.title}</h3>
            <ol>
              {experiment.instructions.map((instruction, i) => (
                <li key={i}>{instruction}</li>
              ))}
            </ol>
            <table>
              <thead>
                <tr>
                  <th>Дослід</th>
                  {experiment.fields.map((field) => (
                    <th key={field.key}>
                      {field.label}
                      {field.unit ? `, ${field.unit}` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiment.rows.map((row, i) => (
                  <tr key={i}>
                    <th>{row}</th>
                    {experiment.fields.map((field) => (
                      <td key={field.key}>
                        {value(
                          answers.experiments?.[experiment.id]?.[i]?.[
                            field.key
                          ],
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {experiment.graph && (
              <ExperimentGraph
                experiment={experiment}
                rows={answers.experiments?.[experiment.id] ?? []}
                axes={answers.graphAxes?.[experiment.id]}
                readOnly
              />
            )}
            {(answers.simulationRecords ?? [])
              .filter((record) => record.experimentId === experiment.id)
              .map((record) => (
                <div key={record.rowIndex}>
                  <h4>
                    Віртуальний дослід · {experiment.rows[record.rowIndex]} ·
                    модель v{record.modelVersion}
                  </h4>
                  <p>
                    Синтетичні покази під час перенесення у звіт; поточні
                    клітинки можуть відрізнятися.
                  </p>
                  <ul>
                    {simulationSetup(number, experiment.id)
                      .controls.filter(
                        (c) => record.parameters[c.key] !== undefined,
                      )
                      .map((c) => (
                        <li key={c.key}>
                          {c.label}:{" "}
                          {c.options
                            ? c.options[record.parameters[c.key]]
                            : `${record.parameters[c.key]} ${c.unit ?? ""}`}
                        </li>
                      ))}
                  </ul>
                  <p>
                    {Object.entries(record.readings)
                      .map(
                        ([key, text]) =>
                          `${experiment.fields.find((f) => f.key === key)?.label ?? key}: ${text} ${experiment.fields.find((f) => f.key === key)?.unit ?? ""}`,
                      )
                      .join("; ")}
                  </p>
                </div>
              ))}
            {comments(experiment.id)}
          </section>
        ))}
      </section>
      {content.diagram && (
        <section>
          <h3>Схеми сил</h3>
          <ForceDiagram
            value={
              answers.diagram ??
              Array.from({ length: 3 }, () => ({
                gravity: 0,
                buoyancy: 0,
                support: 0,
                state: "",
              }))
            }
            readOnly
          />
          <table>
            <thead>
              <tr>
                <th>Схема</th>
                <th>Сила тяжіння, ум. од.</th>
                <th>Сила Архімеда, ум. од.</th>
                <th>Реакція опори, ум. од.</th>
                <th>Стан тіла</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }, (_, i) => {
                const d = answers.diagram?.[i];
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{d?.gravity ?? 0}</td>
                    <td>{d?.buoyancy ?? 0}</td>
                    <td>{d?.support ?? 0}</td>
                    <td>{value(d?.state)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {comments("diagram")}
        </section>
      )}
      <section>
        <h2>3. Контрольні запитання</h2>
        {content.questions.map((question, i) => {
          const figure = questionFigure(number, question);
          return (
            <section key={i}>
              <h3>Запитання {i + 1}</h3>
              <p>{figure ? questionWithInlineFigure(question) : question}</p>
              {figure &&
                (number === 1 ? (
                  <SpeedTimeFigure />
                ) : number === 4 ? (
                  <StonesFigure ignoreBagMass />
                ) : number === 5 ? (
                  <OilLabelFigure />
                ) : number === 6 ? (
                  <StiffnessFigure />
                ) : number === 10 ? (
                  <FloatingBodiesFigure />
                ) : (
                  <img src={figure.src} alt={figure.alt} />
                ))}
              {number === 8 && /невагом/i.test(question) && (
                <WeightlessnessFigure />
              )}
              <p>
                <strong>Відповідь: </strong>
              </p>
              <p className="report-answer">{value(answers.questions?.[i])}</p>
              {comments("question-" + i)}
            </section>
          );
        })}
      </section>
      <section>
        <h2>4. Висновок</h2>
        {conclusionLabels.map((label, i) => (
          <div key={label}>
            <h3>{label}</h3>
            <p className="report-answer">{value(answers.conclusion?.[i])}</p>
          </div>
        ))}
        {comments("conclusion")}
        <h3>Творче завдання · необов’язково</h3>
        <p>
          {number === 1
            ? rampCreativeInstruction(content.creative)
            : content.creative}
        </p>
        <p className="report-answer">{value(answers.creative)}</p>
      </section>
    </article>
  );
}
