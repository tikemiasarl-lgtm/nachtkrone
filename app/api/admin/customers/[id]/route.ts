
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — ADMIN
   API DE SUPPRESSION DES CLIENTS

   Route :
   DELETE /api/admin/customers/[id]

   Règles :
   - Administrateur authentifié uniquement
   - Requête JSON obligatoire
   - Confirmation explicite de suppression
   - Vérification de la version updatedAt
   - Suppression interdite si le client a des commandes
   - Conservation de l'historique des commandes
========================================================= */

export const runtime = "nodejs";

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DeleteCustomerBody = {
  confirmDelete?: unknown;
  updatedAt?: unknown;
};

/* =========================================================
   RÉPONSE D'ERREUR
========================================================= */

function fail(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    },
  );
}

/* =========================================================
   DELETE — SUPPRESSION D'UN CLIENT
========================================================= */

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    /* =====================================================
       1. AUTHENTIFICATION ADMINISTRATEUR
    ===================================================== */

    const session = await verifyAdminSessionToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)
        ?.value ?? null,
    );

    if (!session) {
      return fail(
        "Connexion administrateur requise.",
        401,
      );
    }

    /* =====================================================
       2. VÉRIFICATION DE L'ORIGINE
    ===================================================== */

    const origin = request.headers.get("origin");

    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          return fail(
            "Requête non autorisée.",
            403,
          );
        }
      } catch {
        return fail(
          "Origine invalide.",
          403,
        );
      }
    }

    /* =====================================================
       3. IDENTIFIANT DU CLIENT
    ===================================================== */

    const { id } = await params;

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
      return fail(
        "Identifiant invalide.",
        400,
      );
    }

    /* =====================================================
       4. VÉRIFICATION DU FORMAT JSON
    ===================================================== */

    if (
      !request.headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      return fail(
        "Format JSON requis.",
        415,
      );
    }

    /* =====================================================
       5. LECTURE DES DONNÉES
    ===================================================== */

    let body: DeleteCustomerBody;

    try {
      body = await request.json();
    } catch {
      return fail(
        "JSON invalide.",
        400,
      );
    }

    /* =====================================================
       6. VALIDATION DE LA CONFIRMATION
          ET DE LA VERSION
    ===================================================== */

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body.confirmDelete !== true ||
      typeof body.updatedAt !== "string" ||
      !Number.isFinite(
        Date.parse(body.updatedAt),
      )
    ) {
      return fail(
        "Confirme la suppression du client.",
        422,
      );
    }

    /* =====================================================
       7. SUPPRESSION SÉCURISÉE

       Conditions obligatoires :
       - Identifiant correspondant
       - Version updatedAt identique
       - Aucune commande associée au client

       deleteMany permet de vérifier ces conditions
       directement dans l'opération de suppression.
    ===================================================== */

    const result = await prisma.customer.deleteMany({
      where: {
        id,

        updatedAt: new Date(
          body.updatedAt,
        ),

        orders: {
          none: {},
        },
      },
    });

    /* =====================================================
       8. SUPPRESSION REFUSÉE
    ===================================================== */

    if (result.count === 0) {
      return fail(
        "Suppression impossible : ce client a encore des commandes, a changé ou n'existe plus. Recharge la page.",
        409,
      );
    }

    /* =====================================================
       9. REVALIDATION DES PAGES ADMIN
    ===================================================== */

    revalidatePath("/admin");
    revalidatePath("/admin/customers");

    /* =====================================================
       10. RÉPONSE DE SUCCÈS
    ===================================================== */

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    /* =====================================================
       GESTION DES ERREURS PRISMA
    ===================================================== */

    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? error.code
        : undefined;

    /* CONTRAINTE DE CLÉ ÉTRANGÈRE */

    if (code === "P2003") {
      return fail(
        "Ce client est lié à une commande. Son historique est conservé.",
        409,
      );
    }

    /* ERREUR SERVEUR */

    console.error(
      "[ADMIN_CUSTOMER_DELETE]",
      {
        code,
      },
    );

    return fail(
      "Impossible de supprimer le client pour le moment.",
      500,
    );
  }
}
