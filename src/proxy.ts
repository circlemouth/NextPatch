import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedLocalContextFromCookieHeader } from "@/server/auth/session";
import { getLoginPath, isProtectedPath, isPublicPath, sanitizeNextPath } from "@/server/auth/redirects";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authenticated = await getAuthenticatedLocalContextFromCookieHeader(request.headers.get("cookie"));

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url), 303);
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isProtectedPath(pathname)) {
    const loginUrl = new URL(getLoginPath(sanitizeNextPath(`${pathname}${request.nextUrl.search}`)), request.url);
    return NextResponse.redirect(loginUrl, 303);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)", "/api/:path*"]
};
