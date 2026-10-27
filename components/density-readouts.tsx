const fields = {
  regular: [
    ["m", "Маса зразка", "г"],
    ["l", "Довжина l", "см"],
    ["d", "Ширина d", "см"],
    ["h", "Висота h", "см"],
  ],
  irregular: [
    ["m", "Маса сухого зразка", "г"],
    ["V1", "До занурення V₁", "мл"],
    ["V2", "Після занурення V₂", "мл"],
  ],
  liquid: [
    ["m1", "Порожня посудина m₁", "г"],
    ["m2", "Посудина з рідиною m₂", "г"],
    ["V", "Об’єм рідини V", "мл"],
  ],
} as const;
export function DensityReadouts({
  experiment,
  readings,
  phase,
}: {
  experiment: string;
  readings: Record<string, string>;
  phase: number;
}) {
  const series =
    experiment in fields ? (experiment as keyof typeof fields) : "regular";
  return (
    <section
      className={`density-readouts${phase === 1 ? " virtual-results" : ""}`}
      aria-label="Покази приладів"
    >
      {phase === 1 && <h4>Покази приладів</h4>}
      <dl>
        {fields[series].map(([key, label, unit]) => {
          const pending =
            phase < 1 &&
            (key === "V2" || (series === "liquid" && key !== "m1"));
          return (
            <div key={key}>
              <dt>
                {label} · {unit}
              </dt>
              <dd data-density-reading={key}>
                {pending ? "—" : readings[key].replace(".", ",")}
              </dd>
            </div>
          );
        })}
      </dl>
      <p>
        {series === "regular"
          ? "Об’єм і густину розрахуй за виміряними розмірами та масою."
          : "Кінцеві покази знімай після завершення досліду. 1 мл = 1 см³."}
      </p>
    </section>
  );
}
