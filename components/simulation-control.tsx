"use client";
import { useEffect, useId, useState } from "react";
import { controlValue } from "@/lib/simulation-control";
export function SimulationControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  options?: string[];
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId(),
    [draft, setDraft] = useState(String(value)),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(value));
    setError("");
  }, [value]);
  function commit() {
    const next = controlValue(draft, min, max, step);
    if (next === null) {
      setDraft(String(value));
      setError(`Введи число від ${min} до ${max}.`);
      return;
    }
    setDraft(String(next));
    setError("");
    if (next !== value) onChange(next);
  }
  function increment(direction: number) {
    const next = controlValue(
      String(
        Math.min(
          max,
          Math.max(min, Number((value + direction * step).toPrecision(12))),
        ),
      ),
      min,
      max,
      step,
    );
    if (next !== null && next !== value) onChange(next);
  }
  return (
    <div className="virtual-control">
      <label htmlFor={id}>
        {label}
        {unit && <span>{unit}</span>}
      </label>
      {options ? (
        <select
          id={id}
          aria-label={label}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {options.map((option, index) => (
            <option key={option} value={index}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <>
          <div className="virtual-value-editor">
            <button
              type="button"
              aria-label={`Зменшити: ${label}`}
              disabled={disabled || value <= min}
              onClick={() => increment(-1)}
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              aria-label={`Точне значення: ${label}`}
              aria-describedby={error ? `${id}-error` : undefined}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setDraft(String(value));
                  setError("");
                }
              }}
              title={`Від ${min} до ${max}; крок ${step}`}
            />
            <button
              type="button"
              aria-label={`Збільшити: ${label}`}
              disabled={disabled || value >= max}
              onClick={() => increment(1)}
            >
              +
            </button>
          </div>
          <input
            id={id}
            aria-label={label}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </>
      )}
      {error && (
        <span
          id={`${id}-error`}
          className="virtual-control-error"
          role="status"
        >
          {error}
        </span>
      )}
    </div>
  );
}
