import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BALANCE_ARM,
  BALANCE_PAN_DROP,
  BALANCE_PIVOT,
  BALANCE_TOLERANCE_GRAMS,
  balanceGeometry,
  balanceLoadPositions,
} from "../lib/balance-view";
import { BalanceScene } from "../components/balance-scene";
import { weights } from "../lib/simulation";
import {
  stonesLeftWeights,
  stonesRightWeights,
} from "../lib/lab-four-material";

test("equal arms and vertical suspension preserve the heavier side and the zero tolerance", () => {
  for (const difference of [
    -2000, -10, -0.005, -0.004, 0, 0.004, 0.005, 10, 2000,
  ]) {
    const g = balanceGeometry(difference);
    for (const end of [g.left, g.right])
      assert.ok(
        Math.abs(
          Math.hypot(end.x - BALANCE_PIVOT.x, end.y - BALANCE_PIVOT.y) -
            BALANCE_ARM,
        ) < 1e-9,
      );
    assert.equal(g.leftPan - g.left.y, BALANCE_PAN_DROP);
    assert.equal(g.rightPan - g.right.y, BALANCE_PAN_DROP);
    assert.ok(Math.abs(g.angle) <= (10 * Math.PI) / 180);
    assert.equal(g.balanced, Math.abs(difference) < BALANCE_TOLERANCE_GRAMS);
    if (g.balanced) {
      assert.equal(g.leftPan, g.rightPan);
      assert.equal(g.pointer.x, BALANCE_PIVOT.x);
    } else
      assert.ok(
        difference > 0 ? g.leftPan > g.rightPan : g.rightPan > g.leftPan,
      );
  }
});

test("all allowed denominations fit the pan and retain counts even at maximum selection", () => {
  for (let count = 0; count <= weights.length; count++) {
    const positions = balanceLoadPositions(count);
    assert.equal(positions.length, count);
    for (const position of positions) {
      assert.ok(
        Object.values(position).every(
          (v) => typeof v === "boolean" || Number.isFinite(v),
        ),
      );
      assert.ok(Math.abs(position.x) + 15 * position.scale < 73);
    }
  }
  const html = renderToStaticMarkup(
    createElement(BalanceScene, {
      difference: -1000,
      leftLabel: "Тіло",
      status: "Важки",
      id: "max",
      loads: weights.map((w) => ({ ...w, count: 10 })),
    }),
  );
  assert.equal((html.match(/data-count="10"/g) ?? []).length, weights.length);
  for (const weight of weights) assert.ok(html.includes(`10×${weight.label}`));
});

test("all four objects are distinct and the stone problem preserves every load on both pans", () => {
  for (const [objectIndex, object] of [
    "headphones",
    "block",
    "stone",
    "coin",
  ].entries()) {
    const html = renderToStaticMarkup(
      createElement(BalanceScene, {
        difference: 0,
        leftLabel: "Тіло",
        status: "",
        id: object,
        loads: [],
        objectIndex,
      }),
    );
    assert.ok(html.includes(`data-object="${object}"`));
  }
  const html = renderToStaticMarkup(
    createElement(BalanceScene, {
      difference: 0,
      leftLabel: "Мішечок",
      status: "",
      id: "stones",
      loads: stonesRightWeights,
      leftExtra: stonesLeftWeights,
      bag: true,
    }),
  );
  assert.ok(html.includes('data-object="bag"'));
  assert.equal(
    (html.match(/data-side="left"/g) ?? []).length,
    stonesLeftWeights.length,
  );
  assert.equal(
    (html.match(/data-side="right"/g) ?? []).length,
    stonesRightWeights.length,
  );
  assert.ok(html.includes("2×500 мг"));
  assert.ok(html.includes('data-balance-state="balanced"'));
});
