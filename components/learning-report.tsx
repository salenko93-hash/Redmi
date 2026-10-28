import type { LearningReport as Report } from "@/lib/learning-progress";
import styles from "./learning-progress.module.css";

export function LearningReport({ report }: { report: Report }) {
  return (
    <div className={styles.dimensions}>
      {report.dimensions.map((dimension) => (
        <section className={styles.dimension} key={dimension.key}>
          <h3>{dimension.title}</h3>
          <ul>
            {dimension.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            <strong>Наступний крок. </strong>
            {dimension.next}
          </p>
        </section>
      ))}
      <p className={styles.note}>
        Запитів допомоги у журналі: {report.facts.help}. Звернення по допомогу
        не знижує оцінку.
      </p>
    </div>
  );
}
