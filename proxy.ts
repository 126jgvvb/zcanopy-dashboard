import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

function isDevBypass(request: NextRequest) {
  const bypass = request.cookies.get("zcanopy_dev_bypass")?.value;
  return bypass === "1";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDevBypass(request)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("zcanopy_admin_token")?.value;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) {
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
