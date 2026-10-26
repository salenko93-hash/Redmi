import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ForceDiagram } from "../components/force-diagram";
import { BalanceScene } from "../components/balance-scene";
import {
  questionFigure,
  questionWithInlineFigure,
} from "../lib/question-figures";
import { labs } from "../lib/labs";
const blank = () =>
  Array.from({ length: 3 }, () => ({
    gravity: 0,
    buoyancy: 0,
    support: 0,
    state: "",
  }));
test("zero forces produce no arrows and explicitly indicate an unfinished diagram", () => {
  const html = renderToStaticMarkup(
    createElement(ForceDiagram, { value: blank() }),
  );
  assert.ok(!html.includes("data-force="));
  assert.equal((html.match(/class="force-placeholder"/g) ?? []).length, 3);
  assert.ok(html.includes("ум. од."));
});
test("gravity points down and buoyancy and bottom support point up", () => {
  const v = blank();
  v[0] = { gravity: 3, buoyancy: 2, support: 1, state: "На дні" };
  const html = renderToStaticMarkup(createElement(ForceDiagram, { value: v }));
  for (const force of ["gravity", "buoyancy", "support"]) {
    const line = html.match(
      new RegExp(`<line[^>]*data-force="${force}"[^>]*>`),
    )![0];
    const y1 = Number(line.match(/y1="([\d.]+)"/)![1]),
      y2 = Number(line.match(/y2="([\d.]+)"/)![1]);
    assert.ok(force === "gravity" ? y2 > y1 : y2 < y1);
  }
});
test("multiple diagram instances use distinct SVG markers", () => {
  const html = renderToStaticMarkup(
    createElement(
      "div",
      {},
      createElement(ForceDiagram, { value: blank() }),
      createElement(ForceDiagram, { value: blank() }),
    ),
  );
  const ids = [...html.matchAll(/<marker id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6);
});
test("references attach to relevant questions without a full worksheet page", () => {
  for (const n of [1, 4, 5, 6, 10]) {
    const questions = labs[n - 1].content.questions;
    assert.ok(questions.some((q) => questionFigure(n, q)));
  }
  assert.equal(questionFigure(1, "Поясніть роль тертя."), null);
  assert.equal(questionFigure(4, "Зважте тіло масою 32 г."), null);
  assert.equal(
    questionWithInlineFigure("За графіком в оригінальному PDF поясніть рух."),
    "За графіком нижче поясніть рух.",
  );
});
test("equal-arm balance lowers the heavier pan and shows repeated weights explicitly", () => {
  for (const difference of [10, 0, -10]) {
    const html = renderToStaticMarkup(
      createElement(
        "svg",
        {},
        createElement(BalanceScene, {
          difference,
          leftLabel: "Тіло",
          loads: [{ key: "w20", label: "20 г", count: 2 }],
          status: "Схема",
          id: "test-balance",
        }),
      ),
    );
    const readY = (side: string) =>
      Number(
        html.match(
          new RegExp(`data-instrument="${side}-pan"[^>]*cy="([\\d.]+)"`),
        )![1],
      );
    const left = readY("left"),
      right = readY("right");
    assert.ok(
      difference > 0
        ? left > right
        : difference < 0
          ? right > left
          : left === right,
    );
    assert.ok(html.includes('data-count="2"'));
    assert.ok(html.includes("2×20 г"));
  }
});
