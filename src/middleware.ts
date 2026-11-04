import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("__session")?.value;
  const roleCookie = request.cookies.get("user_role")?.value; // "student" | "driver" | "admin"
  const authHeader = request.headers.get("authorization");
  const hasBearerToken = !!(authHeader && authHeader.startsWith("Bearer "));

  const isStudentRoute = pathname.startsWith("/dashboard");
  const isDriverRoute = pathname.startsWith("/trip");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/eta") ||
    (pathname.startsWith("/api/telemetry") && request.method === "GET");
  const isProtectedApi = pathname.startsWith("/api/") && !isPublicApi;

  // Unauthenticated user trying to access protected routes
  if (!sessionCookie && !hasBearerToken) {
    if (isStudentRoute || isDriverRoute || isAdminRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isProtectedApi) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Authenticated user on root page: redirect to role's home view
  if (pathname === "/") {
    if (roleCookie === "admin") {
      return NextResponse.redirect(new URL("/admin/trips", request.url));
    }
    if (roleCookie === "driver") {
      return NextResponse.redirect(new URL("/trip", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route authorization guards
  if (isAdminRoute && roleCookie !== "admin") {
    // Non-admin attempting to access admin route
    const redirectPath = roleCookie === "driver" ? "/trip" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (isDriverRoute && roleCookie !== "driver" && roleCookie !== "admin") {
    // Student attempting to access driver route
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/trip/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
