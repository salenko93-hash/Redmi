import { test } from "node:test";
import assert from "node:assert/strict";
import { publicSiteOrigin, developmentOrigins } from "../lib/site-origin";
test("configured dev hosts include the exact LAN address without allowing arbitrary origins", () => {
  assert.deepEqual(developmentOrigins("http://192.168.0.193:3000/"), [
    "localhost",
    "127.0.0.1",
    "192.168.0.193",
  ]);
  assert.deepEqual(developmentOrigins("http://localhost:3000"), [
    "localhost",
    "127.0.0.1",
  ]);
  assert.deepEqual(developmentOrigins(undefined), ["localhost", "127.0.0.1"]);
  assert.ok(!developmentOrigins("https://fizlab.school.example").includes("*"));
});
test("only a public HTTP origin is exposed, without user info, paths or queries", () => {
  assert.equal(
    publicSiteOrigin(
      "https://operator:secret@school.example/path?token=private",
    ),
    "https://school.example",
  );
  for (const value of [
    undefined,
    "",
    "not a url",
    "javascript:alert(1)",
    "file:///tmp/example",
  ])
    assert.equal(publicSiteOrigin(value), undefined);
});
