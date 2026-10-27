export type MatterState = "solid" | "liquid" | "gas";
export type DensityEntry = {
  name: string;
  density: number;
  state: MatterState;
  note?: string;
};
// Rounded educational values from the supplied reference. Gas values: 0 °C, 760 mmHg.
const solids: [string, number][] = [
  ["Алюміній", 2700],
  ["Бетон", 2200],
  ["Граніт", 2700],
  ["Дуб сухий", 800],
  ["Залізо", 7800],
  ["Золото", 19300],
  ["Іридій", 22400],
  ["Капрон", 1140],
  ["Корок", 240],
  ["Крейда", 2400],
  ["Латунь", 8500],
  ["Лід", 900],
  ["Мармур", 2500],
  ["Мідь", 8900],
  ["Олово", 7300],
  ["Оргскло", 1200],
  ["Осмій", 22500],
  ["Парафін", 900],
  ["Платина", 21500],
  ["Поліетилен", 940],
  ["Порцеляна", 2300],
  ["Свинець", 11300],
  ["Скло", 2500],
  ["Сосна суха", 440],
  ["Срібло", 10500],
  ["Сталь", 7800],
  ["Цинк", 7100],
  ["Чавун", 7000],
];
const liquids: [string, number, string?][] = [
  ["Ацетон", 790],
  ["Бензин", 710],
  ["Бензол", 880],
  ["Вода морська", 1030],
  ["Вода чиста", 1000],
  ["Гас", 800],
  ["Гліцерин", 1260],
  ["Дизельне паливо", 840],
  ["Мастило", 900],
  ["Мед", 1420],
  ["Олія", 900],
  ["Олово рідке", 6830, "За температури 409 °C"],
  ["Нафта", 800],
  ["Ртуть", 13600],
  ["Етанол (спирт)", 800],
  ["Сульфатна кислота", 1800, "Густина залежить від концентрації"],
];
const gases: [string, number][] = [
  ["Азот", 1.25],
  ["Водень", 0.09],
  ["Вуглекислий газ", 1.98],
  ["Гелій", 0.18],
  ["Кисень", 1.43],
  ["Повітря", 1.29],
  ["Чадний газ", 1.25],
  ["Хлор", 3.21],
];
export const densityEntries: DensityEntry[] = [
  ...solids.map(([name, density]) => ({
    name,
    density,
    state: "solid" as const,
  })),
  ...liquids.map(([name, density, note]) => ({
    name,
    density,
    note,
    state: "liquid" as const,
  })),
  ...gases.map(([name, density]) => ({ name, density, state: "gas" as const })),
];
export function densityInGramsPerCm3(kgPerM3: number) {
  return kgPerM3 / 1000;
}
