/** Arithmetic parser for a local calculator. No script evaluation or external requests. */
export function calculateExpression(input: string): number {
  if (input.length > 200)
    throw new Error("Вираз надто довгий (до 200 символів).");
  const source = input
    .replaceAll(",", ".")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replace(/\s/g, "");
  let position = 0,
    depth = 0;
  const invalid = () => new Error("Перевірте числа, дії та дужки.");
  function primary(): number {
    if (++depth > 64) throw invalid();
    let value: number;
    const char = source[position];
    if (char === "+" || char === "-") {
      position++;
      value = (char === "-" ? -1 : 1) * primary();
    } else if (char === "(") {
      position++;
      value = sum();
      if (source[position++] !== ")") throw invalid();
    } else {
      const token = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(position));
      if (!token) throw invalid();
      position += token[0].length;
      value = Number(token[0]);
    }
    depth--;
    return value;
  }
  function product(): number {
    let value = primary();
    while (source[position] === "*" || source[position] === "/") {
      const operation = source[position++],
        next = primary();
      if (operation === "/" && next === 0)
        throw new Error("На нуль ділити не можна.");
      value = operation === "*" ? value * next : value / next;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (source[position] === "+" || source[position] === "-") {
      const operation = source[position++],
        next = product();
      value = operation === "+" ? value + next : value - next;
    }
    return value;
  }
  const value = sum();
  if (position !== source.length) throw invalid();
  if (!Number.isFinite(value))
    throw new Error("Результат завеликий. Перевірте числа.");
  return Object.is(value, -0) ? 0 : value;
}
