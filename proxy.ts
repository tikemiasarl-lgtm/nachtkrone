import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

/* =========================================================
   NACHTKRONE — PROTECTION DE L'ESPACE ADMIN
   ========================================================= */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* -------------------------------------------------------
     Récupération du cookie de session
     ------------------------------------------------------- */

  const sessionToken =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;

  /* -------------------------------------------------------
     Vérification de la session
     ------------------------------------------------------- */

  const session = await verifyAdminSessionToken(sessionToken);

  const isAuthenticated = session !== null;

  /* =======================================================
     PAGE DE CONNEXION
     ======================================================= */

  if (pathname === "/admin/login") {
    /*
     * Si l'administrateur possède déjà une session valide,
     * inutile de lui afficher de nouveau la connexion.
     */

    if (isAuthenticated) {
      const adminUrl = new URL("/admin", request.url);

      return NextResponse.redirect(adminUrl);
    }

    return NextResponse.next();
  }

  /* =======================================================
     ROUTES ADMIN PROTÉGÉES
     ======================================================= */

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    /*
     * Aucune session valide :
     * retour obligatoire vers la connexion.
     */

    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);

      /*
       * On conserve la page initialement demandée.
       *
       * Exemple :
       * /admin/products
       *
       * devient :
       * /admin/login?next=%2Fadmin%2Fproducts
       */

      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`
      );

      const response = NextResponse.redirect(loginUrl);

      /*
       * Si un ancien cookie invalide existe,
       * on le supprime immédiatement.
       */

      if (sessionToken) {
        response.cookies.set({
          name: ADMIN_SESSION_COOKIE,
          value: "",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }

      return response;
    }

    /*
     * Session valide :
     * accès autorisé à l'espace administrateur.
     */

    return NextResponse.next();
  }

  /* =======================================================
     AUTRES ROUTES
     ======================================================= */

  return NextResponse.next();
}

/* =========================================================
   MATCHER

   Le proxy ne s'exécute que sur l'espace /admin.
   Les API login/logout restent gérées par leurs route.ts.
   ========================================================= */

export const config = {
  matcher: ["/admin/:path*"],
};