import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { Shell } from "@/components/shell";
import { LabGrid } from "@/components/lab-grid";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
export default async function Library() {
  const u = await currentUser();
  if (!u) redirect("/");
  const all = await db.labVersion.findMany({
    where: { OR: [{ authorId: null }, { authorId: u.id }] },
    orderBy: [{ number: "asc" }, { version: "desc" }],
    distinct: ["number"],
  });
  return (
    <Shell title="Бібліотека досліджень">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ДОСЛІДЖУЙТЕ СВІТ</div>
          <h1>Лабораторні роботи</h1>
          <p>Десять досліджень. Від руху кульки до умов плавання тіл.</p>
        </div>
        <span className="pill">10 РОБІТ · 4 ТЕМИ</span>
      </div>
      <LabGrid
        library
        cards={all.map((l) => ({
          ...labs.find((x) => x.number === l.number)!,
          id: l.id,
          title: l.title,
          version: l.version,
        }))}
      />
    </Shell>
  );
}
