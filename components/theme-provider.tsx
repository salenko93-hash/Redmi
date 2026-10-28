"use client";
import { createContext, useContext, useState } from "react";
import { resolveTheme, THEME_COOKIE, type ThemeId } from "@/lib/themes";
const ThemeContext = createContext<{
  theme: ThemeId;
  saved: boolean;
  setTheme: (theme: ThemeId) => void;
} | null>(null);
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeId;
  children: React.ReactNode;
}) {
  const [theme, updateTheme] = useState(initialTheme),
    [saved, setSaved] = useState(true);
  function setTheme(next: ThemeId) {
    const value = resolveTheme(next);
    document.documentElement.dataset.theme = value;
    updateTheme(value);
    try {
      document.cookie = `${THEME_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      setSaved(
        document.cookie
          .split(";")
          .some((part) => part.trim() === `${THEME_COOKIE}=${value}`),
      );
    } catch {
      setSaved(false);
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, saved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider required");
  return context;
}
