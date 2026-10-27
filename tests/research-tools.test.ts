import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateExpression } from "../lib/calculator";
import { densityEntries, densityInGramsPerCm3 } from "../lib/density-reference";
test("calculator respects precedence, unary signs, nested brackets and both decimal separators", () => {
  for (const [expression, expected] of [
    ["(152 − 32) ÷ 40", 3],
    ["1,25 × 2", 2.5],
    ["2+3*4", 14],
    ["-(2+3)/-2", 2.5],
    [".5+0,25", 0.75],
    ["10/(2+3)", 2],
    ["2--3", 5],
    ["0,1+0,2", 0.3],
  ] as const)
    assert.ok(
      Math.abs(calculateExpression(expression) - expected) < 1e-12,
      expression,
    );
});
test("calculator rejects division by zero, broken expressions, scripts and excessive input", () => {
  for (const expression of [
    "1/0",
    "1/(2-2)",
    "",
    "1+",
    "(2+3",
    "1.2.3",
    "2(3)",
    "Math.random()",
    "alert(1)",
    "1;2",
    "9".repeat(201),
    "(".repeat(65) + "1" + ")".repeat(65),
  ])
    assert.throws(() => calculateExpression(expression), expression);
});
test("density reference retains all 52 entries and converts gas densities without losing small decimals", () => {
  assert.equal(densityEntries.length, 52);
  assert.equal(new Set(densityEntries.map((e) => e.name)).size, 52);
  assert.deepEqual(
    ["solid", "liquid", "gas"].map(
      (state) => densityEntries.filter((e) => e.state === state).length,
    ),
    [28, 16, 8],
  );
  for (const entry of densityEntries) {
    assert.ok(entry.density > 0);
    assert.ok(
      Math.abs(densityInGramsPerCm3(entry.density) * 1000 - entry.density) <
        1e-10,
    );
  }
  assert.ok(
    Math.abs(
      densityInGramsPerCm3(
        densityEntries.find((e) => e.name === "Водень")!.density,
      ) - 0.00009,
    ) < 1e-12,
  );
  assert.match(
    densityEntries.find((e) => e.name === "Олово рідке")!.note!,
    /409/,
  );
});
