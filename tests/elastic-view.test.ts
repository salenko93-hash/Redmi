import { test } from "node:test";
import assert from "node:assert/strict";
import {
  elasticGeometry,
  ELASTIC_ANCHOR,
  ELASTIC_PX_PER_CM,
  elasticCoils,
  elasticCordWidth,
  elasticTransition,
} from "../lib/elastic-view";
import { initialParameters, simulate } from "../lib/simulation";

test("elastic element, initial length and ruler share one scale over all supported settings", () => {
  for (const material of [0, 1])
    for (let initial = 10; initial <= 25; initial++)
      for (const mass of [0, 100, 200, 300, 400]) {
        const p = {
          ...initialParameters(6, "elastic"),
          material,
          initial,
          mass,
        };
        const r = simulate(6, "elastic", p);
        const start = elasticGeometry(initial, r.values.x, 0);
        const end = elasticGeometry(initial, r.values.x, 1);
        assert.equal(start.end, start.restEnd);
        assert.ok(
          Math.abs(
            (end.end - ELASTIC_ANCHOR) / ELASTIC_PX_PER_CM -
              (initial + 100 * r.values.x),
          ) < 1e-9,
        );
        assert.ok(
          Math.abs(
            (end.end - end.restEnd) / ELASTIC_PX_PER_CM / 100 - r.values.x,
          ) < 1e-9,
        );
        assert.ok(
          end.end <= ELASTIC_ANCHOR + 45 * ELASTIC_PX_PER_CM + 1e-9,
          "the entire working range must fit the ruler",
        );
        assert.ok(
          end.end + (mass / 100) * 18 + 22 < 510,
          "the load must remain inside the scene",
        );
        if (mass === 0) {
          assert.ok(Math.abs(end.end - end.restEnd) < 1e-9);
          assert.equal(r.canRecord, false);
        }
        assert.equal(r.readings.x, undefined);
        assert.equal(r.readings.k, undefined);
      }
});

test("loading and unloading start at the visible position and converge to the unchanged equilibrium", () => {
  for (const material of [0, 1])
    for (const initial of [10, 15, 25]) {
      let previous = 0;
      for (const mass of [100, 200, 400, 200, 100, 0]) {
        const r = simulate(6, "elastic", {
          ...initialParameters(6, "elastic"),
          material,
          initial,
          mass,
        });
        const begin = elasticGeometry(initial, r.values.x, 0, previous);
        assert.ok(
          Math.abs(
            begin.end - begin.restEnd - previous * 100 * ELASTIC_PX_PER_CM,
          ) < 1e-9,
        );
        for (const phase of [0, 0.25, 0.5, 1]) {
          const x = elasticTransition(previous, r.values.x, phase);
          assert.ok(
            x >= Math.min(previous, r.values.x) - 1e-12 &&
              x <= Math.max(previous, r.values.x) + 1e-12,
          );
        }
        const finish = elasticGeometry(initial, r.values.x, 1, previous);
        assert.ok(
          Math.abs(
            (finish.end - finish.restEnd) / 100 / ELASTIC_PX_PER_CM -
              r.values.x,
          ) < 1e-9,
        );
        if (mass === 0) assert.equal(finish.end, finish.restEnd);
        previous = r.values.x;
      }
    }
});

test("wire turn count stays fixed and the rubber narrows as its length increases", () => {
  for (const initial of [10, 15, 25])
    for (const extension of [0, 0.05, 0.2]) {
      const g = elasticGeometry(initial, extension, 1),
        coil = elasticCoils(ELASTIC_ANCHOR, g.end);
      assert.equal(coil.turns, 12);
      assert.equal(coil.segments.length, 24);
      for (const segment of coil.segments)
        for (const point of segment.split(" ")) {
          const [x, y] = point.split(",").map(Number);
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
          assert.ok(y >= ELASTIC_ANCHOR && y <= g.end);
        }
      const width = elasticCordWidth(initial, g.length);
      assert.ok(width > 0 && width <= 8);
      assert.ok(
        Math.abs(
          (width ** 2 * g.length) / (64 * initial * ELASTIC_PX_PER_CM) - 1,
        ) < 2e-5,
      );
    }
});
