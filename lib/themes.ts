export const THEME_COOKIE = "fizlab-theme";
export const themes = [
  {
    id: "forest",
    label: "Лісова",
    description: "Зелень і спокій",
    accent: "#295541",
    preview: "#eaf0e5",
  },
  {
    id: "ocean",
    label: "Океан",
    description: "Блакитна свіжість",
    accent: "#205677",
    preview: "#e5f0f8",
  },
  {
    id: "lavender",
    label: "Лаванда",
    description: "М’який фіолетовий",
    accent: "#674487",
    preview: "#efe8f7",
  },
  {
    id: "sunrise",
    label: "Сонячна",
    description: "Теплий бурштин",
    accent: "#805321",
    preview: "#f8eedc",
  },
  {
    id: "rose",
    label: "Троянда",
    description: "Пудровий рожевий",
    accent: "#8a405d",
    preview: "#f8e7ef",
  },
] as const;
export type ThemeId = (typeof themes)[number]["id"];
export function resolveTheme(value: unknown): ThemeId {
  return themes.find((theme) => theme.id === value)?.id ?? "forest";
}
