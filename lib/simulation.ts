import { rampBallProperties, rampMaterials, rampMotion } from "./ramp";

/** Deterministic educational models. SI inside each model; displayed units match the worksheet. */
// Unchanged models keep v1. Air resistance on the ramp is explicitly versioned as v2.
export const MODEL_VERSION = 1 as const;
export function simulationModelVersion(n: number, p: Parameters): 1 | 2 {
  return n === 1 && p.airResistance === 1 ? 2 : MODEL_VERSION;
}
export const G = 10; // Same classroom approximation as the worksheets.
export type Parameters = Record<string, number>;
export type SimulationControl = {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  options?: string[];
};
export type SimulationSetup = {
  controls: SimulationControl[];
  assumption: string;
  instruction: string;
};
export type SimulationResult = {
  modelVersion: 1 | 2;
  readings: Record<string, string>;
  duration: number;
  canRecord: boolean;
  message: string;
  values: Record<string, number>;
};
export type SimulationRecord = {
  modelVersion: 1 | 2;
  labNumber: number;
  experimentId: string;
  rowIndex: number;
  parameters: Parameters;
  readings: Record<string, string>;
  recordedAt: string;
};
export const weights = [
  { key: "w100", mass: 100, label: "100 г" },
  { key: "w50", mass: 50, label: "50 г" },
  { key: "w20", mass: 20, label: "20 г" },
  { key: "w10", mass: 10, label: "10 г" },
  { key: "w5", mass: 5, label: "5 г" },
  { key: "w2", mass: 2, label: "2 г" },
  { key: "w1", mass: 1, label: "1 г" },
  { key: "w500mg", mass: 0.5, label: "500 мг" },
  { key: "w200mg", mass: 0.2, label: "200 мг" },
  { key: "w50mg", mass: 0.05, label: "50 мг" },
  { key: "w20mg", mass: 0.02, label: "20 мг" },
  { key: "w10mg", mass: 0.01, label: "10 мг" },
];
export const balanceObjects = [
  { name: "Навушники", mass: 46.47 },
  { name: "Брусок", mass: 85.2 },
  { name: "Камінець", mass: 125.5 },
  { name: "Монета", mass: 12.04 },
];
const c = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  unit = "",
): SimulationControl => ({ key, label, min, max, step, value, unit });
const select = (
  key: string,
  label: string,
  options: string[],
  value = 0,
): SimulationControl => ({
  ...c(key, label, 0, options.length - 1, 1, value),
  options,
});
export function simulationSetup(
  lab: number,
  experiment: string,
): SimulationSetup {
  const cycle = c("cycles", "Повних циклів", 10, 30, 10, 10);
  const samples = select("sample", "Невідомий зразок", [
    "Зразок A",
    "Зразок B",
    "Зразок C",
  ]);
  switch (lab) {
    case 1:
      return {
        controls: [
          c("angle", "Нахил жолоба", 5, 35, 1, 15, "°"),
          c("distance", "Довжина шляху", 0.2, 2, 0.1, 1.2, "м"),
          select(
            "material",
            "Матеріал кульки",
            rampMaterials.map((material) => material.name),
          ),
          c("diameter", "Діаметр кульки", 10, 50, 1, 20, "мм"),
          select(
            "airResistance",
            "Умови руху",
            ["Ідеальні умови · без опору", "У повітрі · з опором"],
            1,
          ),
        ],
        assumption:
          "Обидві кульки суцільні й однорідні, котяться без проковзування; g = 10 м/с². В ідеальному режимі a₀ = (5/7)g sin α, час не залежить від матеріалу й діаметра. У режимі повітря Fоп = ½ρпов Cd S v²; ρпов = 1,2 кг/м³, Cd = 0,47, S = πd²/4. Прискорення dv/dt = a₀ − bv², b = ρпов Cd S/(2·1,4m). Маса m = ρπd³/6; сталь — 7800 кг/м³, поліпропілен — 900 кг/м³. Cd сталий: це навчальне наближення. Опір коченню, деформації, підйомна сила повітря та профіль жолоба не враховані.",
        instruction:
          "Зліва встановіть нахил жолоба, справа — шлях до фінішу. Довжина лінійки — 2 м. Запустіть кульку, зніміть шлях і час. Оберіть сталеву або пластмасову кульку, змініть діаметр і спостерігайте за масою. Порівняйте ідеальний режим та опір повітря. Для трьох рядків основного досліду зберігайте умови руху, кульку, її діаметр і нахил сталими; зменшуйте тільки шлях.",
      };
    case 2:
      return {
        controls: [
          c("radius", "Радіус кола", 0.1, 0.3, 0.05, 0.15, "м"),
          c("speed", "Лінійна швидкість", 0.3, 1.5, 0.1, 0.6, "м/с"),
          cycle,
        ],
        assumption:
          "Кінематична модель рівномірного руху: t = N·2πr/v. Радіус і швидкість задаються незалежно; натяг і довжина реальної нитки не моделюються. Відлік починається з 0, повний оберт — повернення до мітки.",
        instruction:
          "Зберігайте радіус і швидкість. Порівняйте час для 10, 20 і 30 обертів.",
      };
    case 3:
      return {
        controls: [
          ...(experiment === "length"
            ? [c("length", "Довжина маятника", 0.25, 1, 0.25, 0.5, "м")]
            : []),
          ...(experiment === "amplitude"
            ? [c("amplitude", "Амплітуда", 0.02, 0.06, 0.005, 0.025, "м")]
            : []),
          ...(experiment === "mass"
            ? [c("mass", "Маса кульки", 0.05, 0.25, 0.05, 0.1, "кг")]
            : []),
          cycle,
        ],
        assumption:
          "Нитяний маятник за малих кутів: T ≈ 2π√(l/g), g = 10 м/с². Довжина — від підвісу до центра кульки; A — дугова амплітуда. Затухання й поправку на скінченну амплітуду не враховано. Нижня шкала відхилення збільшена окремо.",
        instruction:
          "У цій серії змінюйте лише досліджувану величину. Інші умови залишаються сталими.",
      };
    case 4:
      return {
        controls: [
          select(
            "object",
            "Тіло на лівій шальці",
            balanceObjects.map((o) => o.name),
          ),
          ...weights.map((w) => c(w.key, w.label, 0, 10, 1, 0)),
        ],
        assumption:
          "Ідеальні рівноплечі терези, маси важків точні. Умова рівноваги моделі: різниця мас за модулем менша за 0,005 г. Це поріг моделі, а не оцінка похибки реальних терезів.",
        instruction:
          "Доберіть важки на праву шальку до рівноваги. Суму їхніх мас обчисліть самостійно.",
      };
    case 5:
      return {
        controls:
          experiment === "regular"
            ? [
                samples,
                c("l", "Довжина", 2, 8, 0.5, 4, "см"),
                c("d", "Ширина", 1, 5, 0.5, 2, "см"),
                c("h", "Висота", 1, 5, 0.5, 2, "см"),
              ]
            : experiment === "irregular"
              ? [
                  samples,
                  c("size", "Масштаб зразка", 0.5, 1.5, 0.1, 1),
                  c("water", "Початковий об’єм води", 50, 150, 10, 100, "см³"),
                ]
              : [
                  select("sample", "Невідома рідина", [
                    "Рідина A",
                    "Рідина B",
                    "Рідина C",
                  ]),
                  c("volume", "Об’єм рідини", 50, 150, 10, 100, "см³"),
                ],
        assumption:
          "Однорідні зразки; повне занурення без бульбашок і розчинення. Рідини та тіла нестисливі. Об’єм неправильного зразка масштабується як куб розміру. Плаваючий зразок утримується під водою тонкою спицею, її об’ємом знехтувано.",
        instruction:
          "Зніміть покази приладів. Об’єм, масу рідини та густину розрахуйте у таблиці.",
      };
    case 6:
      return {
        controls: [
          select("material", "Пружний елемент", [
            "Гумовий шнур",
            "Ідеальна пружина",
          ]),
          c("mass", "Маса вантажу", 0, 400, 100, 100, "г"),
          c("initial", "Початкова довжина", 10, 25, 1, 15, "см"),
        ],
        assumption:
          "Оборотне розтягнення: для гуми F = 20x + 25000x³ (x у метрах), для пружини F = 20x. Пластичність, гістерезис і коливання після навантаження не моделюються.",
        instruction:
          "Послідовно підвішуйте 100–400 г. Потім установіть 0 г і перевірте повернення довжини.",
      };
    case 7:
      return {
        controls: [
          select("surface", "Поверхні", [
            "Дерево по дереву",
            "Шорстке дерево",
            "Гладке дерево",
          ]),
          c("loads", "Кількість тягарців", 1, 3, 1, 1),
          select("side", "Положення бруска", [
            "Широкою гранню",
            "Вузькою гранню",
          ]),
        ],
        assumption:
          "Горизонтальне рівномірне ковзання: F = μN. μ = 0,25; 0,45; 0,15 для вибраних модельних поверхонь. Маса бруска 200 г, тягарця — 100 г. Тертя спокою не моделюється.",
        instruction:
          "Тягніть брусок із різним навантаженням. Для порівняння площі змініть грань за тих самих умов.",
      };
    case 8:
      return {
        controls: [
          c("l", "Довжина бруска", 0.06, 0.12, 0.01, 0.08, "м"),
          c("d", "Ширина", 0.03, 0.05, 0.01, 0.04, "м"),
          c("h", "Висота", 0.01, 0.02, 0.005, 0.02, "м"),
          ...(experiment === "area"
            ? [
                select("face", "Опорна грань", [
                  "Довжина × ширина",
                  "Довжина × висота",
                  "Ширина × висота",
                ]),
              ]
            : [c("loads", "Кількість тягарців", 1, 3, 1, 1)]),
        ],
        assumption:
          "Статична опора, рівномірно розподілений тиск p = F/S. Маса бруска — 200 г, кожного тягарця — 100 г. Деформацією опори знехтувано.",
        instruction:
          experiment === "area"
            ? "Поверніть брусок трьома різними гранями. Не змінюйте його розміри між вимірюваннями."
            : "Брусок стоїть на найбільшій грані. Змінюйте тільки число тягарців.",
      };
    case 9:
      return {
        controls: [
          samples,
          c("volume", "Об’єм зразка", 20, 100, 10, 50, "см³"),
        ],
        assumption:
          "Повне занурення у воду 1000 кг/м³ без контакту з посудиною: P₁ = ρVg; P₂ = P₁ − ρводиVg. Виштовхування повітрям і масою нитки знехтувано.",
        instruction:
          "Порівняйте динамометр у повітрі та після повного занурення. Густину обчисліть самостійно.",
      };
    case 10:
      return {
        controls: [
          c("volume", "Зовнішній об’єм пробірки", 40, 80, 10, 50, "см³"),
          c("sand", "Маса піску", 0, 80, 1, 40, "г"),
          select("liquid", "Рідина", ["Вода", "Солона вода (творче завдання)"]),
        ],
        assumption:
          "Пробірка закрита, порожня маса — 20 г, повний об’єм сталий. Густина води — 1 г/см³, солоної — 1,03 г/см³. На дні враховано реакцію опори; у рівновазі на поверхні FА = mg.",
        instruction:
          "Піском змінюйте масу: одержіть потопання, нейтральну плавучість і плавання на поверхні. Сіль використовуйте для творчого порівняння.",
      };
    default:
      throw new Error("Невідома лабораторна робота");
  }
}
export const initialParameters = (n: number, e: string): Parameters =>
  Object.fromEntries(
    simulationSetup(n, e).controls.map((c) => [c.key, c.value]),
  );
export function validateParameters(n: number, e: string, p: Parameters) {
  const controls = simulationSetup(n, e).controls;
  if (Object.keys(p).some((k) => !controls.some((c) => c.key === k)))
    return false;
  const legacyRamp =
    n === 1 && !Object.hasOwn(p, "material") && !Object.hasOwn(p, "diameter");
  if (
    n === 1 &&
    Object.hasOwn(p, "airResistance") &&
    (!Object.hasOwn(p, "material") || !Object.hasOwn(p, "diameter"))
  )
    return false;
  return controls.every((c) => {
    if (
      n === 1 &&
      c.key === "airResistance" &&
      !Object.hasOwn(p, "airResistance")
    )
      return true;
    if (legacyRamp && ["material", "diameter"].includes(c.key)) return true;
    const v = p[c.key];
    return (
      Number.isFinite(v) &&
      v >= c.min - 1e-8 &&
      v <= c.max + 1e-8 &&
      Math.abs((v - c.min) / c.step - Math.round((v - c.min) / c.step)) < 1e-6
    );
  });
}
const fmt = (x: number) => String(Number(x.toFixed(5)));
export function simulate(
  n: number,
  e: string,
  p: Parameters,
): SimulationResult {
  if (!validateParameters(n, e, p))
    throw new Error("Некоректні параметри моделі");
  let readings: Record<string, string> = {},
    values: Record<string, number> = {},
    duration = 2,
    canRecord = true,
    message = "Покази приладів готові. Розрахункові поля заповніть самостійно.";
  switch (n) {
    case 1: {
      const motion = rampMotion(
          p.distance,
          p.angle,
          p.material ?? 0,
          p.diameter ?? 20,
          p.airResistance ?? 0,
          G,
        ),
        a = motion.a,
        t = motion.time;
      readings = { l: fmt(p.distance), t: fmt(t) };
      const ball = rampBallProperties(p.material ?? 0, p.diameter ?? 20);
      values = {
        a,
        t,
        distance: p.distance,
        angle: p.angle,
        ...ball,
        material: p.material ?? 0,
        airResistance: p.airResistance ?? 0,
        b: motion.b,
        idealTime: motion.idealTime,
      };
      duration = t;
      break;
    }
    case 2: {
      const t = (p.cycles * 2 * Math.PI * p.radius) / p.speed;
      readings = { N: fmt(p.cycles), t: fmt(t) };
      values = { cycles: p.cycles, t, radius: p.radius };
      duration = t;
      break;
    }
    case 3: {
      const l = p.length ?? 1,
        A = p.amplitude ?? 0.025,
        m = p.mass ?? 0.1,
        T = 2 * Math.PI * Math.sqrt(l / G),
        t = T * p.cycles;
      readings = {
        l: fmt(l),
        A: fmt(A),
        m: fmt(m),
        N: fmt(p.cycles),
        t: fmt(t),
      };
      values = { length: l, amplitude: A, mass: m, T, t, cycles: p.cycles };
      duration = t;
      break;
    }
    case 4: {
      const object = balanceObjects[p.object],
        total = weights.reduce((s, w) => s + (p[w.key] ?? 0) * w.mass, 0),
        difference = object.mass - total;
      canRecord = Math.abs(difference) < 0.005;
      readings = {
        object: object.name,
        weights: weights
          .filter((w) => p[w.key] > 0)
          .map((w) => `${p[w.key]} × ${w.label}`)
          .join(" + "),
      };
      values = { difference, total };
      message = canRecord
        ? "Терези в рівновазі. Обчисліть суму мас важків."
        : difference > 0
          ? "Ліва шалька нижче: додайте важки."
          : "Права шалька нижче: заберіть зайві важки.";
      break;
    }
    case 5: {
      const rho = [0.7, 2.7, 7.8][p.sample];
      if (e === "regular") {
        const V = p.l * p.d * p.h;
        readings = { m: fmt(rho * V), l: fmt(p.l), d: fmt(p.d), h: fmt(p.h) };
        values = { V, m: rho * V };
      } else if (e === "irregular") {
        const V = 20 * p.size ** 3;
        readings = { m: fmt(rho * V), V1: fmt(p.water), V2: fmt(p.water + V) };
        values = { V, V1: p.water, V2: p.water + V, m: rho * V };
      } else {
        const m1 = 60,
          rhoLiquid = [1, 0.92, 1.26][p.sample];
        readings = {
          m1: fmt(m1),
          m2: fmt(m1 + rhoLiquid * p.volume),
          V: fmt(p.volume),
        };
        values = { V: p.volume, m1, m2: m1 + rhoLiquid * p.volume };
      }
      break;
    }
    case 6: {
      const F = (p.mass / 1000) * G,
        beta = p.material === 0 ? 25000 : 0;
      let low = 0,
        high = F / 20;
      for (let i = 0; i < 60; i++) {
        const x = (low + high) / 2;
        if (20 * x + beta * x ** 3 < F) low = x;
        else high = x;
      }
      const x = (low + high) / 2;
      readings = {
        m: fmt(p.mass),
        F: fmt(F),
        l0: fmt(p.initial),
        l: fmt(p.initial + 100 * x),
      };
      values = { F, x, length: p.initial / 100 + x };
      canRecord = p.mass > 0;
      if (!canRecord)
        message =
          "Вантаж знято: шнур повернувся до початкової довжини. Запишіть спостереження у висновку.";
      break;
    }
    case 7: {
      const N = (0.2 + 0.1 * p.loads) * G,
        mu = [0.25, 0.45, 0.15][p.surface],
        F = mu * N;
      readings = { N: fmt(N), F: fmt(F) };
      values = { N, F, side: p.side };
      break;
    }
    case 8: {
      const [a, b] =
          e === "area"
            ? [
                [p.l, p.d],
                [p.l, p.h],
                [p.d, p.h],
              ][p.face]
            : [p.l, p.d],
        S = a * b,
        F = (0.2 + (e === "load" ? 0.1 * p.loads : 0)) * G;
      readings =
        e === "area"
          ? { F: fmt(F), a: fmt(a), b: fmt(b) }
          : { S: fmt(S), F: fmt(F) };
      values = {
        a,
        b,
        S,
        F,
        pressure: F / S,
        face: p.face ?? 0,
        loads: p.loads ?? 0,
      };
      break;
    }
    case 9: {
      const rho = [2700, 7870, 8960][p.sample],
        V = p.volume * 1e-6,
        P1 = rho * V * G,
        P2 = P1 - 1000 * V * G;
      readings = {
        object: `Зразок ${["A", "B", "C"][p.sample]}`,
        P1: fmt(P1),
        P2: fmt(P2),
      };
      values = { P1, P2, V: p.volume };
      break;
    }
    case 10: {
      const m = 20 + p.sand,
        rho = m / p.volume,
        fluid = p.liquid === 0 ? 1 : 1.03,
        weight = (m / 1000) * G,
        maxBuoyancy = ((fluid * p.volume) / 1000) * G;
      const state = Math.abs(rho - fluid) < 1e-8 ? 0 : rho > fluid ? 1 : -1;
      readings = {
        V: fmt(p.volume),
        m: fmt(m),
        state:
          state === 0
            ? "ρтіла = ρрідини; рівновага всередині"
            : state > 0
              ? "ρтіла > ρрідини; тоне, потім спирається на дно"
              : "ρтіла < ρрідини; рівновага на поверхні",
      };
      values = {
        state,
        fraction: Math.min(1, rho / fluid),
        weight,
        buoyancy: Math.min(weight, maxBuoyancy),
        support: Math.max(0, weight - maxBuoyancy),
      };
      canRecord = p.liquid === 0;
      message = canRecord
        ? readings.state
        : "Солона вода — додаткове дослідження. Для основної таблиці поверніть звичайну воду.";
      break;
    }
  }
  return {
    modelVersion: simulationModelVersion(n, p),
    readings,
    values,
    duration,
    canRecord,
    message,
  };
}
/** Validate provenance, not authenticity: these remain synthetic model data. */
export function validateSimulationRecords(
  labNumber: number,
  experiments: {
    id: string;
    rows: string[];
    fields: { key: string; calculated?: unknown }[];
  }[],
  records: SimulationRecord[],
): string | null {
  const seen = new Set<string>();
  for (const r of records) {
    const e = experiments.find((e) => e.id === r.experimentId),
      key = r.experimentId + ":" + r.rowIndex;
    if (
      r.labNumber !== labNumber ||
      r.modelVersion !== simulationModelVersion(labNumber, r.parameters) ||
      !e ||
      !Number.isInteger(r.rowIndex) ||
      r.rowIndex < 0 ||
      r.rowIndex >= e.rows.length ||
      seen.has(key)
    )
      return "Некоректне джерело віртуального вимірювання.";
    seen.add(key);
    try {
      const result = simulate(labNumber, e.id, r.parameters);
      if (!result.canRecord)
        return "Ці покази не можна перенести в основну таблицю.";
      const keys = e.fields
        .filter((f) => !f.calculated && result.readings[f.key] !== undefined)
        .map((f) => f.key);
      if (
        Object.keys(r.readings).length !== keys.length ||
        keys.some((k) => r.readings[k] !== result.readings[k])
      )
        return "Покази моделі не відповідають її параметрам.";
    } catch {
      return "Некоректні параметри віртуального досліду.";
    }
  }
  return null;
}
