/**
 * Site helpers for GitHub Pages / static export.
 * When NEXT_PUBLIC_STATIC_EXPORT=1, the app reads JSON from /data/processed
 * in the browser instead of calling Node API routes.
 */

export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
}

/** Prefix a root-relative path with the Pages basePath when set. */
export function withBase(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!path.startsWith("/")) return path;
  if (!base) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

export function dataUrl(...parts: string[]) {
  const joined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return withBase(`/data/processed/${joined}`);
}
