import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  assertAdminAuthConfigured,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  normalizeAdminEmail,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

/* =========================================================
   NACHTKRONE — API CONNEXION ADMIN
   app/api/admin/login/route.ts

   POST /api/admin/login

   Fonctionnalités :
   - Validation JSON
   - Validation des entrées
   - Vérification bcrypt
   - Création JWT
   - Cookie HTTP-only
   - Réponses non mises en cache
   - Diagnostics serveur sans exposer de secret
   ========================================================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
   ========================================================= */

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

/* =========================================================
   RÉPONSES
   ========================================================= */

function jsonResponse(
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",
      },
    }
  );
}

function errorResponse(
  message: string,
  status: number
) {
  return jsonResponse(
    {
      success: false,
      message,
    },
    status
  );
}

/* =========================================================
   POST — CONNEXION
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       CONFIGURATION
       ===================================================== */

    /*
     * Vérifie immédiatement que :
     *
     * ADMIN_EMAIL
     * ADMIN_PASSWORD_HASH_BASE64
     * AUTH_SECRET
     *
     * sont correctement configurés.
     *
     * Aucun secret n'est affiché.
     */

    assertAdminAuthConfigured();

    /* =====================================================
       CONTENT TYPE
       ===================================================== */

    const contentType =
      request.headers.get(
        "content-type"
      ) ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes(
          "application/json"
        )
    ) {
      return errorResponse(
        "Format de requête invalide.",
        415
      );
    }

    /* =====================================================
       LECTURE DU JSON
       ===================================================== */

    let body: LoginBody;

    try {
      body =
        (await request.json()) as LoginBody;
    } catch {
      return errorResponse(
        "Les données envoyées sont invalides.",
        400
      );
    }

    /* =====================================================
       TYPES
       ===================================================== */

    if (
      typeof body.email !==
        "string" ||
      typeof body.password !==
        "string"
    ) {
      return errorResponse(
        "L'adresse e-mail et le mot de passe sont obligatoires.",
        400
      );
    }

    /* =====================================================
       NORMALISATION
       ===================================================== */

    const email =
      normalizeAdminEmail(
        body.email
      );

    /*
     * IMPORTANT :
     *
     * Le mot de passe n'est volontairement
     * PAS trim().
     *
     * Un espace peut techniquement faire partie
     * d'un mot de passe.
     */

    const password =
      body.password;

    /* =====================================================
       CHAMPS OBLIGATOIRES
       ===================================================== */

    if (
      !email ||
      !password
    ) {
      return errorResponse(
        "L'adresse e-mail et le mot de passe sont obligatoires.",
        400
      );
    }

    /* =====================================================
       LIMITES
       ===================================================== */

    if (
      email.length > 254 ||
      password.length > 256
    ) {
      return errorResponse(
        "Identifiants invalides.",
        401
      );
    }

    /* =====================================================
       VÉRIFICATION DES IDENTIFIANTS
       ===================================================== */

    const credentialsAreValid =
      await verifyAdminCredentials(
        email,
        password
      );

    if (
      !credentialsAreValid
    ) {
      /*
       * Aucun mot de passe ou hash n'est
       * affiché dans le terminal.
       */

      if (
        process.env.NODE_ENV !==
        "production"
      ) {
        console.warn(
          "[NACHTKRONE][ADMIN_LOGIN] Identifiants refusés."
        );
      }

      /*
       * Message volontairement générique.
       *
       * On ne révèle jamais si c'est
       * l'e-mail ou le mot de passe qui
       * est incorrect.
       */

      return errorResponse(
        "Adresse e-mail ou mot de passe incorrect.",
        401
      );
    }

    /* =====================================================
       CRÉATION DU JWT
       ===================================================== */

    const sessionToken =
      await createAdminSessionToken(
        email
      );

    if (!sessionToken) {
      throw new Error(
        "Impossible de créer la session administrateur."
      );
    }

    /* =====================================================
       COOKIE
       ===================================================== */

    const cookieOptions =
      getAdminSessionCookieOptions();

    /* =====================================================
       RÉPONSE
       ===================================================== */

    const response =
      jsonResponse(
        {
          success: true,

          message:
            "Connexion réussie.",

          redirectTo:
            "/admin",
        },
        200
      );

    response.cookies.set({
      name:
        cookieOptions.name,

      value:
        sessionToken,

      httpOnly:
        cookieOptions.httpOnly,

      secure:
        cookieOptions.secure,

      sameSite:
        cookieOptions.sameSite,

      path:
        cookieOptions.path,

      maxAge:
        cookieOptions.maxAge,
    });

    /* =====================================================
       DIAGNOSTIC DÉVELOPPEMENT
       ===================================================== */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.info(
        "[NACHTKRONE][ADMIN_LOGIN] Connexion administrateur réussie."
      );
    }

    return response;
  } catch (error) {
    /* =====================================================
       ERREUR INTERNE
       ===================================================== */

    console.error(
      "[NACHTKRONE][ADMIN_LOGIN]",
      error instanceof Error
        ? error.message
        : "Erreur inconnue."
    );

    /*
     * Aucun détail technique ni secret
     * n'est envoyé au navigateur.
     */

    return errorResponse(
      "Une erreur interne est survenue. Réessaie dans quelques instants.",
      500
    );
  }
}

/* =========================================================
   GET
   ========================================================= */

export async function GET() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

/* =========================================================
   PUT
   ========================================================= */

export async function PUT() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

/* =========================================================
   PATCH
   ========================================================= */

export async function PATCH() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

/* =========================================================
   DELETE
   ========================================================= */

export async function DELETE() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}