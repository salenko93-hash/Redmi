import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { LibraryWorkspace } from "@/components/library-workspace";
import { TemplateEditor } from "@/components/template-editor";
import type { LabContent } from "@/lib/types";
import { isRampInquiry } from "@/lib/ramp-inquiry";
export default async function Lab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/");
  const lab = await db.labVersion.findUnique({
    where: { id: (await params).id },
  });
  if (!lab || (lab.authorId && lab.authorId !== u.id)) notFound();
  const content = lab.content as unknown as LabContent;
  const classic = isRampInquiry(content)
    ? await db.labVersion.findFirst({
        where: { number: 1, version: 1, authorId: null },
        select: { id: true },
      })
    : null;
  return (
    <Shell title="Бібліотека досліджень">
      <Link href="/library" className="back-link">
        ← Бібліотека
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            РОБОТА {lab.number} · ВЕРСІЯ {lab.version}
          </div>
          <h1>{lab.title}</h1>
          <p>
            Перегляд навчального шаблону. Для виконання відкрийте роботу,
            призначену вашому класу.
          </p>
        </div>
        <Link href="/classes" className="button primary">
          {u.role === "TEACHER" ? "Призначити класу" : "Мої класи"} →
        </Link>
      </div>
      {u.role === "TEACHER" && (
        <TemplateEditor id={lab.id} title={lab.title} content={content} />
      )}
      {classic && (
        <p className="no-print">
          Ця версія додає план перевірки, аналіз доказів і перегляд прогнозу.{" "}
          <Link href={`/library/${classic.id}`}>
            Відкрити попередній базовий варіант
          </Link>
        </p>
      )}
      <LibraryWorkspace
        title={lab.title}
        id={lab.id}
        userId={u.id}
        content={content}
        number={lab.number}
        teacher={u.role === "TEACHER"}
      />
    </Shell>
  );
}
