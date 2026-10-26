import { test } from "node:test";
import assert from "node:assert/strict";
import { FRICTION_FLOOR, frictionGeometry } from "../lib/friction-view";

test("friction apparatus keeps both faces on the board with a horizontal attached rope and room for the meter", () => {
  for (const side of [0, 1])
    for (let i = 0; i <= 20; i++) {
      const g = frictionGeometry(side, i / 20);
      assert.equal(g.top + g.height, FRICTION_FLOOR);
      assert.equal(g.right, g.left + g.width);
      assert.equal(g.pullY, g.top + g.height / 2);
      assert.equal(g.meterX - g.right, 28);
      assert.ok(
        g.left >= 40 && g.meterX + 138 <= 560,
        "the moving apparatus must remain on screen",
      );
      assert.ok(
        g.width / 2 - 18 > 0 && g.width / 2 + 18 < g.width,
        "weights must fit the selected face",
      );
    }
  const wide = frictionGeometry(0, 0),
    narrow = frictionGeometry(1, 0);
  assert.ok(narrow.width < wide.width && narrow.height > wide.height);
  assert.ok(
    narrow.pullY < wide.pullY,
    "turning the block must also raise the horizontal pull attachment",
  );
});
