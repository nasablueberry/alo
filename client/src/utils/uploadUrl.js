/**
 * Resolves stored paths like /uploads/file.pdf to a URL the browser can load.
 * - Dev: Vite can proxy /uploads to the API, so a relative path works.
 * - Prod, SPA and API on different hosts: set VITE_API_URL to the API origin (e.g. https://api.example.com).
 * - Same origin (e.g. nginx serves both / and /uploads from Node): relative /uploads/... is fine without env.
 */
export function uploadUrl(relativePath) {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const base = import.meta.env.VITE_API_URL;
  if (base) {
    return `${String(base).replace(/\/$/, '')}${path}`;
  }
  return path;
}
