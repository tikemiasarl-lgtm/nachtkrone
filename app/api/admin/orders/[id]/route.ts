
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — ADMIN
   API DE GESTION DES COMMANDES

   PATCH  : Modifier une commande et son paiement
   DELETE : Supprimer définitivement une commande
========================================================= */

export const runtime = "nodejs";

/* =========================================================
   STATUTS AUTORISÉS
========================================================= */

const statuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const payments = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateOrderBody = {
  status?: unknown;
  paymentStatus?: unknown;
  paymentMethod?: unknown;
  paymentReference?: unknown;
  updatedAt?: unknown;
  confirmPayment?: unknown;
};

type DeleteOrderBody = {
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
   VÉRIFICATION DE L'ORIGINE
========================================================= */

function validateOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;

  if (!origin) {
    return null;
  }

  try {
    if (new URL(origin).host !== host) {
      return fail("Requête non autorisée.", 403);
    }
  } catch {
    return fail("Origine invalide.", 403);
  }

  return null;
}

/* =========================================================
   VALIDATION DE L'IDENTIFIANT
========================================================= */

function isValidId(id: string) {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(id);
}

/* =========================================================
   VALIDATION DE LA VERSION
========================================================= */

function isValidUpdatedAt(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value))
  );
}

/* =========================================================
   EXTRACTION DU CODE D'ERREUR PRISMA
========================================================= */

function getPrismaErrorCode(
  error: unknown,
): unknown {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  )
    ? error.code
    : undefined;
}

/* =========================================================
   PATCH — MODIFICATION D'UNE COMMANDE
========================================================= */

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    /* AUTHENTIFICATION ADMINISTRATEUR */

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

    /* CONTRÔLE DE L'ORIGINE */

    const originError = validateOrigin(request);

    if (originError) {
      return originError;
    }

    /* IDENTIFIANT DE LA COMMANDE */

    const { id } = await params;

    if (!isValidId(id)) {
      return fail("Identifiant invalide.", 400);
    }

    /* FORMAT JSON */

    if (
      !request.headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      return fail("Format JSON requis.", 415);
    }

    /* LECTURE DU CORPS */

    let body: UpdateOrderBody;

    try {
      body = await request.json();
    } catch {
      return fail("JSON invalide.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return fail("Données invalides.", 400);
    }

    /* VALIDATION DES STATUTS */

    const status = statuses.find(
      (value) => value === body.status,
    );

    const paymentStatus = payments.find(
      (value) => value === body.paymentStatus,
    );

    if (
      !status ||
      !paymentStatus ||
      !isValidUpdatedAt(body.updatedAt)
    ) {
      return fail(
        "Statuts ou version invalides.",
        422,
      );
    }

    /* VALIDATION DES INFORMATIONS DE PAIEMENT */

    if (
      typeof body.paymentMethod !== "string" ||
      body.paymentMethod.length > 80 ||
      typeof body.paymentReference !== "string" ||
      body.paymentReference.length > 120
    ) {
      return fail(
        "Informations de paiement invalides.",
        422,
      );
    }

    /* RÉCUPÉRATION DE LA COMMANDE */

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      select: {
        paymentStatus: true,
        paidAt: true,
      },
    });

    if (!order) {
      return fail("Commande introuvable.", 404);
    }

    /* CONFIRMATION DU CHANGEMENT DE PAIEMENT */

    if (
      paymentStatus !== order.paymentStatus &&
      body.confirmPayment !== true
    ) {
      return fail(
        "Confirme la modification du paiement.",
        422,
      );
    }

    /* VÉRIFICATION DU REMBOURSEMENT */

    if (
      paymentStatus === "REFUNDED" &&
      order.paymentStatus !== "PAID" &&
      order.paymentStatus !== "REFUNDED"
    ) {
      return fail(
        "Seul un paiement encaissé peut être remboursé.",
        422,
      );
    }

    /* COHÉRENCE COMMANDE / PAIEMENT */

    if (
      status === "REFUNDED" &&
      paymentStatus !== "REFUNDED"
    ) {
      return fail(
        "Confirme aussi le remboursement du paiement.",
        422,
      );
    }

    /* MISE À JOUR DE LA COMMANDE */

    await prisma.order.update({
      where: {
        id,
        updatedAt: new Date(body.updatedAt),
      },

      data: {
        status,

        paymentStatus,

        paymentMethod:
          body.paymentMethod.trim() || null,

        paymentReference:
          body.paymentReference.trim() || null,

        paidAt:
          paymentStatus === "PAID"
            ? order.paymentStatus === "PAID"
              ? order.paidAt ?? new Date()
              : new Date()
            : paymentStatus === "REFUNDED"
              ? order.paidAt
              : null,
      },

      select: {
        id: true,
      },
    });

    /* REVALIDATION DES PAGES ADMIN */

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2025") {
      return fail(
        "La commande a changé. Recharge la page avant de réessayer.",
        409,
      );
    }

    console.error("[ADMIN_ORDER_UPDATE]", {
      code,
    });

    return fail(
      "Impossible d'enregistrer la commande pour le moment.",
      500,
    );
  }
}

/* =========================================================
   DELETE — SUPPRESSION DÉFINITIVE D'UNE COMMANDE
========================================================= */

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    /* AUTHENTIFICATION ADMINISTRATEUR */

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

    /* CONTRÔLE DE L'ORIGINE */

    const originError = validateOrigin(request);

    if (originError) {
      return originError;
    }

    /* IDENTIFIANT DE LA COMMANDE */

    const { id } = await params;

    if (!isValidId(id)) {
      return fail("Identifiant invalide.", 400);
    }

    /* FORMAT JSON */

    if (
      !request.headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      return fail("Format JSON requis.", 415);
    }

    /* LECTURE DU CORPS */

    let body: DeleteOrderBody;

    try {
      body = await request.json();
    } catch {
      return fail("JSON invalide.", 400);
    }

    /* CONFIRMATION ET VERSION */

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body.confirmDelete !== true ||
      !isValidUpdatedAt(body.updatedAt)
    ) {
      return fail(
        "Confirme la suppression de la commande.",
        422,
      );
    }

    /* SUPPRESSION DÉFINITIVE

       Les articles de la commande sont supprimés
       par cascade si la relation Prisma est
       configurée avec onDelete: Cascade.

       Les produits, les clients et le stock
       ne sont pas modifiés par cette requête.
    */

    await prisma.order.delete({
      where: {
        id,
        updatedAt: new Date(body.updatedAt),
      },

      select: {
        id: true,
      },
    });

    /* REVALIDATION DES PAGES ADMIN */

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const code = getPrismaErrorCode(error);

    if (code === "P2025") {
      return fail(
        "La commande a changé ou n'existe plus. Recharge la page.",
        409,
      );
    }

    console.error("[ADMIN_ORDER_DELETE]", {
      code,
    });

    return fail(
      "Impossible de supprimer la commande pour le moment.",
      500,
    );
  }
}
