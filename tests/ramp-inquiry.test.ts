import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { labs } from "../lib/labs";
import { answersSchema } from "../lib/validation";
import { completeness, emptyAnswers, progress } from "../lib/physics";
import {
  emptyRampInquiry,
  inquiryContent,
  inquiryRubric,
} from "../lib/ramp-inquiry";
import { RampInquiryReport } from "../components/ramp-inquiry-report";
import type { Answers } from "../lib/types";

const classic = labs[0].content;
function complete(): Answers {
  return {
    prediction:
      "Припускаю, що швидкість зміниться зі шляхом, бо кулька розганяється.",
    experiments: {
      speed: Array.from({ length: 3 }, () => ({
        l: "1,2",
        t: "1,4",
        v: "0,857",
      })),
    },
    questions: classic.questions.map(() => "Пояснення з даними."),
    conclusion: Array.from({ length: 4 }, () => "Обґрунтований висновок."),
  };
}
test("inquiry is a separate content version; classic reports remain complete", () => {
  const before = JSON.stringify(classic);
  const content = inquiryContent(classic);
  assert.equal(JSON.stringify(classic), before);
  assert.equal(content.inquiry, "ramp-v1");
  assert.equal(classic.inquiry, undefined);
  assert.deepEqual(completeness(classic, complete()), []);
  assert.equal(completeness(content, complete()).length, 10);
  assert.equal(emptyAnswers(classic).rampInquiry, undefined);
  assert.deepEqual(emptyAnswers(content).rampInquiry, emptyRampInquiry());
  assert.ok(progress(content, emptyAnswers(content)) >= 0);
});
test("inquiry answers round-trip through validation; empty critical fields cannot be submitted", () => {
  const a = complete();
  const v = emptyRampInquiry();
  v.plan = {
    change: "Шлях",
    constants: "Кулька й нахил",
    measure: "Лінійка й секундомір",
    challenge: "Однакові швидкості",
  };
  v.snapshot = { prediction: a.prediction!, plan: { ...v.plan } };
  v.evidence = {
    comparison: "1,2 м за 1,4 с",
    uncertainty: "Реакція людини",
    verification: "Повторив вимірювання",
  };
  v.reflection = {
    revision: "Уточнюю через розкид",
    nextTest: "Повторити за сталого шляху",
  };
  a.rampInquiry = v;
  const content = inquiryContent(classic);
  assert.deepEqual(answersSchema.parse(a), a);
  assert.deepEqual(completeness(content, a), []);
  assert.equal(progress(content, a), 100);
  const savedPrediction = v.snapshot.prediction;
  a.prediction = "Моя уточнена думка";
  assert.equal(v.snapshot.prediction, savedPrediction);
  v.evidence.comparison = "  ";
  assert.ok(completeness(content, a).some((s) => s.includes("Які числа")));
});
test("optional repeat readings require three positive times once used", () => {
  const a = complete();
  a.rampInquiry = emptyRampInquiry();
  const content = inquiryContent(classic);
  const baseline = completeness(content, a).length;
  a.rampInquiry.repeats = {
    distance: "1,2",
    times: ["1,1", "0", "-2"],
    summary: "Перевірка",
  };
  assert.equal(completeness(content, a).length, baseline + 2);
  a.rampInquiry.repeats.times = ["1,1", "1,2", "1,3"];
  assert.equal(completeness(content, a).length, baseline);
  a.rampInquiry.repeats.times.push("1,4");
  assert.equal(answersSchema.safeParse(a).success, false);
});
test("report includes saved and revised thinking, repetitions and escaped student text", () => {
  const a = complete();
  a.rampInquiry = emptyRampInquiry();
  a.rampInquiry.snapshot = {
    prediction: "Початковий прогноз",
    plan: { ...a.rampInquiry.plan, change: "Збережений план" },
  };
  a.rampInquiry.plan.change = "Уточнений план";
  a.rampInquiry.evidence.comparison = "<script>не виконувати</script>";
  a.rampInquiry.repeats = {
    distance: "1,2",
    times: ["1,1", "1,2", "1,3"],
    summary: "Розкид часу",
  };
  const html = ["plan", "evidence", "reflection"]
    .map((stage) =>
      renderToStaticMarkup(
        createElement(RampInquiryReport, {
          stage: stage as "plan" | "evidence" | "reflection",
          answers: a,
        }),
      ),
    )
    .join("");
  for (const text of [
    "Початковий прогноз",
    "Збережений план",
    "Уточнений план",
    "Розкид часу",
    "1,3",
  ])
    assert.ok(html.includes(text));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.equal(inquiryRubric.length, 4);
});
