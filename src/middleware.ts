import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const ROUTES_PUBLIQUES = ["/connexion", "/inscription"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const estPublique = ROUTES_PUBLIQUES.some((r) => pathname.startsWith(r));

  if (!session?.user) {
    if (estPublique) return NextResponse.next();
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  const estManager = session.user.role === "MANAGER";

  if (estPublique) {
    return NextResponse.redirect(
      new URL(estManager ? "/manager" : "/mon-espace", req.nextUrl.origin),
    );
  }

  // Isolation stricte : l'espace manager est inaccessible aux membres.
  if (pathname.startsWith("/manager") && !estManager) {
    return NextResponse.redirect(new URL("/mon-espace", req.nextUrl.origin));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(estManager ? "/manager" : "/mon-espace", req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
