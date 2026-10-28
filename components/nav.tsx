"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  NotebookPen,
  LogOut,
  Atom,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
export function Navigation({
  name,
  role,
  isAdmin = false,
}: {
  name: string;
  role: string;
  isAdmin?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const items = [
    ["/dashboard", "Мій простір", LayoutDashboard],
    ["/library", "Лабораторні роботи", BookOpen],
    ["/classes", role === "TEACHER" ? "Мої класи" : "Мій клас", Users],
    ...(role === "TEACHER"
      ? [["/journal", "Журнал оцінок", NotebookPen] as const]
      : []),
    ...(isAdmin ? [["/admin", "Адміністрування", ShieldCheck] as const] : []),
  ] as const;
  return (
    <header className="app-navigation no-print">
      <Link href="/dashboard" className="brand">
        <span className="brand-icon">
          <Atom size={24} />
        </span>
        ФізЛаб<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Головна навігація">
        {items.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={"nav-link " + (path.startsWith(href) ? "active" : "")}
            aria-current={path.startsWith(href) ? "page" : undefined}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <details className="nav-account">
        <summary>
          <span className="avatar">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="nav-account-name">
            <strong>{name}</strong>
            <small>
              {isAdmin
                ? "Учитель · адміністратор"
                : role === "TEACHER"
                  ? "Учитель"
                  : "Учень / учениця"}
            </small>
          </span>
          <ChevronDown size={15} />
        </summary>
        <div className="nav-account-menu">
          <Link href="/account">Мій обліковий запис</Link>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={16} />
            Вийти
          </button>
        </div>
      </details>
    </header>
  );
}
