import "dotenv/config";
import { db } from "../lib/db";
import { learningCutoff } from "../lib/learning-progress";
try {
  const result = await db.learningEvent.deleteMany({
    where: { createdAt: { lt: learningCutoff() } },
  });
  console.log(
    `Видалено навчальних подій, старших за 180 днів: ${result.count}. Звіти й оцінки збережено.`,
  );
} finally {
  await db.$disconnect();
}
