import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("__session")?.value;
  const roleCookie = request.cookies.get("user_role")?.value; // "student" | "driver" | "admin"

  const isAuthRoute = pathname.startsWith("/login");
  const isStudentRoute = pathname.startsWith("/dashboard");
  const isDriverRoute = pathname.startsWith("/trip");
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isProtectedApi = pathname.startsWith("/api/") && !isApiAuth;

  // Unauthenticated user trying to access protected routes
  if (!sessionCookie) {
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

  // Authenticated user on login or root page: redirect to role's home view
  if (isAuthRoute || pathname === "/") {
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
