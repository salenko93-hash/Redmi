import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export const hashToken = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export async function currentUser() {
  const token = (await cookies()).get("fizlab_session")?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  return s && s.expiresAt > new Date() && s.user.isActive && !s.user.deletedAt
    ? {
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
        role: s.user.role,
        isAdmin: s.user.isAdmin,
      }
    : null;
}
export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.$transaction(async (tx) => {
    // Share the user-row lock with access changes so a blocked login cannot leave a live session.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { isActive: true, deletedAt: true },
    });
    if (!user?.isActive || user.deletedAt) throw new Error("ACCOUNT_DISABLED");
    await tx.session.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    });
  });
  (await cookies()).set("fizlab_session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("fizlab_session")?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete("fizlab_session");
}
export async function rateLimit(key: string, max = 10) {
  const result = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" (key,count,"resetAt") VALUES (${key},1,NOW()+INTERVAL '15 minutes') ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit".count+1 END, "resetAt"=CASE WHEN "RateLimit"."resetAt" < NOW() THEN NOW()+INTERVAL '15 minutes' ELSE "RateLimit"."resetAt" END RETURNING count`;
  return result[0].count <= max;
}
