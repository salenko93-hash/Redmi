export function questionFigure(number: number, question: string) {
  const refs: Record<number, { match: RegExp; alt: string }> = {
    1: {
      match: /графік/i,
      alt: "Графік швидкості від часу: 25 м/с від 0 до 20 с, 50 м/с від 20 до 30 с, 100 м/с від 30 до 45 с.",
    },
    4: {
      match: /32|камінц|камінч/i,
      alt: "Рівноплечі терези в рівновазі. Зліва мішечок і важки 2 г та два по 500 мг. Справа важки 50 г, 20 г, 10 г, 2 г, 1 г.",
    },
    5: {
      match: /етикет|пляшк|олії/i,
      alt: "Етикетка олії: маса нетто 782 г, об’єм 0,85 л.",
    },
    6: {
      match: /графік.*пружин|пружин.*графік/i,
      alt: "Графік сили пружності від видовження. Пряма першої пружини крутіша за пряму другої.",
    },
    10: {
      match: /рисунк|однаков.*об[’']єм/i,
      alt: "Три тіла однакового об’єму плавають у воді. Тіло 1 занурене найбільше, тіло 2 — найменше, тіло 3 — між ними.",
    },
  };
  const r = refs[number];
  return r?.match.test(question)
    ? { src: `/references/question-${number}.png`, alt: r.alt }
    : null;
}
export function questionWithInlineFigure(question: string) {
  return question.replace(
    /в оригінальному PDF|в оригінальному pdf|у PDF|в PDF/gi,
    "нижче",
  );
}
