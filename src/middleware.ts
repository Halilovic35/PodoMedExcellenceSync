import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE } from "@/lib/session-token";

const protectedPrefixes = ["/home", "/appointments", "/documents", "/chat"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/appointments/:path*", "/documents/:path*", "/chat/:path*"],
};
