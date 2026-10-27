import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { adminOverview } from "@/lib/admin";
import { Shell } from "@/components/shell";
import { AdminPanel } from "@/components/admin-panel";
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/");
  if (!user.isAdmin || user.role !== "TEACHER") notFound();
  const data = await adminOverview();
  return (
    <Shell title="Адміністрування">
      <div className="page-heading">
        <div>
          <div className="eyebrow">НАВЧАЛЬНИЙ ПРОСТІР · КЕРУВАННЯ</div>
          <h1>Команда та доступ</h1>
          <p>Запрошуйте колег, керуйте доступом і перевіряйте стан системи.</p>
        </div>
      </div>
      <AdminPanel data={data} userId={user.id} />
    </Shell>
  );
}
