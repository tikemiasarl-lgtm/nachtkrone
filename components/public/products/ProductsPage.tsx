"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from "lucide-react";

import ProductCard, {
  type ProductCardData,
} from "@/components/public/products/ProductCard";

import ProductFilters, {
  type ProductCategoryFilter,
  type ProductFiltersValue,
} from "@/components/public/products/ProductFilters";

import ProductToolbar, {
  type ProductSort,
} from "@/components/public/products/ProductToolbar";

/* =========================================================
   CONFIGURATION
========================================================= */

const PRODUCTS_PER_PAGE = 12;

const INITIAL_FILTERS: ProductFiltersValue = {
  categories: [],
  minPrice: "",
  maxPrice: "",
  onlyAvailable: false,
};

type QuickCategory = "ALL" | ProductCategoryFilter;

/* =========================================================
   PROPS
========================================================= */

type ProductsPageProps = {
  products: ProductCardData[];
};

/* =========================================================
   CATÉGORIES RAPIDES
========================================================= */

const QUICK_CATEGORIES: Array<{
  value: QuickCategory;
  label: string;
}> = [
  {
    value: "ALL",
    label: "Alle",
  },
  {
    value: "MASK",
    label: "Masken",
  },
  {
    value: "COSTUME",
    label: "Kostüme",
  },
  {
    value: "MASK_AND_COSTUME",
    label: "Maske & Kostüm",
  },
];

/* =========================================================
   COMPOSANT
========================================================= */

export default function ProductsPage({
  products,
}: ProductsPageProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<ProductSort>("newest");

  const [filters, setFilters] =
    useState<ProductFiltersValue>(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /* =======================================================
     FILTRAGE + RECHERCHE + TRI
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    const minPrice = parsePrice(filters.minPrice);
    const maxPrice = parsePrice(filters.maxPrice);

    const result = products.filter((product) => {
      /* ---------------------------------------------------
         RECHERCHE
      --------------------------------------------------- */

      if (normalizedSearch) {
        const searchableText = normalizeText(
          [
            product.name,
            product.shortDescription,
            getCategorySearchText(product.category),
          ].join(" "),
        );

        if (!searchableText.includes(normalizedSearch)) {
          return false;
        }
      }

      /* ---------------------------------------------------
         CATÉGORIE
      --------------------------------------------------- */

      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category)
      ) {
        return false;
      }

      /* ---------------------------------------------------
         DISPONIBILITÉ
      --------------------------------------------------- */

      if (
        filters.onlyAvailable &&
        product.stock <= 0
      ) {
        return false;
      }

      /* ---------------------------------------------------
         PRIX EFFECTIF
      --------------------------------------------------- */

      const effectivePrice =
        getEffectivePrice(product);

      if (
        minPrice !== null &&
        effectivePrice < minPrice
      ) {
        return false;
      }

      if (
        maxPrice !== null &&
        effectivePrice > maxPrice
      ) {
        return false;
      }

      return true;
    });

    /* -----------------------------------------------------
       TRI

       Pour "newest", l'ordre reçu du serveur est conservé.
       app/(public)/produkte/page.tsx devra récupérer les
       produits avec createdAt DESC.
    ----------------------------------------------------- */

    if (sort === "price-asc") {
      return [...result].sort(
        (a, b) =>
          getEffectivePrice(a) -
          getEffectivePrice(b),
      );
    }

    if (sort === "price-desc") {
      return [...result].sort(
        (a, b) =>
          getEffectivePrice(b) -
          getEffectivePrice(a),
      );
    }

    return result;
  }, [products, search, sort, filters]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalProducts = filteredProducts.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalProducts / PRODUCTS_PER_PAGE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const visibleProducts = useMemo(() => {
    const start =
      (safeCurrentPage - 1) *
      PRODUCTS_PER_PAGE;

    const end =
      start + PRODUCTS_PER_PAGE;

    return filteredProducts.slice(start, end);
  }, [filteredProducts, safeCurrentPage]);

  /* =======================================================
     RETOUR PAGE 1 LORS D'UN FILTRE
  ======================================================= */



  /* =======================================================
     ACTIONS
  ======================================================= */

  function handleFiltersChange(
    nextFilters: ProductFiltersValue,
  ) {
    setCurrentPage(1);
    setFilters(nextFilters);
  }

  function handleResetFilters() {
    setCurrentPage(1);
    setFilters(INITIAL_FILTERS);
  }

  function handleQuickCategory(
    category: QuickCategory,
  ) {
    setCurrentPage(1);
    if (category === "ALL") {
      setFilters((current) => ({
        ...current,
        categories: [],
      }));

      return;
    }

    setFilters((current) => ({
      ...current,
      categories: [category],
    }));
  }

  function goToPage(page: number) {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages,
    );

    setCurrentPage(nextPage);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const section =
          document.getElementById(
            "products-results",
          );

        if (!section) {
          return;
        }

        const top =
          section.getBoundingClientRect().top +
          window.scrollY -
          120;

        window.scrollTo({
          top: Math.max(0, top),
          behavior: "smooth",
        });
      });
    }
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-white">
      <div
        className="
          mx-auto
          w-full
          max-w-[1440px]
          px-4
          pb-12
          pt-5
          sm:px-6
          sm:pb-16
          lg:px-8
          lg:pt-7
        "
      >
        {/* =================================================
            FIL D'ARIANE
        ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="
            mb-5
            text-xs
            font-medium
            text-slate-500
            sm:text-sm
          "
        >
          <span>Startseite</span>

          <span
            aria-hidden="true"
            className="mx-2 text-slate-300"
          >
            /
          </span>

          <span className="text-slate-900">
            Produkte
          </span>
        </nav>

        {/* =================================================
            TITRE
        ================================================= */}

        <header className="mb-5 sm:mb-7">
          <h1
            className="
              text-2xl
              font-extrabold
              tracking-tight
              text-slate-950
              sm:text-3xl
              lg:text-[34px]
            "
          >
            Alle Produkte
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-slate-600
              sm:text-base
            "
          >
            Entdecke unsere Krampusmasken,
            Kostüme und ausgewählten
            Komplettsets.
          </p>
        </header>

        {/* =================================================
            CATÉGORIES RAPIDES
        ================================================= */}

        <QuickCategories
          activeCategories={filters.categories}
          onChange={handleQuickCategory}
        />

        {/* =================================================
            CONTENU PRINCIPAL
        ================================================= */}

        <div
          className="
            mt-6
            grid
            items-start
            gap-7
            md:grid-cols-[220px_minmax(0,1fr)]
            lg:grid-cols-[240px_minmax(0,1fr)]
            xl:gap-9
          "
        >
          {/* ===============================================
              FILTRES DESKTOP
          =============================================== */}

          <div className="hidden md:block">
            <ProductFilters
              value={filters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* ===============================================
              PRODUITS
          =============================================== */}

          <section
            id="products-results"
            aria-label="Produkte"
            className="min-w-0"
          >
            {/* Toolbar */}
            <ProductToolbar
              search={search}
              sort={sort}
              totalProducts={totalProducts}
              onSearchChange={(value) => {
                setCurrentPage(1);
                setSearch(value);
              }}
              onSortChange={(value) => {
                setCurrentPage(1);
                setSort(value);
              }}
              onOpenFilters={() =>
                setMobileFiltersOpen(true)
              }
            />

            {/* =============================================
                GRILLE
            ============================================= */}

            {visibleProducts.length > 0 ? (
              <>
                <div
                  className="
                    mt-5
                    grid
                    grid-cols-2
                    gap-3
                    sm:gap-4
                    lg:grid-cols-3
                    lg:gap-5
                    xl:gap-6
                  "
                >
                  {visibleProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ),
                  )}
                </div>

                {/* =========================================
                    PAGINATION
                ========================================= */}

                {totalPages > 1 && (
                  <Pagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}
              </>
            ) : (
              <EmptyProducts
                onReset={() => {
                  setCurrentPage(1);
                  setSearch("");
                  setSort("newest");
                  setFilters(INITIAL_FILTERS);
                }}
              />
            )}
          </section>
        </div>
      </div>

      {/* ===================================================
          FILTRES MOBILE
      =================================================== */}

      <ProductFilters
        mobile
        open={mobileFiltersOpen}
        value={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        onClose={() =>
          setMobileFiltersOpen(false)
        }
      />
    </main>
  );
}

/* =========================================================
   CATÉGORIES RAPIDES
========================================================= */

type QuickCategoriesProps = {
  activeCategories: ProductCategoryFilter[];
  onChange: (category: QuickCategory) => void;
};

function QuickCategories({
  activeCategories,
  onChange,
}: QuickCategoriesProps) {
  const activeQuickCategory: QuickCategory =
    activeCategories.length === 1
      ? activeCategories[0]
      : "ALL";

  return (
    <div
      className="
        -mx-4
        overflow-x-auto
        px-4
        sm:mx-0
        sm:px-0
      "
    >
      <div
        className="
          flex
          min-w-max
          items-center
          gap-2
          pb-1
        "
      >
        {QUICK_CATEGORIES.map((category) => {
          const active =
            activeQuickCategory === category.value;

          return (
            <button
              key={category.value}
              type="button"
              onClick={() =>
                onChange(category.value)
              }
              aria-pressed={active}
              className={`
                inline-flex
                h-10
                items-center
                justify-center
                whitespace-nowrap
                rounded-full
                border
                px-4
                text-sm
                font-semibold
                transition
                ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }
              `}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = getPaginationPages(
    currentPage,
    totalPages,
  );

  return (
    <nav
      aria-label="Produktseiten"
      className="
        mt-9
        flex
        items-center
        justify-center
        gap-1.5
        sm:mt-10
        sm:gap-2
      "
    >
      {/* Précédent */}
      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage - 1)
        }
        disabled={currentPage <= 1}
        aria-label="Vorherige Seite"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-lg
          border
          border-slate-300
          bg-white
          text-slate-700
          transition
          hover:border-slate-400
          hover:bg-slate-50
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronLeft
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {/* Pages */}
      {pages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="
                flex
                h-10
                min-w-7
                items-center
                justify-center
                text-sm
                font-semibold
                text-slate-500
              "
            >
              …
            </span>
          );
        }

        const active = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={
              active ? "page" : undefined
            }
            className={`
              flex
              h-10
              min-w-10
              items-center
              justify-center
              rounded-lg
              border
              px-2
              text-sm
              font-bold
              transition
              ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Suivant */}
      <button
        type="button"
        onClick={() =>
          onPageChange(currentPage + 1)
        }
        disabled={currentPage >= totalPages}
        aria-label="Nächste Seite"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-lg
          border
          border-slate-300
          bg-white
          text-slate-700
          transition
          hover:border-slate-400
          hover:bg-slate-50
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronRight
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
    </nav>
  );
}

/* =========================================================
   AUCUN PRODUIT
========================================================= */

type EmptyProductsProps = {
  onReset: () => void;
};

function EmptyProducts({
  onReset,
}: EmptyProductsProps) {
  return (
    <div
      className="
        mt-5
        flex
        min-h-[360px]
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        border-dashed
        border-slate-300
        bg-slate-50/60
        px-5
        py-12
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-white
          text-slate-500
          shadow-sm
        "
      >
        <PackageSearch
          size={27}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>

      <h2
        className="
          mt-4
          text-lg
          font-bold
          text-slate-950
        "
      >
        Keine Produkte gefunden
      </h2>

      <p
        className="
          mt-2
          max-w-md
          text-sm
          leading-6
          text-slate-600
        "
      >
        Für deine aktuelle Suche oder
        Filterauswahl wurden keine Produkte
        gefunden.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="
          mt-5
          inline-flex
          h-11
          items-center
          justify-center
          rounded-lg
          bg-slate-950
          px-5
          text-sm
          font-bold
          text-white
          transition
          hover:bg-blue-700
        "
      >
        Alle Produkte anzeigen
      </button>
    </div>
  );
}

/* =========================================================
   PRIX EFFECTIF
========================================================= */

function getEffectivePrice(
  product: ProductCardData,
) {
  const promotionalPrice =
    product.promotionalPrice;

  if (
    promotionalPrice !== null &&
    Number.isFinite(promotionalPrice) &&
    promotionalPrice >= 0 &&
    promotionalPrice < product.price
  ) {
    return promotionalPrice;
  }

  return product.price;
}

/* =========================================================
   CONVERSION DU PRIX SAISI
========================================================= */

function parsePrice(
  value: string,
): number | null {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

/* =========================================================
   NORMALISATION RECHERCHE
========================================================= */

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE");
}

/* =========================================================
   TEXTE CATÉGORIE POUR RECHERCHE
========================================================= */

function getCategorySearchText(
  category: ProductCardData["category"],
) {
  switch (category) {
    case "MASK":
      return "Maske Masken Krampusmaske";

    case "COSTUME":
      return "Kostüm Kostüme Krampuskostüm";

    case "MASK_AND_COSTUME":
      return "Maske Kostüm Masken Kostüme Set Komplettset";

    default:
      return "";
  }
}

/* =========================================================
   CALCUL DES NUMÉROS DE PAGE
========================================================= */

type PaginationItem =
  | number
  | "ellipsis";

function getPaginationPages(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 3) {
    return [
      1,
      2,
      3,
      4,
      "ellipsis",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}