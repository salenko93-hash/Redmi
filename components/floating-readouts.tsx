export function FloatingReadouts({
  readings,
  phase,
  message,
}: {
  readings: Record<string, string>;
  phase: number;
  message: string;
}) {
  const ready = phase === 1;
  return (
    <section
      className={`floating-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      <dl>
        {[
          ["V", "Повний зовнішній об’єм", "см³"],
          ["m", "Маса з корком і піском", "г"],
          ["state", "Спостереження", ""],
        ].map(([key, label, unit]) => (
          <div key={key}>
            <dt>
              {label}
              {unit && ` · ${unit}`}
            </dt>
            <dd
              data-floating-reading={key}
              className={key === "state" ? "floating-observation" : undefined}
            >
              {key === "state" && !ready
                ? "Очікуємо завершення"
                : readings[key].replace(".", ",")}
            </dd>
          </div>
        ))}
      </dl>
      <p role={ready ? "status" : undefined}>
        {ready
          ? message
          : "Запусти дослід і спостерігай рух. Сили та середню густину обчисли самостійно."}
      </p>
    </section>
  );
}
