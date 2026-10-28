import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveTheme, THEME_COOKIE } from "@/lib/themes";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "./themes.css";
export const metadata: Metadata = {
  title: { default: "ФізЛаб — простір досліджень", template: "%s · ФізЛаб" },
  description:
    "Десять лабораторних робіт із фізики. Досліджуйте, вимірюйте та робіть власні відкриття.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="uk" data-theme={theme}>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
