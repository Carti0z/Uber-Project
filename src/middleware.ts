import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "movee-default-secret"
);

const publicPaths = ["/", "/login", "/signup", "/register", "/forgot-password", "/reset-password"];

function homeForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "DRIVER") return "/driver";
  return "/rider";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const token = request.cookies.get("movee_session")?.value;
  let session: { role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as { role: string };
    } catch {
      session = null;
    }
  }

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (pathname === "/login" || pathname === "/signup" || pathname === "/register")) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (session && pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (session && pathname.startsWith("/rider") && session.role !== "RIDER") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (session && pathname.startsWith("/driver") && session.role !== "DRIVER") {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
