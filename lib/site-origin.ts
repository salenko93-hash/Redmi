/** Public address only; discard credentials, paths and queries before rendering or configuring dev resources. */
export function publicSiteOrigin(
  value: string | undefined,
): string | undefined {
  try {
    const url = new URL(value ?? "");
    return ["http:", "https:"].includes(url.protocol) ? url.origin : undefined;
  } catch {
    return undefined;
  }
}
export function developmentOrigins(value: string | undefined): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]),
    origin = publicSiteOrigin(value);
  if (origin) hosts.add(new URL(origin).hostname);
  return [...hosts];
}
