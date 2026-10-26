import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRosterCsv,
  planRoster,
  rosterCsvCell,
  ROSTER_MAX_ROWS,
  ROSTER_MAX_BYTES,
} from "../lib/roster";
test("roster CSV accepts Ukrainian UTF-8 headers, quoted delimiters, escaped quotes and optional email", () => {
  const p = parseRosterCsv(
    '\uFEFFПІБ;Email\r\n"Коваленко, Олена";OLENA@example.com\r\n"Іваненко ""Петро""";\r\n',
  );
  assert.deepEqual(p.errors, []);
  assert.equal(p.rows.length, 2);
  assert.equal(p.rows[0].name, "Коваленко, Олена");
  assert.equal(p.rows[0].email, "olena@example.com");
  assert.equal(p.rows[1].name, 'Іваненко "Петро"');
  assert.equal(p.rows[1].email, null);
  const comma = parseRosterCsv('Full name,Email\n"Doe, Jane",jane@example.com');
  assert.deepEqual(comma.errors, []);
  assert.equal(comma.rows[0].name, "Doe, Jane");
});
test("split names and clipboard tabs preserve patronymic and original physical row numbers", () => {
  const p = parseRosterCsv(
    "\n\nПрізвище\tІм’я\tПо батькові\tEmail\nШевченко\tМаксим\tОлегович\tmax@example.com\n",
  );
  assert.deepEqual(p.errors, []);
  assert.equal(p.rows[0].name, "Шевченко Максим Олегович");
  assert.equal(p.rows[0].line, 4);
});
test("invalid headers, field counts, quotes, names and email block an atomic roster import", () => {
  for (const source of [
    "ПІБ;Email\nОлена;bad-email",
    "ПІБ;Email\nОлена;ok@example.com;extra",
    'ПІБ;Email\n"Олена;ok@example.com',
    'ПІБ;Email\n"Олена"bad;ok@example.com',
    'ПІБ;Email\n"Олена\nІванівна";ok@example.com',
    "ПІБ;Password\nОлена;secret",
    "ПІБ;Email;Email\nОлена;a@example.com;a@example.com",
    "Прізвище;Імя\n;Олена",
    "ПІБ\nА",
    "ПІБ\n\uFFFDОлена",
  ])
    assert.ok(parseRosterCsv(source).errors.length, source);
  assert.ok(
    parseRosterCsv("ПІБ;Email\nОлена;a@example.com\nМаксим;a@example.com")
      .errors.length,
  );
});
test("roster limits apply to bytes and records, including Unicode files", () => {
  assert.ok(
    parseRosterCsv("ПІБ\n" + "І".repeat(ROSTER_MAX_BYTES / 2)).errors.length,
  );
  assert.ok(
    parseRosterCsv(
      "ПІБ\n" +
        Array.from(
          { length: ROSTER_MAX_ROWS + 1 },
          (_, i) => "Учень " + i,
        ).join("\n"),
    ).errors.length,
  );
  assert.equal(
    parseRosterCsv(
      "ПІБ\n" +
        Array.from({ length: ROSTER_MAX_ROWS }, (_, i) => "Учень " + i).join(
          "\n",
        ),
    ).rows.length,
    500,
  );
});
test("duplicate planning handles normalized names, existing emails and same-name pupils without merging distinct emails", () => {
  const p = parseRosterCsv(
    "ПІБ;Email\nІваненко Петро;p@example.com\nІваненко Петро;p@example.com\nІВАНЕНКО Петро;other@example.com\nМельник Марія;\nКоваль Олена;olena@example.com",
  );
  assert.deepEqual(p.errors, []);
  const plan = planRoster(
    p.rows,
    [{ key: "name:коваль олена", name: "Коваль Олена" }],
    [{ name: "Мельник Марія", email: "m@example.com" }],
  );
  assert.deepEqual(
    plan.map((r) => r.action),
    ["create", "skip", "create", "skip", "skip"],
  );
  const mixed = parseRosterCsv(
    "ПІБ;Email\nСоловей Данило;d@example.com\nСоловей Данило;",
  );
  assert.deepEqual(
    planRoster(mixed.rows, [], []).map((r) => r.action),
    ["create", "skip"],
  );
  const names = parseRosterCsv("ПІБ\n Лук’яненко  Олена \nЛук'яненко Олена");
  assert.equal(names.rows[1].duplicateOf, 2);
});
test("downloaded roster CSV protects spreadsheet formulas and quotes cells", () => {
  assert.equal(rosterCsvCell('Іваненко; "Олена"'), '"Іваненко; ""Олена"""');
  for (const value of [
    "=1+1",
    "+test@example.com",
    "-1",
    "@SUM(1)",
    '  =HYPERLINK("bad")',
  ])
    assert.ok(rosterCsvCell(value).startsWith("\"'"));
});
