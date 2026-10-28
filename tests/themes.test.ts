import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveTheme, themes } from "../lib/themes";
test("theme preferences accept only available palette names", () => {
  for (const theme of themes) assert.equal(resolveTheme(theme.id), theme.id);
  for (const value of [
    undefined,
    null,
    "",
    "unknown",
    "FOREST",
    "__proto__",
    "<script>",
    {},
  ])
    assert.equal(resolveTheme(value), "forest");
});
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}
test("all five palettes keep readable text, buttons and focus outlines", () => {
  const css = readFileSync(
    new URL("../app/themes.css", import.meta.url),
    "utf8",
  );
  for (const theme of themes) {
    const selector =
      theme.id === "forest" ? ":root {" : `:root[data-theme="${theme.id}"] {`;
    const block = css.slice(css.indexOf(selector)).split("}")[0];
    const p = Object.fromEntries(
      [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map((m) => [
        m[1],
        m[2],
      ]),
    );
    assert.ok(contrast(p.ink, p.bg) >= 7, theme.id + " body text");
    assert.ok(
      contrast(p.green, "#ffffff") >= 4.5,
      theme.id + " primary button",
    );
    assert.ok(contrast(p.muted, p.bg) >= 4.5, theme.id + " secondary text");
    assert.ok(contrast(p.focus, "#ffffff") >= 3, theme.id + " focus outline");
    assert.ok(
      contrast(p["hero-subtle"], p["hero-bg"]) >= 4.5,
      theme.id + " hero text",
    );
    assert.ok(
      contrast(p["accent-muted"], p.sage) >= 4.5,
      theme.id + " tinted panel text",
    );
  }
});
