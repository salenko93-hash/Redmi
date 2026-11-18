import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { labs } from "../lib/labs";
import { revisedContent } from "../lib/methodology-content";
import { methodGaps, methodWarnings } from "../lib/methodology";
import { completeness, emptyAnswers, progress } from "../lib/physics";
import { emptyRampInquiry } from "../lib/ramp-inquiry";
import { answersSchema } from "../lib/validation";
import {
  initialParameters,
  simulate,
  validateParameters,
  validateSimulationRecords,
  type SimulationRecord,
} from "../lib/simulation";
import { MethodReviewReport } from "../components/method-review-report";
import { RampInquiryReport } from "../components/ramp-inquiry-report";
import type { Answers, LabContent } from "../lib/types";

const content = (n: number) => revisedContent(labs[n - 1]);
function filled(c: LabContent): Answers {
  return {
    ...emptyAnswers(c),
    prediction: "Прогноз із поясненням",
    questions: c.questions.map(() => "Відповідь"),
    conclusion: ["Твердження", "Два числові результати", "Пояснення", "Межі"],
    diagram: c.diagram
      ? [
          { gravity: 3, buoyancy: 2, support: 0, state: "Тоне" },
          { gravity: 2, buoyancy: 2, support: 0, state: "Нейтральна" },
          { gravity: 1, buoyancy: 1, support: 0, state: "На поверхні" },
        ]
      : undefined,
  };
}
test("revised stock versions leave all legacy content unchanged and keep stage one limited", () => {
  const snapshot = JSON.stringify(labs);
  for (const n of [1, 9, 10]) {
    const c = content(n);
    assert.equal(c.methodology?.lab, n);
    assert.equal(c.methodology?.version, "2026-11");
  }
  assert.equal(JSON.stringify(labs), snapshot);
  assert.throws(() => content(2));
  assert.deepEqual(
    methodGaps(labs[9].content, {
      experiments: {
        floating: [
          { V: "50", m: "80" },
          { V: "60", m: "80" },
          { V: "50", m: "80" },
        ],
      },
    }),
    [],
  );
});
test("compact inquiry has one plan, one evidence record and four final parts without legacy duplicate requirements", () => {
  const c = content(1),
    a = filled(c);
  a.experiments = {
    speed: [
      { l: "1.2", t: "1.2", v: "1" },
      { l: "0.9", t: "1", v: "0.9" },
      { l: "0.6", t: "0.8", v: "0.75" },
    ],
  };
  a.rampInquiry = emptyRampInquiry();
  a.rampInquiry.plan.change =
    "Змінюю шлях, кулька й нахил сталі; вимірюю час і порівнюю швидкості.";
  a.rampInquiry.snapshot = {
    prediction: a.prediction!,
    plan: { ...a.rampInquiry.plan },
  };
  assert.deepEqual(completeness(c, a), []);
  assert.equal(progress(c, a), 100);
  assert.deepEqual(answersSchema.parse(a), a);
  a.conclusion![1] = "";
  assert.equal(completeness(c, a).length, 1);
  a.conclusion![1] = "ЧИСЛОВІ_ДОКАЗИ";
  const report = renderToStaticMarkup(
    createElement(RampInquiryReport, {
      stage: "evidence",
      answers: a,
      compact: true,
    }),
  );
  assert.ok(report.includes("ЧИСЛОВІ_ДОКАЗИ"));
  assert.ok(!report.includes("Як я перевірив сумнівний результат?"));
});
test("optional repeated times preserve their path and require three positive readings once started", () => {
  const c = content(1),
    a: Answers = {
      experiments: { speed: [{ l: "1.2" }] },
      repeatMeasurements: {
        speed: [
          { path: "1.2", values: ["1.1", "", "0"], note: "Перевіряю розкид" },
        ],
      },
    };
  assert.equal(methodGaps(c, a).length, 2);
  a.repeatMeasurements!.speed[0].values = ["1.1", "1.2", "1.3"];
  assert.deepEqual(methodGaps(c, a), []);
  a.experiments!.speed[0].l = "0.8";
  assert.equal(methodWarnings(c, a)[0].id, "repeat-path-0");
  assert.equal(a.repeatMeasurements!.speed[0].path, "1.2");
  a.methodNotes = {
    "speed.review":
      "Це повтори попередньої умови, не переношу середній час у новий рядок.",
  };
  assert.deepEqual(methodGaps(c, a), []);
  assert.ok(
    renderToStaticMarkup(
      createElement(MethodReviewReport, {
        content: c,
        experiment: c.experiments[0],
        answers: a,
      }),
    ).includes("1.2"),
  );
  a.repeatMeasurements!.speed[0].values.push("1.4");
  assert.equal(answersSchema.safeParse(a).success, false);
});
test("hydro v3 transfers a scale reading while exact physics and historical v1 records stay unchanged", () => {
  const c = content(9),
    p = initialParameters(9, "hydro");
  const legacy = simulate(9, "hydro", p);
  const parameters = { ...p, measurementMode: 1 };
  const observed = simulate(9, "hydro", parameters);
  assert.equal(legacy.modelVersion, 1);
  assert.deepEqual(legacy.readings, {
    object: "Зразок A",
    P1: "1.35",
    P2: "0.85",
  });
  assert.equal(observed.modelVersion, 3);
  assert.deepEqual(observed.values, legacy.values);
  assert.deepEqual(observed.readings, {
    object: "Зразок A",
    P1: "1.4",
    P2: "0.8",
  });
  for (let sample = 0; sample < 3; sample++)
    for (let volume = 20; volume <= 100; volume += 10) {
      const result = simulate(9, "hydro", { ...parameters, sample, volume });
      for (const key of ["P1", "P2"])
        assert.ok(
          Math.abs(+result.readings[key] - result.values[key]) <= 0.1000001,
        );
    }
  const record: SimulationRecord = {
    modelVersion: 3,
    labNumber: 9,
    experimentId: "hydro",
    rowIndex: 0,
    parameters,
    readings: observed.readings,
    recordedAt: new Date().toISOString(),
  };
  assert.equal(validateSimulationRecords(9, c.experiments, [record]), null);
  assert.ok(
    validateSimulationRecords(9, c.experiments, [
      { ...record, readings: legacy.readings },
    ]),
  );
  assert.ok(
    validateSimulationRecords(9, c.experiments, [
      { ...record, modelVersion: 1 },
    ]),
  );
  assert.equal(
    validateSimulationRecords(9, labs[8].content.experiments, [
      { ...record, parameters: p, modelVersion: 1, readings: legacy.readings },
    ]),
    null,
  );
  assert.equal(
    validateParameters(9, "hydro", { ...p, measurementMode: 2 }),
    false,
  );
  assert.equal(
    validateParameters(10, "floating", {
      ...initialParameters(10, "floating"),
      measurementMode: 1,
    }),
    false,
  );
});
test("hydro checks difference against declared uncertainty without assuming a large difference proves accuracy", () => {
  const c = content(9),
    a: Answers = {
      methodNotes: { "hydro.step": "0,2", "hydro.uncertainty": "0,1" },
      experiments: { hydro: [{ P1: "1", P2: "0.8" }] },
    };
  assert.equal(methodWarnings(c, a)[0].id, "resolution-0");
  assert.equal(methodGaps(c, a).length, 1);
  a.methodNotes!["hydro.review"] =
    "Перевірю нуль і повторю з приладом дрібнішої шкали; висновок про матеріал непевний.";
  assert.deepEqual(methodGaps(c, a), []);
  a.experiments!.hydro[0].P2 = "1.2";
  assert.equal(methodWarnings(c, a)[0].id, "order-0");
  a.experiments!.hydro[0].P1 = "2";
  assert.deepEqual(methodWarnings(c, a), []);
  delete a.methodNotes!["hydro.uncertainty"];
  assert.equal(methodGaps(c, a).length, 1);
});
test("three sinking records are valid provenance but require methodological review in the new floating worksheet", () => {
  const c = content(10),
    a = filled(c),
    p = initialParameters(10, "floating");
  const result = simulate(10, "floating", p);
  const records: SimulationRecord[] = [0, 1, 2].map((rowIndex) => ({
    modelVersion: result.modelVersion,
    labNumber: 10,
    experimentId: "floating",
    rowIndex,
    parameters: { ...p },
    readings: { ...result.readings },
    recordedAt: new Date().toISOString(),
  }));
  a.simulationRecords = records;
  a.experiments = {
    floating: records.map((r) => ({ ...r.readings, rho: "1.2" })),
  };
  assert.equal(validateSimulationRecords(10, c.experiments, records), null);
  assert.equal(methodWarnings(c, a).length, 2);
  assert.equal(completeness(c, a).length, 1);
  a.methodNotes = {
    "floating.review":
      "Не отримав нейтральності та поверхні; дані зберігаю, потрібні повтори з меншою масою піску.",
  };
  assert.deepEqual(completeness(c, a), []);
  assert.equal(progress(c, a), 100);
  assert.equal(methodWarnings(c, a).length, 2);
  assert.deepEqual(answersSchema.parse(a), a);
  const html = renderToStaticMarkup(
    createElement(MethodReviewReport, {
      content: c,
      experiment: c.experiments[0],
      answers: a,
    }),
  );
  assert.ok(html.includes("Не отримав нейтральності"));
  a.experiments.floating[1] = {
    V: "50",
    m: "50",
    rho: "1",
    state: "Нейтральна",
  };
  a.experiments.floating[2] = {
    V: "50",
    m: "20",
    rho: "0.4",
    state: "На поверхні",
  };
  assert.deepEqual(methodWarnings(c, a), []);
  a.experiments.floating[2].V = "60";
  assert.equal(methodWarnings(c, a)[0].id, "volume");
});
