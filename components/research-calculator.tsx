"use client";
import { useId, useRef, useState } from "react";
import { Calculator, Delete } from "lucide-react";
import { calculateExpression } from "@/lib/calculator";
export function ResearchCalculator() {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const [expression, setExpression] = useState(""),
    [result, setResult] = useState("—"),
    [error, setError] = useState("");
  function edit(value: string) {
    setExpression(value.slice(0, 200));
    setError("");
    setResult("—");
  }
  function solve() {
    try {
      setResult(
        Number(calculateExpression(expression).toPrecision(12)).toLocaleString(
          "uk-UA",
          { maximumSignificantDigits: 12 },
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setResult("—");
    }
  }
  function insert(token: string) {
    const el = input.current,
      start = el?.selectionStart ?? expression.length,
      end = el?.selectionEnd ?? start;
    const value = expression.slice(0, start) + token + expression.slice(end);
    edit(value);
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }
  return (
    <section className="research-calculator" aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`}>
        <Calculator size={17} /> Калькулятор
      </h4>
      <label htmlFor={`${id}-input`}>Арифметичний вираз</label>
      <input
        id={`${id}-input`}
        ref={input}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={200}
        value={expression}
        placeholder="Наприклад: (152 − 32) ÷ 40"
        aria-describedby={`${id}-help`}
        aria-invalid={Boolean(error)}
        onChange={(e) => edit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            solve();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            edit("");
          }
        }}
      />
      <div className="calculator-result">
        <span>Результат</span>
        <output aria-label="Результат калькулятора" aria-live="polite">
          {result}
        </output>
      </div>
      {error && (
        <p className="calculator-error" role="alert">
          {error}
        </p>
      )}
      <div className="calculator-keys">
        <button type="button" onClick={() => edit("")}>
          C
        </button>
        <button type="button" onClick={() => insert("(")}>
          (
        </button>
        <button type="button" onClick={() => insert(")")}>
          )
        </button>
        <button
          type="button"
          aria-label="Видалити символ"
          onClick={() => {
            const el = input.current,
              start = el?.selectionStart ?? expression.length,
              end = el?.selectionEnd ?? start;
            const from = start === end ? Math.max(0, start - 1) : start;
            edit(expression.slice(0, from) + expression.slice(end));
            requestAnimationFrame(() => {
              el?.focus({ preventScroll: true });
              el?.setSelectionRange(from, from);
            });
          }}
        >
          <Delete size={17} />
        </button>
        {[
          "7",
          "8",
          "9",
          "÷",
          "4",
          "5",
          "6",
          "×",
          "1",
          "2",
          "3",
          "−",
          "0",
          ",",
          "=",
          "+",
        ].map((key) => (
          <button
            type="button"
            className={
              key === "="
                ? "calculator-equals"
                : /[÷×−+]/.test(key)
                  ? "calculator-operation"
                  : ""
            }
            key={key}
            aria-label={key === "=" ? "Обчислити" : undefined}
            onClick={() => (key === "=" ? solve() : insert(key))}
          >
            {key}
          </button>
        ))}
      </div>
      <p id={`${id}-help`} className="muted">
        Крапка або кома, дужки, + − × ÷. Enter — обчислити. Перевіряйте одиниці;
        результат у звіт внесіть самостійно.
      </p>
    </section>
  );
}
