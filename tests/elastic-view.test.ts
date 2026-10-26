import { test } from "node:test";
import assert from "node:assert/strict";
import {
  elasticGeometry,
  ELASTIC_ANCHOR,
  ELASTIC_PX_PER_CM,
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
          end.end + (mass / 100) * 16 + 5 < 400,
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
