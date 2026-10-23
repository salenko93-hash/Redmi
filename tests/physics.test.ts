import { test } from "node:test";
import assert from "node:assert/strict";
import { labs } from "../lib/labs";
import {
  number,
  expected,
  matches,
  completeness,
  emptyAnswers,
  fieldFeedback,
  progress,
} from "../lib/physics";
test("Ukrainian number parsing preserves decimal comma and rejects invalid measurements", () => {
  assert.equal(number(" 1,25 "), 1.25);
  assert.equal(number("1 000"), 1000);
  for (const v of ["", "1,2,3", "Infinity", "NaN", "<script>", "0x10"])
    assert.equal(number(v), null);
});
test("speed and derived density are checked using student inputs", () => {
  const f = labs[0].content.experiments[0].fields[2];
  assert.equal(expected(f, { l: "1,2", t: "0,6" }), 2);
  assert.equal(fieldFeedback(f, { l: "1,2", t: "0,6", v: "2" }), null);
  assert.ok(fieldFeedback(f, { l: "1,2", t: "0,6", v: "20" }));
  assert.equal(expected(f, { l: "1", t: "0" }), null);
});
test("cm to m extension and hydrostatic density", () => {
  const spring = labs[5].content.experiments[0].fields.find(
    (f) => f.key === "x",
  )!;
  assert.ok(Math.abs(expected(spring, { l: "25", l0: "20" })! - 0.05) < 1e-12);
  const hydro = labs[8].content.experiments[0].fields.find(
    (f) => f.key === "rho",
  )!;
  assert.ok(Math.abs(expected(hydro, { P1: "2,7", P2: "1,7" })! - 2700) < 1e-9);
  assert.equal(expected(hydro, { P1: "2", P2: "2" }), null);
});
test("rounding tolerance does not accept coarse incorrect values", () => {
  assert.ok(matches("0,33", 1 / 3));
  assert.ok(!matches("0", 0.1));
  assert.ok(!matches("1", 1.4));
  assert.ok(!matches("20", 2));
});
test("every template has an experiment and requires a complete personal report", () => {
  assert.equal(labs.length, 10);
  assert.equal(new Set(labs.map((l) => l.number)).size, 10);
  for (const lab of labs) {
    assert.ok(lab.content.experiments.length > 0);
    assert.ok(completeness(lab.content, emptyAnswers(lab.content)).length > 5);
    assert.ok(lab.content.questions.length >= 3);
  }
});
test("count must be integer, measurements positive", () => {
  assert.ok(
    fieldFeedback(
      { key: "N", label: "N", positive: true, integer: true },
      { N: "2,5" },
    ),
  );
  assert.ok(
    fieldFeedback({ key: "t", label: "t", positive: true }, { t: "-1" }),
  );
});

test("force diagrams require student input and progress remains nonnegative", () => {
  const content = labs[9].content;
  const a = emptyAnswers(content);
  assert.equal(a.diagram?.[0].gravity, 0);
  assert.ok(completeness(content, a).some((e) => e.includes("Схема сил")));
  assert.ok(progress(content, a) >= 0);
});
