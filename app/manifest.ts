import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ФізЛаб — простір досліджень",
    short_name: "ФізЛаб",
    description: "Цифровий лабораторний зошит із фізики",
    lang: "uk",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7f3",
    theme_color: "#295541",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
