import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionDeleteCookieOptions,
} from "@/lib/admin-auth";

/* =========================================================
   NACHTKRONE — DÉCONNEXION ADMIN
   POST /api/admin/logout
   ========================================================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   RÉPONSE D'ERREUR
   ========================================================= */

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/* =========================================================
   POST — DÉCONNEXION
   ========================================================= */

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Déconnexion réussie.",
        redirectTo: "/admin/login",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    /* -----------------------------------------------------
       Suppression complète du cookie de session
       ----------------------------------------------------- */

    const cookieOptions = getAdminSessionDeleteCookieOptions();

    response.cookies.set({
      name: cookieOptions.name,
      value: cookieOptions.value,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error(
      "[NACHTKRONE][ADMIN_LOGOUT]",
      error instanceof Error ? error.message : error
    );

    /*
     * Même en cas de problème inattendu, on tente de
     * supprimer le cookie côté navigateur.
     */

    const response = errorResponse(
      "La session a été fermée. Reconnecte-toi pour continuer.",
      500
    );

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

    return response;
  }
}

/* =========================================================
   GET NON AUTORISÉ
   ========================================================= */

export async function GET() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}