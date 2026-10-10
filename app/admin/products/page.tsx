import { PRODUCT_CATEGORY_LABELS, type ProductCategoryValue } from "@/lib/product-categories";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import Image from "next/image";
import Link from "next/link";

import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — ADMIN PRODUITS
   app/admin/products/page.tsx

   VERSION SERVEUR

   Fonctionnalités :
   - Liste des produits
   - Recherche
   - Filtre catégorie
   - Filtre statut
   - Pagination
   - Prix réel
   - Prix promotionnel
   - Affichage desktop
   - Affichage mobile / tablette
   - Images Supabase
   - Aucun useEffect
   - Aucun fetch côté navigateur
   - Aucune redirection window.location
   ========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES
   ========================================================= */

type ProductCategory = ProductCategoryValue;

type ProductStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type StatusFilter =
  | "ALL"
  | ProductStatus;

type CategoryFilter =
  | "ALL"
  | ProductCategory;

type SearchParams = {
  search?: string | string[];
  status?: string | string[];
  category?: string | string[];
  page?: string | string[];
};

/* =========================================================
   CONSTANTES
   ========================================================= */

const PRODUCTS_PER_PAGE = 20;

const categoryLabels: Record<ProductCategory, string> = {
  ...PRODUCT_CATEGORY_LABELS,
  MASK: "Masque",
  COSTUME: "Costume",
  MASK_AND_COSTUME: "Masque et costume",
};

const statusLabels: Record<ProductStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

/* =========================================================
   HELPERS — PARAMÈTRES
   ========================================================= */

function getSingleParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(
  value: string | string[] | undefined
): string {
  return getSingleParam(value)
    .trim()
    .slice(0, 160);
}

function normalizeCategory(
  value: string | string[] | undefined
): CategoryFilter {
  const normalized = getSingleParam(value)
    .trim()
    .toUpperCase();

  if (
    normalized === "MASK" ||
    normalized === "COSTUME" ||
    normalized === "MASK_AND_COSTUME"
  ) {
    return normalized;
  }

  return "ALL";
}

function normalizeStatus(
  value: string | string[] | undefined
): StatusFilter {
  const normalized = getSingleParam(value)
    .trim()
    .toUpperCase();

  if (
    normalized === "DRAFT" ||
    normalized === "PUBLISHED" ||
    normalized === "ARCHIVED"
  ) {
    return normalized;
  }

  return "ALL";
}

function normalizePage(
  value: string | string[] | undefined
): number {
  const parsed = Number.parseInt(
    getSingleParam(value),
    10
  );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

/* =========================================================
   HELPERS — URL
   ========================================================= */

type ProductUrlParams = {
  search?: string;
  status?: StatusFilter;
  category?: CategoryFilter;
  page?: number;
};

function createProductsUrl({
  search = "",
  status = "ALL",
  category = "ALL",
  page = 1,
}: ProductUrlParams): string {
  const params = new URLSearchParams();

  const cleanSearch = search.trim();

  if (cleanSearch) {
    params.set(
      "search",
      cleanSearch
    );
  }

  if (status !== "ALL") {
    params.set(
      "status",
      status
    );
  }

  if (category !== "ALL") {
    params.set(
      "category",
      category
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page)
    );
  }

  const query = params.toString();

  return query
    ? `/admin/products?${query}`
    : "/admin/products";
}

/* =========================================================
   FORMATAGE
   ========================================================= */

function formatPrice(
  value:
    | string
    | number
    | { toString(): string }
) {
  const numericValue = Number(
    value.toString()
  );

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(numericValue);
}

function formatDate(
  value: Date | string
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "de-DE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}

/* =========================================================
   STYLE STATUT
   ========================================================= */

function getStatusClasses(
  status: ProductStatus
) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "ARCHIVED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "DRAFT":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

/* =========================================================
   STYLE STOCK
   ========================================================= */

function getStockClasses(
  stock: number
) {
  if (stock <= 0) {
    return "bg-red-50 text-red-700";
  }

  if (stock <= 5) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function getStockLabel(
  stock: number
) {
  if (stock <= 0) {
    return "Rupture";
  }

  if (stock === 1) {
    return "1 en stock";
  }

  return `${stock} en stock`;
}

/* =========================================================
   IMAGE PRODUIT
   ========================================================= */

function ProductImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      unoptimized
    />
  );
}

/* =========================================================
   AFFICHAGE PRIX
   ========================================================= */

function ProductPrice({
  price,
  promotionalPrice,
  compact = false,
}: {
  price:
    | string
    | number
    | { toString(): string };
  promotionalPrice:
    | string
    | number
    | { toString(): string }
    | null;
  compact?: boolean;
}) {
  if (promotionalPrice !== null) {
    return (
      <div
        className={
          compact
            ? "flex shrink-0 flex-col items-end"
            : "flex flex-col items-start"
        }
      >
        <span className="whitespace-nowrap text-xs font-bold text-slate-400 line-through">
          {formatPrice(price)}
        </span>

        <span
          className={[
            "whitespace-nowrap font-black text-red-600",
            compact
              ? "text-sm"
              : "mt-0.5 text-sm",
          ].join(" ")}
        >
          {formatPrice(promotionalPrice)}
        </span>
      </div>
    );
  }

  return (
    <span
      className={[
        "whitespace-nowrap font-black text-[#071b3a]",
        compact
          ? "shrink-0 text-sm"
          : "text-sm",
      ].join(" ")}
    >
      {formatPrice(price)}
    </span>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  /* =======================================================
     PARAMÈTRES
     ======================================================= */

  const resolvedSearchParams =
    (await searchParams) ?? {};

  const search =
    normalizeSearch(
      resolvedSearchParams.search
    );

  const status =
    normalizeStatus(
      resolvedSearchParams.status
    );

  const category =
    normalizeCategory(
      resolvedSearchParams.category
    );

  const requestedPage =
    normalizePage(
      resolvedSearchParams.page
    );

  /* =======================================================
     FILTRE PRISMA
     ======================================================= */

  const where = {
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
  };

  /* =======================================================
     NOMBRE TOTAL
     ======================================================= */

  const total =
    await prisma.product.count({
      where,
    });

  const totalPages =
    total > 0
      ? Math.ceil(
          total /
            PRODUCTS_PER_PAGE
        )
      : 0;

  /*
   * Si quelqu'un saisit ?page=9999,
   * on reste sur la dernière page existante.
   */

  const page =
    totalPages > 0
      ? Math.min(
          requestedPage,
          totalPages
        )
      : 1;

  /* =======================================================
     PRODUITS
     ======================================================= */

  const products =
    await prisma.product.findMany({
      where,

      orderBy: {
        createdAt: "desc",
      },

      skip:
        (page - 1) *
        PRODUCTS_PER_PAGE,

      take:
        PRODUCTS_PER_PAGE,

      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        category: true,

        // Prix réel obligatoire
        price: true,

        // Prix promotionnel facultatif
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
    });

  /* =======================================================
     ÉTAT DES FILTRES
     ======================================================= */

  const filtersAreActive =
    search !== "" ||
    category !== "ALL" ||
    status !== "ALL";

  const hasPreviousPage =
    page > 1;

  const hasNextPage =
    totalPages > 0 &&
    page < totalPages;

  /* =======================================================
     URLs PAGINATION
     ======================================================= */

  const previousPageUrl =
    createProductsUrl({
      search,
      status,
      category,
      page:
        Math.max(
          1,
          page - 1
        ),
    });

  const nextPageUrl =
    createProductsUrl({
      search,
      status,
      category,
      page:
        page + 1,
    });

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          EN-TÊTE
          =================================================== */}

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                <Boxes
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#087cff]">
                Catalogue
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-3xl">
              Gestion des produits
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Gérez les masques, costumes et ensembles
              masque et costume disponibles sur la boutique
              NACHTKRONE.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087cff] px-5 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(8,124,255,0.20)] transition hover:bg-[#006bea] focus:outline-none focus:ring-4 focus:ring-[#087cff]/15"
          >
            <PackagePlus
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            />

            Ajouter un produit
          </Link>
        </div>
      </section>

      {/* ===================================================
          FILTRES
          =================================================== */}

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Recherche */}

          <form
            action="/admin/products"
            method="GET"
            className="flex flex-col gap-3 sm:flex-row"
          >
            {status !== "ALL" ? (
              <input
                type="hidden"
                name="status"
                value={status}
              />
            ) : null}

            {category !== "ALL" ? (
              <input
                type="hidden"
                name="category"
                value={category}
              />
            ) : null}

            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                type="search"
                name="search"
                defaultValue={search}
                maxLength={160}
                placeholder="Rechercher par nom, slug ou description..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-sm font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-5 text-sm font-extrabold text-white transition hover:bg-[#0c2853]"
            >
              <Search className="h-4 w-4" />

              Rechercher
            </button>
          </form>

          {/* Catégories / statut */}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="mr-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
                <SlidersHorizontal className="h-4 w-4" />

                Catégorie
              </div>

              <Link
                href={createProductsUrl({
                  search,
                  status,
                  category: "ALL",
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  category === "ALL"
                    ? "bg-[#071b3a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#087cff]/30 hover:text-[#087cff]",
                ].join(" ")}
              >
                Tous
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status,
                  category: "MASK",
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  category === "MASK"
                    ? "bg-[#071b3a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#087cff]/30 hover:text-[#087cff]",
                ].join(" ")}
              >
                Masques
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status,
                  category: "COSTUME",
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  category === "COSTUME"
                    ? "bg-[#071b3a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#087cff]/30 hover:text-[#087cff]",
                ].join(" ")}
              >
                Costumes
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status,
                  category: "MASK_AND_COSTUME",
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
                  category === "MASK_AND_COSTUME"
                    ? "bg-[#071b3a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#087cff]/30 hover:text-[#087cff]",
                ].join(" ")}
              >
                Masque et costume
              </Link>
            </div>

            {/* Statuts */}

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
                Statut
              </span>

              <Link
                href={createProductsUrl({
                  search,
                  status: "ALL",
                  category,
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                  status === "ALL"
                    ? "bg-[#071b3a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#087cff]/30 hover:text-[#087cff]",
                ].join(" ")}
              >
                Tous
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status: "PUBLISHED",
                  category,
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                  status === "PUBLISHED"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
                ].join(" ")}
              >
                Publiés
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status: "DRAFT",
                  category,
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                  status === "DRAFT"
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700",
                ].join(" ")}
              >
                Brouillons
              </Link>

              <Link
                href={createProductsUrl({
                  search,
                  status: "ARCHIVED",
                  category,
                  page: 1,
                })}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                  status === "ARCHIVED"
                    ? "border border-slate-300 bg-slate-100 text-slate-700"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                Archivés
              </Link>

              {filtersAreActive ? (
                <Link
                  href="/admin/products"
                  className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-[#071b3a]"
                >
                  Réinitialiser
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          BARRE RÉSULTATS
          =================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#071b3a]">
            {total} produit
            {total !== 1
              ? "s"
              : ""}
          </p>

          {totalPages > 0 ? (
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Page {page} sur{" "}
              {totalPages}
            </p>
          ) : null}
        </div>

        <Link
          href={createProductsUrl({
            search,
            status,
            category,
            page,
          })}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-600 transition hover:border-[#087cff]/30 hover:text-[#087cff] sm:self-auto"
        >
          Actualiser
        </Link>
      </div>

      {/* ===================================================
          AUCUN PRODUIT
          =================================================== */}

      {products.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff]">
            <Boxes className="h-8 w-8" />
          </div>

          <h3 className="mt-5 text-lg font-black text-[#071b3a]">
            {filtersAreActive
              ? "Aucun produit trouvé"
              : "Aucun produit pour le moment"}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {filtersAreActive
              ? "Aucun produit ne correspond aux critères de recherche sélectionnés."
              : "Ajoutez votre premier masque, costume ou ensemble masque et costume pour commencer à construire le catalogue NACHTKRONE."}
          </p>

          {filtersAreActive ? (
            <Link
              href="/admin/products"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
            >
              Effacer les filtres
            </Link>
          ) : (
            <Link
              href="/admin/products/new"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#087cff] px-4 text-sm font-extrabold text-white transition hover:bg-[#006bea]"
            >
              <PackagePlus className="h-4 w-4" />

              Ajouter un produit
            </Link>
          )}
        </section>
      ) : null}

      {/* ===================================================
          PRODUITS
          =================================================== */}

      {products.length > 0 ? (
        <>
          {/* =================================================
              VERSION DESKTOP
              ================================================= */}

          <section className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8fafc]">
                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Produit
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Catégorie
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Prix
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Ventes
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Créé le
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {products.map(
                    (product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#fafcff]"
                      >
                        {/* Produit */}

                        <td className="px-5 py-4">
                          <div className="flex min-w-[300px] items-center gap-4">
                            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#f6f7f9]">
                              <ProductImage
                                src={
                                  product.mainImage
                                }
                                alt={
                                  product.name
                                }
                                sizes="72px"
                                className="object-contain p-1"
                              />
                            </div>

                            <div className="min-w-0 max-w-[300px]">
                              <p className="truncate text-sm font-black text-[#071b3a]">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {
                                  product.shortDescription
                                }
                              </p>

                              <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                                /
                                {
                                  product.slug
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Catégorie */}

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#f2f6fb] px-2.5 py-1.5 text-xs font-extrabold text-[#071b3a]">
                            <Tag className="h-3.5 w-3.5 text-[#087cff]" />

                            {
                              categoryLabels[
                                product.category
                              ]
                            }
                          </span>
                        </td>

                        {/* Prix */}

                        <td className="px-5 py-4">
                          <ProductPrice
                            price={
                              product.price
                            }
                            promotionalPrice={
                              product.promotionalPrice
                            }
                          />
                        </td>

                        {/* Stock */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${getStockClasses(
                              product.stock
                            )}`}
                          >
                            {getStockLabel(
                              product.stock
                            )}
                          </span>
                        </td>

                        {/* Statut */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getStatusClasses(
                              product.status
                            )}`}
                          >
                            {
                              statusLabels[
                                product.status
                              ]
                            }
                          </span>
                        </td>

                        {/* Ventes */}

                        <td className="px-5 py-4">
                          <span className="text-sm font-extrabold text-[#071b3a]">
                            {
                              product
                                ._count
                                .orderItems
                            }
                          </span>
                        </td>

                        {/* Date */}

                        <td className="px-5 py-4 text-right">
                          <time
                            dateTime={
                              product.createdAt.toISOString()
                            }
                            className="whitespace-nowrap text-xs font-semibold text-slate-500"
                          >
                            {formatDate(
                              product.createdAt
                            )}
                          </time>
                        </td>
                        <td className="px-5 py-4"><div className="flex flex-wrap items-start gap-2"><Link href={"/admin/products/" + encodeURIComponent(product.id) + "/edit"} className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-[#087cff] hover:bg-blue-50">Modifier</Link><DeleteProductButton productId={product.id} productName={product.name} /></div></td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* =================================================
              VERSION MOBILE / TABLETTE
              ================================================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {products.map(
              (product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                >
                  {/* Image */}

                  <div className="relative aspect-[4/3] w-full border-b border-slate-100 bg-[#f7f8fa]">
                    <ProductImage
                      src={
                        product.mainImage
                      }
                      alt={
                        product.name
                      }
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain p-3"
                    />

                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${getStatusClasses(
                          product.status
                        )}`}
                      >
                        {
                          statusLabels[
                            product.status
                          ]
                        }
                      </span>
                    </div>

                    {product.promotionalPrice !== null ? (
                      <div className="absolute right-3 top-3">
                        <span className="inline-flex rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white shadow-sm">
                          Promo
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Contenu */}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#087cff]">
                          <Tag className="h-3 w-3" />

                          {
                            categoryLabels[
                              product.category
                            ]
                          }
                        </span>

                        <h3 className="mt-2 line-clamp-2 text-base font-black leading-5 text-[#071b3a]">
                          {
                            product.name
                          }
                        </h3>
                      </div>

                      <ProductPrice
                        price={
                          product.price
                        }
                        promotionalPrice={
                          product.promotionalPrice
                        }
                        compact
                      />
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                      {
                        product.shortDescription
                      }
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${getStockClasses(
                          product.stock
                        )}`}
                      >
                        {getStockLabel(
                          product.stock
                        )}
                      </span>

                      <span className="text-[11px] font-bold text-slate-400">
                        {
                          product
                            ._count
                            .orderItems
                        }{" "}
                        vente
                        {product
                          ._count
                          .orderItems !==
                        1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </div>
                    <div className="px-4 pb-4"><div className="flex flex-wrap items-start gap-2"><Link href={"/admin/products/" + encodeURIComponent(product.id) + "/edit"} className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-[#087cff] hover:bg-blue-50">Modifier</Link><DeleteProductButton productId={product.id} productName={product.name} /></div></div>
                </article>
              )
            )}
          </section>

          {/* =================================================
              PAGINATION
              ================================================= */}

          {totalPages > 1 ? (
            <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-extrabold text-[#071b3a]">
                  Page {page} sur{" "}
                  {totalPages}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {total} produit
                  {total !== 1
                    ? "s"
                    : ""}{" "}
                  au total
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasPreviousPage ? (
                  <Link
                    href={
                      previousPageUrl
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    Précédent
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] opacity-40">
                    <ChevronLeft className="h-4 w-4" />

                    Précédent
                  </span>
                )}

                <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#071b3a] px-3 text-xs font-black text-white">
                  {page}
                </div>

                {hasNextPage ? (
                  <Link
                    href={
                      nextPageUrl
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                  >
                    Suivant

                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] opacity-40">
                    Suivant

                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </section>
          ) : null}

          {/* =================================================
              RECHERCHE ACTIVE
              ================================================= */}

          {search ? (
            <div className="flex items-center justify-center">
              <Link
                href={createProductsUrl({
                  search: "",
                  status,
                  category,
                  page: 1,
                })}
                className="text-xs font-bold text-slate-400 transition hover:text-[#087cff]"
              >
                Effacer la recherche «{" "}
                {search} »
              </Link>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}