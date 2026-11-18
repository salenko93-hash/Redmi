export function HydroReadouts({
  readings,
  phase,
  reference,
}: {
  readings: Record<string, string>;
  phase: number;
  reference?: { P1: number; P2: number };
}) {
  const ready = phase === 1;
  return (
    <section
      className={`hydro-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      {reference && (
        <p>Відлік до найближчої поділки 0,2 Н · межа округлення ±0,1 Н.</p>
      )}
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
      {reference && ready && (
        <details>
          <summary>Еталон моделі · окрема довідка</summary>
          <p>
            P₁ = {String(Number(reference.P1.toFixed(5))).replace(".", ",")} Н;
            P₂ = {String(Number(reference.P2.toFixed(5))).replace(".", ",")} Н.
          </p>
          <p>
            Це розрахунок за припущеннями моделі. У таблицю переноситься відлік
            за шкалою; точний розрахунок не є незалежним вимірюванням.
          </p>
        </details>
      )}
    </section>
  );
}
