import type { Answers, LabContent, RampInquiryAnswers } from "./types";

export const inquiryPlan = [
  {
    key: "change",
    label: "Що я змінюватиму?",
    hint: "Назви одну величину для порівняння трьох умов.",
  },
  {
    key: "constants",
    label: "Що залишу сталим і чому?",
    hint: "Подумай про кульку, нахил, місце старту й спосіб запуску.",
  },
  {
    key: "measure",
    label: "Що і як вимірюватиму?",
    hint: "Назви прилади, одиниці та моменти початку й кінця відліку.",
  },
  {
    key: "challenge",
    label: "Що може спростувати мій прогноз?",
    hint: "Опиши результат, після якого доведеться переглянути припущення.",
  },
] as const;
export const inquiryEvidence = [
  {
    key: "comparison",
    label: "Які числа підтримують моє пояснення?",
    hint: "Порівняй щонайменше два рядки: шлях, час і обчислену швидкість. Наведи числа з одиницями.",
  },
  {
    key: "uncertainty",
    label: "Що ще могло вплинути на результат?",
    hint: "Чи могла різниця виникнути через реакцію, зміну умов або неточність вимірювання? Якщо незвичних значень немає, теж поясни це.",
  },
  {
    key: "verification",
    label: "Як я перевірив сумнівний результат?",
    hint: "Опиши повторний запуск або перевірку одиниць і обчислень. Якщо повторити неможливо, вкажи, чого бракує для перевірки.",
  },
] as const;
export const inquiryReflection = [
  {
    key: "revision",
    label: "Що сталося з моїм початковим прогнозом?",
    hint: "Я залишаю / уточнюю / змінюю думку, тому що… Посилайся на конкретні дані.",
  },
  {
    key: "nextTest",
    label: "Який наступний дослід допоможе перевірити висновок?",
    hint: "Назви одну зміну й результат, якого очікуєш. Укажи, де межі твого висновку.",
  },
] as const;
export const inquiryConclusions = [
  "Твердження: яку відповідь дають мої досліди на проблемне запитання?",
  "Докази: які два числові результати з одиницями підтримують твердження?",
  "Пояснення: як ці докази пов’язані з рухом кульки та формулою швидкості?",
  "Межі висновку: що впливає на точність і чого ці досліди не доводять?",
];
export const inquiryRubric = [
  {
    label: "План і контроль умов",
    hint: "Одна досліджувана зміна, сталі умови, спосіб вимірювання й умова перегляду прогнозу.",
  },
  {
    label: "Вимірювання, обчислення й одиниці",
    hint: "Зрозумілий спосіб фіксації часу, запис даних і перевірені обчислення.",
  },
  {
    label: "Докази й альтернативні пояснення",
    hint: "Порівняння числових результатів, розгляд інших причин і спосіб перевірки сумнівів.",
  },
  {
    label: "Висновок і перегляд думки",
    hint: "Зв’язок твердження з доказами, межі висновку та обґрунтоване збереження або уточнення прогнозу.",
  },
];
export const isRampInquiry = (content: LabContent) =>
  content.inquiry === "ramp-v1";
export function emptyRampInquiry(): RampInquiryAnswers {
  return {
    plan: { change: "", constants: "", measure: "", challenge: "" },
    evidence: { comparison: "", uncertainty: "", verification: "" },
    repeats: { distance: "", times: ["", "", ""], summary: "" },
    reflection: { revision: "", nextTest: "" },
  };
}
export function rampInquiryGaps(a: Answers) {
  const v = a.rampInquiry;
  const gaps: string[] = [];
  for (const field of inquiryPlan)
    if (!v?.plan[field.key]?.trim()) gaps.push(field.label);
  for (const field of inquiryEvidence)
    if (!v?.evidence[field.key]?.trim()) gaps.push(field.label);
  for (const field of inquiryReflection)
    if (!v?.reflection[field.key]?.trim()) gaps.push(field.label);
  if (
    !v?.snapshot?.prediction.trim() ||
    inquiryPlan.some((f) => !v.snapshot?.plan[f.key]?.trim())
  )
    gaps.push("Зафіксуйте початковий прогноз і план перевірки.");
  return gaps;
}
/** Stock v1 and teacher-authored text are never overwritten. */
export function inquiryContent(original: LabContent): LabContent {
  return {
    ...original,
    inquiry: "ramp-v1",
    purpose:
      "Дослідити середню швидкість кульки на різних відстанях, перевірити власний прогноз і обґрунтувати висновок вимірюваннями.",
    prediction:
      "Чи однакова середня швидкість кульки на різних відстанях від того самого старту за сталого нахилу? Передбач результат і поясни, на чому ґрунтується твоя думка.",
    creative:
      "Перевір твердження «Важча кулька завжди скочується швидше». Склади окремий план: збережи шлях, нахил і діаметр; порівняй сталеву та пластмасову суцільні кульки в повітрі й без опору. Чи вистачає точності ручного секундоміра для виявленої різниці? Які дані допоможуть відрізнити вплив умов руху від похибки реакції? Обмеж висновок умовами перевірки.",
  };
}
