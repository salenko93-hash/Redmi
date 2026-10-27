export function ElasticReadouts({
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
      className={`elastic-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      <dl>
        {[
          ["m", "Маса вантажів", "г"],
          ["F", "Сила за mg", "Н"],
          ["l0", "Початкова довжина l₀", "см"],
          ["l", "Довжина l", "см"],
        ].map(([key, label, unit]) => (
          <div key={key}>
            <dt>
              {label} · {unit}
            </dt>
            <dd data-elastic-reading={key}>
              {!ready && (key === "l" || key === "F")
                ? "—"
                : readings[key].replace(".", ",")}
            </dd>
          </div>
        ))}
      </dl>
      <p role={ready ? "status" : undefined}>
        {ready
          ? message
          : "Кінцеву довжину знімай після завершення переміщення. Видовження й F/x обчисли самостійно."}
      </p>
    </section>
  );
}
