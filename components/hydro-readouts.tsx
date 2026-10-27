export function HydroReadouts({
  readings,
  phase,
}: {
  readings: Record<string, string>;
  phase: number;
}) {
  const ready = phase === 1;
  return (
    <section
      className={`hydro-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      <dl>
        {[
          ["object", "Невідомий зразок", ""],
          ["P1", "У повітрі P₁", "Н"],
          ["P2", "Повністю у воді P₂", "Н"],
        ].map(([key, label, unit]) => (
          <div key={key}>
            <dt>
              {label}
              {unit && ` · ${unit}`}
            </dt>
            <dd data-hydro-reading={key}>
              {key === "object"
                ? readings[key]
                : ready
                  ? readings[key].replace(".", ",")
                  : "—"}
            </dd>
          </div>
        ))}
      </dl>
      <p role={ready ? "status" : undefined}>
        {ready
          ? "Обидва кінцеві покази готові. Різницю P₁−P₂, густину та ймовірний матеріал визнач самостійно."
          : "Підніми посудину запуском досліду. Під час занурення показ зменшується; кінцевий відлік знімай після повного занурення."}{" "}
        Цифри моделі не визначають точність реального динамометра.
      </p>
    </section>
  );
}
