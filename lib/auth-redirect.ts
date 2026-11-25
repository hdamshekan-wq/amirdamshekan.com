const LOCAL_BASE = "https://auth.invalid";

/** Accept root-relative destinations only, including after URL normalization. */
export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/account";
  // Backslashes and control characters can change how browsers parse a URL.
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return "/account";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/account";
    const url = new URL(value, LOCAL_BASE);
    if (url.origin !== LOCAL_BASE || url.pathname.startsWith("//")) return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}

/** Email destinations come from trusted configuration, never request headers. */
export function authSiteOrigin(siteUrl: string | undefined, production: boolean): string {
  if (!siteUrl && !production) return "http://localhost:3000";
  try {
    if (!siteUrl || siteUrl !== siteUrl.trim()) throw new Error();
    const url = new URL(siteUrl);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        (url.protocol !== "https:" && !(url.protocol === "http:" && local && !production))) throw new Error();
    return url.origin;
  } catch {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to a valid HTTPS site origin before using email authentication.");
  }
}
