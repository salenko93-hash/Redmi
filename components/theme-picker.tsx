"use client";
import { Palette, Check } from "lucide-react";
import { useTheme } from "./theme-provider";
import { themes, resolveTheme } from "@/lib/themes";
import styles from "./theme-picker.module.css";
export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, saved } = useTheme();
  return (
    <div className={styles.root}>
      {compact ? (
        <label className={styles.compact}>
          <span>
            <Palette size={16} aria-hidden="true" />
            Кольорова тема
          </span>
          <select
            aria-label="Кольорова тема"
            value={theme}
            onChange={(event) => setTheme(resolveTheme(event.target.value))}
          >
            {themes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className="sr-only">Кольорова тема</legend>
          <div className={styles.options}>
            {themes.map((option) => (
              <label key={option.id} className={styles.option}>
                <input
                  type="radio"
                  name="color-theme"
                  aria-label={option.label}
                  value={option.id}
                  checked={theme === option.id}
                  onChange={() => setTheme(option.id)}
                />
                <span className={styles.card}>
                  <span
                    className={styles.preview}
                    style={{ background: option.preview }}
                    aria-hidden="true"
                  >
                    <span style={{ background: option.accent }} />
                    <span style={{ borderColor: option.accent }} />
                    {theme === option.id && (
                      <Check size={18} style={{ color: option.accent }} />
                    )}
                  </span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {!saved && (
        <p className={styles.notice} role="status">
          Тему застосовано. Браузер не дозволив зберегти вибір для наступного
          відкриття.
        </p>
      )}
    </div>
  );
}
