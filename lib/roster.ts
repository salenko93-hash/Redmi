import { z } from "zod";

export const ROSTER_MAX_BYTES = 128 * 1024;
export const ROSTER_MAX_ROWS = 500;
export type RosterEntry = {
  line: number;
  name: string;
  email: string | null;
  key: string;
  duplicateOf?: number;
};
export type RosterIssue = { line: number; message: string };
export type RosterPlanRow = RosterEntry & {
  action: "create" | "skip";
  reason: string;
};
export function normalizedName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’ʼ`]/g, "'")
    .toLocaleLowerCase("uk-UA");
}
const headerKey = (s: string) =>
  s
    .trim()
    .toLocaleLowerCase("uk-UA")
    .replace(/[\s._’'ʼ-]/g, "");
const aliases: Record<string, string> = {
  піб: "name",
  fullname: "name",
  name: "name",
  повнеімя: "name",
  прізвище: "last",
  surname: "last",
  lastname: "last",
  імя: "first",
  firstname: "first",
  побатькові: "middle",
  patronymic: "middle",
  middlename: "middle",
  email: "email",
  електроннапошта: "email",
  пошта: "email",
  "№": "ignore",
  "#": "ignore",
  номер: "ignore",
  клас: "ignore",
  class: "ignore",
  кодприєднання: "ignore",
  статус: "ignore",
};
function delimiter(text: string) {
  const counts = new Map([
    [";", 0],
    [",", 0],
    ["\t", 0],
  ]);
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && (c === "\n" || c === "\r")) break;
    else if (!quoted && counts.has(c)) counts.set(c, counts.get(c)! + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}
function records(text: string, sep: string) {
  const result: { line: number; cells: string[] }[] = [];
  let cells: string[] = [],
    value = "",
    quoted = false,
    closed = false,
    line = 1,
    start = 1;
  const pushCell = () => {
    cells.push(value);
    value = "";
    closed = false;
  };
  const pushRow = () => {
    pushCell();
    if (cells.some((c) => c.trim())) result.push({ line: start, cells });
    cells = [];
    if (result.length > ROSTER_MAX_ROWS + 1)
      throw {
        line: start,
        message: `Максимум ${ROSTER_MAX_ROWS} учнів в одному файлі.`,
      };
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else if (c === "\r" || c === "\n") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        value += "\n";
        line++;
      } else value += c;
    } else if (c === sep) pushCell();
    else if (c === "\n" || c === "\r") {
      pushRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
      line++;
      start = line;
    } else if (c === '"') {
      if (closed || value.trim())
        throw {
          line,
          message:
            "Лапки всередині поля потрібно подвоїти, а поле взяти в лапки.",
        };
      value = "";
      quoted = true;
    } else if (closed) {
      if (c !== " " && c !== "\t")
        throw {
          line,
          message: "Після закритих лапок має бути розділювач або кінець рядка.",
        };
    } else value += c;
  }
  if (quoted) throw { line: start, message: "Незакриті лапки у CSV." };
  pushRow();
  return result;
}
export function parseRosterCsv(input: string): {
  rows: RosterEntry[];
  errors: RosterIssue[];
  ignoredColumns: string[];
} {
  const errors: RosterIssue[] = [],
    rows: RosterEntry[] = [];
  if (new TextEncoder().encode(input).length > ROSTER_MAX_BYTES)
    return {
      rows,
      errors: [{ line: 1, message: "Файл завеликий. Максимум 128 КБ." }],
      ignoredColumns: [],
    };
  const text = input.replace(/^\uFEFF/, "");
  const headerText = text.replace(/^(?:[ \t]*(?:\r\n|\n|\r))+/, "");
  let data: ReturnType<typeof records>;
  try {
    data = records(text, delimiter(headerText));
  } catch (e) {
    return { rows, errors: [e as RosterIssue], ignoredColumns: [] };
  }
  if (!data.length)
    return {
      rows,
      errors: [
        { line: 1, message: "Додайте заголовок ПІБ;Email та список учнів." },
      ],
      ignoredColumns: [],
    };
  const headers = data[0].cells.map((c) => aliases[headerKey(c)]);
  const ignoredColumns = data[0].cells.filter(
    (_, i) => headers[i] === "ignore",
  );
  const unknown = data[0].cells.filter((_, i) => !headers[i]);
  if (unknown.length)
    errors.push({
      line: data[0].line,
      message: `Невідомі стовпці: ${unknown.join(", ")}. Використайте шаблон ПІБ;Email або Прізвище;Ім’я;По батькові;Email.`,
    });
  if (
    headers
      .filter((h) => h && h !== "ignore")
      .some((h, i, all) => all.indexOf(h) !== i)
  )
    errors.push({
      line: data[0].line,
      message: "Заголовки стовпців повторюються.",
    });
  if (
    (!headers.includes("name") &&
      !(headers.includes("first") && headers.includes("last"))) ||
    (headers.includes("name") &&
      headers.some((h) => ["first", "last", "middle"].includes(h)))
  )
    errors.push({
      line: data[0].line,
      message:
        "Потрібен стовпець ПІБ або окремі Прізвище та Ім’я. Не змішуйте ці два формати.",
    });
  if (errors.length) return { rows, errors, ignoredColumns };
  const seen = new Map<string, RosterEntry>();
  for (const record of data.slice(1)) {
    const { line, cells } = record;
    if (cells.length !== headers.length) {
      errors.push({
        line,
        message: `Кількість полів має бути ${headers.length}. Для розділювача в тексті використайте лапки.`,
      });
      continue;
    }
    const read = (key: string) => (cells[headers.indexOf(key)] ?? "").trim();
    const rawName = headers.includes("name")
      ? read("name")
      : [read("last"), read("first"), read("middle")].filter(Boolean).join(" ");
    const name = rawName.normalize("NFKC").replace(/ +/g, " ").trim();
    const email = read("email").toLowerCase() || null;
    if (
      name.length < 2 ||
      name.length > 100 ||
      /[\x00-\x1f\x7f\uFFFD]/.test(name)
    ) {
      errors.push({
        line,
        message:
          "ПІБ має містити 2–100 символів без переносів рядка. Перевірте кодування UTF‑8.",
      });
      continue;
    }
    if (headers.includes("last") && (!read("last") || !read("first"))) {
      errors.push({ line, message: "Заповніть прізвище та ім’я." });
      continue;
    }
    if (email && (email.length > 254 || !z.email().safeParse(email).success)) {
      errors.push({
        line,
        message: "Некоректний Email. Виправте або залиште поле порожнім.",
      });
      continue;
    }
    const key = email ? `email:${email}` : `name:${normalizedName(name)}`;
    const previous = seen.get(key);
    if (previous && normalizedName(previous.name) !== normalizedName(name)) {
      errors.push({
        line,
        message: `Той самий Email має інший ПІБ у рядку ${previous.line}.`,
      });
      continue;
    }
    const row: RosterEntry = {
      line,
      name,
      email,
      key,
      ...(previous ? { duplicateOf: previous.line } : {}),
    };
    rows.push(row);
    if (!previous) seen.set(key, row);
  }
  if (!rows.length && !errors.length)
    errors.push({
      line: 2,
      message: "Після заголовка потрібен хоча б один учень.",
    });
  return { rows, errors, ignoredColumns };
}
export function planRoster(
  rows: RosterEntry[],
  invites: { key: string; name: string }[],
  members: { name: string; email: string }[],
): RosterPlanRow[] {
  const keys = new Set(invites.map((r) => r.key));
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
  const memberNames = new Set(members.map((m) => normalizedName(m.name)));
  const namesOnly = new Set(
    invites
      .filter((r) => r.key.startsWith("name:"))
      .map((r) => normalizedName(r.name)),
  );
  const allNames = new Set(invites.map((r) => normalizedName(r.name)));
  return rows.map((row) => {
    const reason = row.duplicateOf
      ? `Повтор рядка ${row.duplicateOf}. Для тезок додайте різні Email.`
      : keys.has(row.key)
        ? "Уже є у списку запрошень."
        : (
              row.email
                ? memberEmails.has(row.email)
                : memberNames.has(normalizedName(row.name))
            )
          ? "Учень уже приєднався до класу."
          : row.email && namesOnly.has(normalizedName(row.name))
            ? "Уже є запрошення на цей ПІБ без Email. Використайте його код."
            : !row.email && allNames.has(normalizedName(row.name))
              ? "Уже є цей ПІБ. Для тезки додайте інший Email."
              : null;
    if (reason) return { ...row, action: "skip", reason };
    keys.add(row.key);
    allNames.add(normalizedName(row.name));
    if (!row.email) namesOnly.add(normalizedName(row.name));
    return {
      ...row,
      action: "create",
      reason: "Буде створено індивідуальний код приєднання.",
    };
  });
}
/** CSV quoting alone does not prevent Excel from evaluating a formula. */
export function rosterCsvCell(value: string) {
  const safe = /^\s*[=+\-@]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}
