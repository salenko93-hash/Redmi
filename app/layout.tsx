import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "ФізЛаб — простір досліджень", template: "%s · ФізЛаб" },
  description:
    "Десять лабораторних робіт із фізики. Досліджуйте, вимірюйте та робіть власні відкриття.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
