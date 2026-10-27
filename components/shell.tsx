import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navigation } from "./nav";
import { Bell, GraduationCap } from "lucide-react";
export async function Shell({
  children,
  title = "Навчальний простір",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  return (
    <div className="app-shell">
      <Navigation name={user.name} role={user.role} isAdmin={user.isAdmin} />
      <div className="main-wrapper">
        <header className="topbar">
          <span>{title}</span>
          <div className="topbar-right">
            <span className="term">
              <GraduationCap size={16} /> Фізика · Лабораторний практикум
            </span>
            <Link href="/account" className="role-pill">
              {user.role === "TEACHER" ? "Кабінет учителя" : "Кабінет учня"}
            </Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="footer">
          <span>ФізЛаб · Простір для допитливих</span>
          <span>Спостерігай. Досліджуй. Розумій.</span>
        </footer>
      </div>
    </div>
  );
}
