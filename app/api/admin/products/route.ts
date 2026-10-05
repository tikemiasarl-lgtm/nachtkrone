import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

import {
  getFirstProductValidationError,
  getProductErrorsByField,
  validateProductInput,
  type ProductInput,
} from "@/lib/products";

/* =========================================================
   NACHTKRONE — API ADMIN PRODUITS
   app/api/admin/products/route.ts
   ========================================================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
   ========================================================= */

type ProductListStatus =
  | "ALL"
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type ProductListCategory =
  | "ALL"
  | "MASK"
  | "COSTUME"
  | "MASK_AND_COSTUME";

/* =========================================================
   RÉPONSES
   ========================================================= */

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return jsonResponse(
    {
      success: false,
      message,
      ...(extra ?? {}),
    },
    status
  );
}

/* =========================================================
   AUTHENTIFICATION ADMIN
   ========================================================= */

async function authenticateAdmin(request: NextRequest) {
  const token =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;

  const session =
    await verifyAdminSessionToken(token);

  return session;
}

/* =========================================================
   DÉTECTION D'UNE ERREUR PRISMA
   ========================================================= */

function getPrismaErrorCode(
  error: unknown
): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

/* =========================================================
   SERIALISATION PRODUIT
   ========================================================= */

/*
 * Prisma Decimal ne doit pas être envoyé directement
 * au navigateur.
 *
 * On convertit donc explicitement :
 *
 * - price en string
 * - promotionalPrice en string ou null
 */

function serializeProduct<
  T extends {
    price: {
      toString(): string;
    };

    promotionalPrice?: {
      toString(): string;
    } | null;
  }
>(product: T) {
  return {
    ...product,

    price:
      product.price.toString(),

    promotionalPrice:
      product.promotionalPrice === null ||
      product.promotionalPrice === undefined
        ? null
        : product.promotionalPrice.toString(),
  };
}

/* =========================================================
   GET — LISTE DES PRODUITS
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  /* -------------------------------------------------------
     Authentification
     ------------------------------------------------------- */

  const session =
    await authenticateAdmin(request);

  if (!session) {
    return errorResponse(
      "Session administrateur invalide ou expirée.",
      401
    );
  }

  try {
    const { searchParams } =
      request.nextUrl;

    /* -----------------------------------------------------
       Recherche
       ----------------------------------------------------- */

    const search = (
      searchParams.get("search") ?? ""
    )
      .trim()
      .slice(0, 160);

    /* -----------------------------------------------------
       Statut
       ----------------------------------------------------- */

    const rawStatus = (
      searchParams.get("status") ?? "ALL"
    ).toUpperCase();

    const status: ProductListStatus =
      rawStatus === "DRAFT" ||
      rawStatus === "PUBLISHED" ||
      rawStatus === "ARCHIVED"
        ? rawStatus
        : "ALL";

    /* -----------------------------------------------------
       Catégorie
       ----------------------------------------------------- */

    const rawCategory = (
      searchParams.get("category") ?? "ALL"
    ).toUpperCase();

    const category: ProductListCategory =
      rawCategory === "MASK" ||
      rawCategory === "COSTUME" ||
      rawCategory === "MASK_AND_COSTUME"
        ? rawCategory
        : "ALL";

    /* -----------------------------------------------------
       Pagination
       ----------------------------------------------------- */

    const rawPage = Number(
      searchParams.get("page") ?? "1"
    );

    const rawLimit = Number(
      searchParams.get("limit") ?? "20"
    );

    const page =
      Number.isInteger(rawPage) &&
      rawPage > 0
        ? rawPage
        : 1;

    /*
     * Maximum 100 produits par requête.
     */

    const limit =
      Number.isInteger(rawLimit) &&
      rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 20;

    const skip =
      (page - 1) * limit;

    /* -----------------------------------------------------
       Construction du filtre Prisma
       ----------------------------------------------------- */

    const where = {
      ...(status !== "ALL"
        ? {
            status,
          }
        : {}),

      ...(category !== "ALL"
        ? {
            category,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                slug: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                shortDescription: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    /* -----------------------------------------------------
       Produits + total
       ----------------------------------------------------- */

    const [products, total] =
      await Promise.all([
        prisma.product.findMany({
          where,

          skip,
          take: limit,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            category: true,

            /*
             * Prix normal + promotion.
             */
            price: true,
            promotionalPrice: true,

            stock: true,
            mainImage: true,
            status: true,
            createdAt: true,
            updatedAt: true,

            images: {
              orderBy: {
                position: "asc",
              },

              select: {
                id: true,
                url: true,
                position: true,
              },
            },

            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        }),

        prisma.product.count({
          where,
        }),
      ]);

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(total / limit);

    return jsonResponse({
      success: true,

      products: products.map(
        (product) =>
          serializeProduct(product)
      ),

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage:
          page > 1,
        hasNextPage:
          page < totalPages,
      },

      filters: {
        search,
        status,
        category,
      },
    });
  } catch (error) {
    console.error(
      "[NACHTKRONE][ADMIN_PRODUCTS_GET]",
      error instanceof Error
        ? error.message
        : error
    );

    return errorResponse(
      "Impossible de récupérer les produits pour le moment.",
      500
    );
  }
}

/* =========================================================
   POST — CRÉATION D'UN PRODUIT
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  /* -------------------------------------------------------
     Authentification
     ------------------------------------------------------- */

  const session =
    await authenticateAdmin(request);

  if (!session) {
    return errorResponse(
      "Session administrateur invalide ou expirée.",
      401
    );
  }

  /* -------------------------------------------------------
     Vérification du Content-Type
     ------------------------------------------------------- */

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
      "Le contenu de la requête doit être au format JSON.",
      415
    );
  }

  /* -------------------------------------------------------
     Lecture du JSON
     ------------------------------------------------------- */

  let body: ProductInput;

  try {
    const parsedBody: unknown =
      await request.json();

    if (
      typeof parsedBody !==
        "object" ||
      parsedBody === null ||
      Array.isArray(parsedBody)
    ) {
      return errorResponse(
        "Les données du produit ne sont pas valides.",
        400
      );
    }

    body =
      parsedBody as ProductInput;
  } catch {
    return errorResponse(
      "Le contenu JSON de la requête est invalide.",
      400
    );
  }

  /* -------------------------------------------------------
     Validation centralisée

     lib/products.ts doit déjà garantir :

     - price obligatoire
     - promotionalPrice facultatif
     - promotionalPrice < price
     - MASK
     - COSTUME
     - MASK_AND_COSTUME
     ------------------------------------------------------- */

  const validation =
    validateProductInput(body);

  if (!validation.success) {
    return errorResponse(
      getFirstProductValidationError(
        validation.errors
      ),
      422,
      {
        errors:
          validation.errors,

        fieldErrors:
          getProductErrorsByField(
            validation.errors
          ),
      }
    );
  }

  const productData =
    validation.data;

  try {
    /* -----------------------------------------------------
       Vérification préalable du slug
       ----------------------------------------------------- */

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          slug:
            productData.slug,
        },

        select: {
          id: true,
        },
      });

    if (existingProduct) {
      return errorResponse(
        "Un produit utilise déjà cette URL. Modifie le nom ou le slug du produit.",
        409,
        {
          errors: [
            {
              field: "slug",
              message:
                "Cette URL de produit est déjà utilisée.",
            },
          ],

          fieldErrors: {
            slug: [
              "Cette URL de produit est déjà utilisée.",
            ],
          },
        }
      );
    }

    /* -----------------------------------------------------
       TRANSACTION PRISMA
       -----------------------------------------------------

       Si la création d'une image échoue,
       le produit entier est annulé.

       Aucun produit incomplet ne restera en base.
       ----------------------------------------------------- */

    const product =
      await prisma.$transaction(
        async (transaction) => {
          const createdProduct =
            await transaction.product.create({
              data: {
                name:
                  productData.name,

                slug:
                  productData.slug,

                shortDescription:
                  productData.shortDescription,

                description:
                  productData.description,

                category:
                  productData.category,

                /*
                 * Prisma Decimal accepte
                 * les strings décimales normalisées
                 * par lib/products.ts.
                 */
                price:
                  productData.price,

                /*
                 * Si aucune promotion :
                 * promotionalPrice = null.
                 *
                 * Si une promotion existe :
                 * promotionalPrice contient
                 * le prix promotionnel validé.
                 */
                promotionalPrice:
                  productData.promotionalPrice ??
                  null,

                stock:
                  productData.stock,

                mainImage:
                  productData.mainImage,

                status:
                  productData.status,
              },

              select: {
                id: true,
                name: true,
                slug: true,
                shortDescription:
                  true,
                description: true,
                category: true,

                price: true,
                promotionalPrice:
                  true,

                stock: true,
                mainImage: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          /* -------------------------------------------------
             IMAGES SUPPLÉMENTAIRES
             -------------------------------------------------

             lib/products.ts garantit déjà :
             maximum 15 images.

             position :
             première image supplémentaire = 0
             deuxième = 1
             ...
             quinzième = 14
             ------------------------------------------------- */

          if (
            productData.images
              .length > 0
          ) {
            await transaction.productImage.createMany(
              {
                data:
                  productData.images.map(
                    (
                      imageUrl,
                      index
                    ) => ({
                      productId:
                        createdProduct.id,

                      url:
                        imageUrl,

                      position:
                        index,
                    })
                  ),
              }
            );
          }

          /* -------------------------------------------------
             Produit final avec images
             ------------------------------------------------- */

          return transaction.product.findUniqueOrThrow(
            {
              where: {
                id:
                  createdProduct.id,
              },

              select: {
                id: true,
                name: true,
                slug: true,
                shortDescription:
                  true,
                description: true,
                category: true,

                price: true,
                promotionalPrice:
                  true,

                stock: true,
                mainImage: true,
                status: true,
                createdAt: true,
                updatedAt: true,

                images: {
                  orderBy: {
                    position:
                      "asc",
                  },

                  select: {
                    id: true,
                    url: true,
                    position:
                      true,
                  },
                },
              },
            }
          );
        }
      );

    /* -----------------------------------------------------
       SUCCÈS
       ----------------------------------------------------- */

    return jsonResponse(
      {
        success: true,

        message:
          product.status ===
          "PUBLISHED"
            ? "Produit publié avec succès."
            : product.status ===
                "ARCHIVED"
              ? "Produit créé et archivé avec succès."
              : "Produit enregistré en brouillon avec succès.",

        product:
          serializeProduct(
            product
          ),
      },
      201
    );
  } catch (error) {
    /* -----------------------------------------------------
       SLUG UNIQUE — protection contre une course concurrente
       -----------------------------------------------------

       Même si deux requêtes arrivent exactement au même
       moment, la contrainte UNIQUE de PostgreSQL reste
       l'autorité finale.
       ----------------------------------------------------- */

    const prismaCode =
      getPrismaErrorCode(error);

    if (
      prismaCode === "P2002"
    ) {
      return errorResponse(
        "Un produit utilise déjà cette URL. Modifie le nom ou le slug du produit.",
        409,
        {
          errors: [
            {
              field: "slug",
              message:
                "Cette URL de produit est déjà utilisée.",
            },
          ],

          fieldErrors: {
            slug: [
              "Cette URL de produit est déjà utilisée.",
            ],
          },
        }
      );
    }

    console.error(
      "[NACHTKRONE][ADMIN_PRODUCTS_POST]",
      error instanceof Error
        ? error.message
        : error
    );

    return errorResponse(
      "Impossible d'enregistrer le produit pour le moment.",
      500
    );
  }
}

/* =========================================================
   MÉTHODES NON DISPONIBLES SUR LA COLLECTION
   ========================================================= */

/*
 * PUT / DELETE d'un produit précis seront gérés plus tard
 * par :
 *
 * /api/admin/products/[id]
 *
 * On évite volontairement de supprimer un produit depuis
 * la route générale /api/admin/products.
 */

export async function PUT() {
  return errorResponse(
    "Méthode non autorisée sur cette route.",
    405
  );
}

export async function PATCH() {
  return errorResponse(
    "Méthode non autorisée sur cette route.",
    405
  );
}

export async function DELETE() {
  return errorResponse(
    "Méthode non autorisée sur cette route.",
    405
  );
}