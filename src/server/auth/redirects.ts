export const DEFAULT_AUTH_REDIRECT_PATH = "/repositories";

export function sanitizeNextPath(input: string | null | undefined): string {
  if (!input) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  const trimmed = input.trim();
  if (isUnsafeNextPath(trimmed)) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  try {
    const parsed = new URL(trimmed, "http://nextpatch.local");
    if (parsed.origin !== "http://nextpatch.local" || !parsed.pathname.startsWith("/")) {
      return DEFAULT_AUTH_REDIRECT_PATH;
    }

    const safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (isUnsafeNextPath(safePath)) {
      return DEFAULT_AUTH_REDIRECT_PATH;
    }

    return safePath;
  } catch {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }
}

function isUnsafeNextPath(value: string): boolean {
  return !value || value.startsWith("//") || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) || !value.startsWith("/");
}

export function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/_next/")
  ) {
    return true;
  }

  return false;
}

export function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/api/export/")) return true;

  return [
    "/dashboard",
    "/repositories",
    "/work-items",
    "/inbox",
    "/capture",
    "/ideas",
    "/tech-notes",
    "/references",
    "/settings"
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getLoginPath(nextPath?: string | null, error?: string | null) {
  const url = new URL("http://nextpatch.local/login");
  const safeNext = sanitizeNextPath(nextPath);
  if (safeNext) {
    url.searchParams.set("next", safeNext);
  }
  if (error) {
    url.searchParams.set("error", error);
  }
  return `${url.pathname}${url.search}`;
}
