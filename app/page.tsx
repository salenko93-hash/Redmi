import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { publicSiteOrigin } from "@/lib/site-origin";
import { AuthForm } from "@/components/auth-form";
import { ThemePicker } from "@/components/theme-picker";
import { Atom, FlaskConical, ArrowUpRight } from "lucide-react";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const initialMode =
    (await searchParams).mode === "recover" ? "recover" : "login";
  const expectedOrigin = publicSiteOrigin(process.env.APP_URL);
  const host = (await headers()).get("host");
  const initialOriginMismatch = Boolean(
    expectedOrigin && host && new URL(expectedOrigin).host !== host,
  );
  if (await currentUser()) redirect("/dashboard");
  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Atom />
          </span>
          ФізЛаб.
        </a>
        <span className="pill light">ЦИФРОВИЙ ЛАБОРАТОРНИЙ ЗОШИТ</span>
        <h1>
          Світ сповнений
          <br />
          запитань.
          <br />
          <em>Досліджуй відповіді.</em>
        </h1>
        <p>
          Від першого вимірювання до власного відкриття — десять лабораторних
          робіт із фізики в одному просторі.
        </p>
        <div className="orbit-art">
          <div className="orbit-ring one" />
          <div className="orbit-ring two" />
          <div className="orbit-ring three" />
          <span className="orb-core">
            <FlaskConical size={58} strokeWidth={1.1} />
          </span>
          <span className="orb-dot a" />
          <span className="orb-dot b" />
          <span className="art-label">F = ma</span>
          <span className="art-label second">v = l / t</span>
        </div>
        <div className="story-foot">
          <span>10 лабораторних робіт</span>
          <span>
            Будь-який пристрій <ArrowUpRight size={16} />
          </span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-theme no-print">
          <ThemePicker compact />
        </div>
        <AuthForm
          key={initialMode}
          initialMode={initialMode}
          expectedOrigin={expectedOrigin}
          initialOriginMismatch={initialOriginMismatch}
        />
      </section>
    </div>
  );
}
