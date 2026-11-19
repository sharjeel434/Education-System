const configuredBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api";
const apiUrl = new URL(configuredBase, window.location.origin);
const loopbackHosts = ["localhost", "127.0.0.1"];
if (loopbackHosts.includes(apiUrl.hostname) && loopbackHosts.includes(window.location.hostname)) {
  apiUrl.hostname = window.location.hostname;
}
const apiPath = apiUrl.pathname.replace(/\/+$/, "");
apiUrl.pathname = apiPath.endsWith("/api") ? apiPath : `${apiPath}/api`;
export const apiBase = apiUrl.toString().replace(/\/+$/, "");

export function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers);
  const method = String(options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-Requested-With", "XMLHttpRequest");
  return fetch(`${apiBase}${path}`, { ...options, method, headers, credentials: "include" });
}
