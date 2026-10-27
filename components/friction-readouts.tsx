export function FrictionReadouts({
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
      className={`friction-readouts${ready ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {ready && <h4>Покази приладів</h4>}
      <dl>
        <div>
          <dt>Реакція опори N · Н</dt>
          <dd data-friction-reading="N">{readings.N.replace(".", ",")}</dd>
        </div>
        <div>
          <dt>Динамометр, Fтертя · Н</dt>
          <dd data-friction-reading="F">
            {ready ? readings.F.replace(".", ",") : "—"}
          </dd>
        </div>
      </dl>
      <p role={ready ? "status" : undefined}>
        {ready
          ? message
          : "Кінцевий показ знімай під час рівномірного ковзання. Коефіцієнт μ розрахуй самостійно."}
      </p>
    </section>
  );
}
