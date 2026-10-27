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
  ArrowUpRight,
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
    <>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-icon">
            <Atom size={26} />
          </span>
          ФізЛаб<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">НАВЧАЛЬНИЙ ПРОСТІР</div>
        <nav>
          {items.map(([href, label, Icon]) => (
            <Link
              className={"nav-link " + (path.startsWith(href) ? "active" : "")}
              key={href}
              href={href}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>
            Маленькі досліди.
            <br />
            Великі відкриття.
          </span>
          <Atom size={48} strokeWidth={0.8} />
          <p>
            Фізика починається
            <br />з вашого «чому?»
          </p>
        </div>
        <div className="profile">
          <span className="avatar">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{name}</strong>
            <small>
              {isAdmin
                ? "Учитель · адміністратор"
                : role === "TEACHER"
                  ? "Учитель"
                  : "Учень / учениця"}
            </small>
          </div>
          <button
            className="icon-button"
            aria-label="Вийти"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <nav className="mobile-nav">
        {items.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={path.startsWith(href) ? "active" : ""}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
