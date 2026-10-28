import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLearningReport,
  correctedCalculations,
  learningEventSchema,
} from "../lib/learning-progress";
import { labs } from "../lib/labs";
import type { Answers, LabContent } from "../lib/types";

const content: LabContent = {
  ...labs[0].content,
  experiments: [
    {
      id: "speed",
      title: "Швидкість",
      instructions: [],
      rows: ["Дослід 1"],
      fields: [
        { key: "s", label: "Шлях", positive: true },
        { key: "t", label: "Час", positive: true },
        {
          key: "v",
          label: "Швидкість",
          calculated: { op: "divide", args: ["s", "t"] },
        },
      ],
    },
  ],
};
const run = (experimentId: string, parameters: Record<string, number>) => ({
  kind: "RUN_COMPLETED",
  experimentId,
  payload: { parameters },
});
test("trial comparisons stay within each series and count repetitions without a learner score", () => {
  const report = buildLearningReport(content, {}, [
    run("a", { s: 1, a: 10 }),
    run("b", { s: 9, a: 40 }),
    run("a", { s: 1, a: 10 }),
    { kind: "RUN_STARTED", experimentId: "a", payload: {} },
    run("a", { s: 2, a: 10 }),
    run("a", { s: 3, a: 20 }),
  ]);
  assert.deepEqual(report.facts, {
    totalRuns: 5,
    repeated: 1,
    single: 1,
    multiple: 1,
    corrected: 0,
    help: 0,
  });
  assert.equal(report.dimensions.length, 4);
  assert.equal("score" in report, false);
});
test("arithmetic corrections require an existing error, changed result and unchanged numeric inputs", () => {
  const answer = (s: string, t: string, v: string): Answers => ({
    experiments: { speed: [{ s, t, v }] },
  });
  assert.equal(
    correctedCalculations(
      content,
      answer("10", "2", "3"),
      answer("10,0", "2", "5"),
    ).length,
    1,
  );
  assert.equal(
    correctedCalculations(
      content,
      answer("10", "2", ""),
      answer("10", "2", "5"),
    ).length,
    0,
  );
  assert.equal(
    correctedCalculations(
      content,
      answer("10", "2", "3"),
      answer("6", "2", "3"),
    ).length,
    0,
  );
  assert.equal(
    correctedCalculations(content, answer("", "2", "3"), answer("10", "2", "5"))
      .length,
    0,
  );
});
test("filled conclusions do not imply semantic correctness or confirmed hypotheses", () => {
  const report = buildLearningReport(
    content,
    { conclusion: ["a", "b", "c", "d"], prediction: "test" },
    [],
  );
  assert.match(report.dimensions[3].evidence[0], /4 із 4/);
  assert.match(report.dimensions[3].evidence[1], /перевіряє вчитель/);
  assert.equal(report.facts.totalRuns, 0);
});
test("unverifiable or missing arithmetic is not counted as correct", () => {
  const report = buildLearningReport(
    content,
    { experiments: { speed: [{ s: "", t: "", v: "5" }] } },
    [],
  );
  assert.match(report.dimensions[2].evidence[1], /0 із 0/);
});
test("event schema rejects text surveillance, unknown events and forged server corrections", () => {
  const base = {
    eventId: "test-1",
    occurredAt: "2026-10-28T12:00:00.000Z",
    experimentId: "speed",
  };
  assert.equal(
    learningEventSchema.safeParse({
      ...base,
      kind: "RUN_COMPLETED",
      payload: { parameters: { s: 1 } },
    }).success,
    true,
  );
  assert.equal(
    learningEventSchema.safeParse({
      ...base,
      kind: "RUN_COMPLETED",
      payload: { parameters: { s: 1 }, email: "private" },
    }).success,
    false,
  );
  assert.equal(
    learningEventSchema.safeParse({
      ...base,
      kind: "CALCULATION_FIXED",
      payload: {},
    }).success,
    false,
  );
  assert.equal(
    learningEventSchema.safeParse({ ...base, kind: "KEYSTROKE", payload: {} })
      .success,
    false,
  );
  assert.equal(
    learningEventSchema.safeParse({
      ...base,
      kind: "RUN_COMPLETED",
      payload: {
        parameters: Object.fromEntries(
          Array.from({ length: 33 }, (_, i) => [String(i), 1]),
        ),
      },
    }).success,
    false,
  );
});
test("all ten templates yield four explainable dimensions with no telemetry", () => {
  for (const lab of labs) {
    const report = buildLearningReport(lab.content, {}, []);
    assert.equal(report.dimensions.length, 4);
    assert.equal(report.facts.corrected, 0);
    assert.equal(report.facts.totalRuns, 0);
  }
});
