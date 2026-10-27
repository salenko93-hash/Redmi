export function PressureReadouts({
  experiment,
  readings,
  phase,
}: {
  experiment: string;
  readings: Record<string, string>;
  phase: number;
}) {
  const ready = phase === 1;
  const fields =
    experiment === "area"
      ? [
          ["F", "Сила за mзаг·g", "Н"],
          ["a", "Сторона опори a", "м"],
          ["b", "Сторона опори b", "м"],
        ]
      : [
          ["S", "Площа опори S", "м²"],
          ["F", "Сила за mзаг·g", "Н"],
        ];
  return (
    <section
      className={`pressure-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      <dl>
        {fields.map(([key, label, unit]) => (
          <div key={key}>
            <dt>
              {label} · {unit}
            </dt>
            <dd data-pressure-reading={key}>
              {!ready && key === "F" ? "—" : readings[key].replace(".", ",")}
            </dd>
          </div>
        ))}
      </dl>
      <p role={ready ? "status" : undefined}>
        {ready ? "Відлік завершено. " : "Запусти відлік для зняття показів. "}
        {experiment === "area"
          ? "Площу грані та середній тиск обчисли самостійно."
          : "Середній тиск обчисли самостійно; F враховує брусок і всі тягарці."}
      </p>
    </section>
  );
}
