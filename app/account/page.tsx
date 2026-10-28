import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { AccountActions } from "@/components/account-actions";
import { ThemePicker } from "@/components/theme-picker";
export default async function Account() {
  const u = await currentUser();
  if (!u) redirect("/");
  return (
    <Shell title="Обліковий запис">
      <div className="page-heading">
        <div>
          <div className="eyebrow">МІЙ ПРОФІЛЬ</div>
          <h1>{u.name}</h1>
          <p>
            {u.email} ·{" "}
            {u.isAdmin
              ? "Учитель · адміністратор"
              : u.role === "TEACHER"
                ? "Учитель"
                : "Учень / учениця"}
          </p>
        </div>
      </div>
      <section className="panel">
        <h2>Кольорова тема</h2>
        <p>
          Оберіть палітру для свого робочого простору. Вибір зберігається в
          цьому браузері на цьому пристрої.
        </p>
        <ThemePicker />
      </section>
      <section className="panel">
        <h2>Доступ і приватність</h2>
        <p>
          Після виходу чернетки залишаються в цьому браузері, щоб їх можна було
          відновити. На спільному пристрої спочатку дочекайтеся серверного
          збереження й очистьте локальні дані.
        </p>
        <AccountActions userId={u.id} />
      </section>
    </Shell>
  );
}
