import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  PackageOpen,
  ShoppingBag,
} from "lucide-react";

import {
  PUBLIC_CATEGORY_LABELS,
  PUBLIC_ROUTES,
  type PublicProductCategory,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — HOME PRODUCTS
   components/public/home/HomeProducts.tsx

   Section produits de la page d'accueil.

   Le composant :
   - reçoit les produits depuis app/(public)/page.tsx
   - n'effectue aucun fetch côté client
   - affiche uniquement les données transmises par le serveur
   - gère prix normal + prix promotionnel
   - gère les 3 catégories
   - gère le stock
   - responsive mobile / desktop
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  category: PublicProductCategory;
  price: string | number;
  promotionalPrice?: string | number | null;
  stock: number;
  mainImage: string;
};

type HomeProductsProps = {
  products: HomeProduct[];
};

/* =========================================================
   FORMATAGE DU PRIX
   ========================================================= */

function formatPrice(
  value: string | number
): string {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/* =========================================================
   VÉRIFICATION DU PRIX PROMOTIONNEL
   ========================================================= */

function getValidPromotionalPrice(
  price: string | number,
  promotionalPrice?: string | number | null
): number | null {
  if (
    promotionalPrice === null ||
    promotionalPrice === undefined ||
    promotionalPrice === ""
  ) {
    return null;
  }

  const normalPrice = Number(price);
  const promoPrice = Number(promotionalPrice);

  if (
    !Number.isFinite(normalPrice) ||
    !Number.isFinite(promoPrice) ||
    promoPrice <= 0 ||
    promoPrice >= normalPrice
  ) {
    return null;
  }

  return promoPrice;
}

/* =========================================================
   LIEN D'UN PRODUIT
   ========================================================= */

function getProductHref(slug: string): string {
  return `/produkte/${encodeURIComponent(slug)}`;
}

/* =========================================================
   CARTE PRODUIT
   ========================================================= */

function ProductCard({
  product,
}: {
  product: HomeProduct;
}) {
  const promotionalPrice =
    getValidPromotionalPrice(
      product.price,
      product.promotionalPrice
    );

  const hasPromotion =
    promotionalPrice !== null;

  const inStock = product.stock > 0;

  return (
    <article
      className="
        group
        flex
        min-w-0
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-slate-300
        hover:shadow-[0_18px_45px_rgba(15,23,42,0.11)]
      "
    >
      {/* ===================================================
          IMAGE
         =================================================== */}

      <Link
        href={getProductHref(product.slug)}
        aria-label={product.name}
        className="
          relative
          block
          aspect-[4/5]
          w-full
          overflow-hidden
          bg-slate-100
          focus:outline-none
          focus-visible:ring-4
          focus-visible:ring-inset
          focus-visible:ring-[#1769e0]/30
        "
      >
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes="
            (max-width: 639px) 50vw,
            (max-width: 1023px) 33vw,
            (max-width: 1279px) 25vw,
            320px
          "
          className="
            object-cover
            object-center
            transition-transform
            duration-500
            ease-out
            group-hover:scale-[1.035]
          "
        />

        {/* CATÉGORIE */}

        <div
          className="
            absolute
            left-2.5
            top-2.5
            max-w-[calc(100%-20px)]
            sm:left-3
            sm:top-3
          "
        >
          <span
            className="
              inline-flex
              max-w-full
              items-center
              rounded-full
              border
              border-white/30
              bg-black/60
              px-2.5
              py-1.5
              text-[9px]
              font-bold
              uppercase
              leading-none
              tracking-[0.08em]
              text-white
              shadow-sm
              backdrop-blur-md
              sm:px-3
              sm:text-[10px]
            "
          >
            <span className="truncate">
              {PUBLIC_CATEGORY_LABELS[
                product.category
              ]}
            </span>
          </span>
        </div>

        {/* PROMOTION */}

        {hasPromotion ? (
          <div
            className="
              absolute
              right-2.5
              top-2.5
              sm:right-3
              sm:top-3
            "
          >
            <span
              className="
                inline-flex
                items-center
                rounded-full
                bg-[#b91c1c]
                px-2.5
                py-1.5
                text-[9px]
                font-black
                uppercase
                leading-none
                tracking-[0.08em]
                text-white
                shadow-md
                sm:px-3
                sm:text-[10px]
              "
            >
              Angebot
            </span>
          </div>
        ) : null}

        {/* RUPTURE DE STOCK */}

        {!inStock ? (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-black/45
              p-3
              backdrop-blur-[1px]
            "
          >
            <span
              className="
                rounded-full
                border
                border-white/25
                bg-black/70
                px-3
                py-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-white
                shadow-lg
                sm:text-xs
              "
            >
              Ausverkauft
            </span>
          </div>
        ) : null}
      </Link>

      {/* ===================================================
          INFORMATIONS
         =================================================== */}

      <div
        className="
          flex
          flex-1
          flex-col
          p-3
          sm:p-4
          lg:p-5
        "
      >
        {/* NOM */}

        <Link
          href={getProductHref(product.slug)}
          className="
            line-clamp-2
            min-h-[40px]
            text-[14px]
            font-bold
            leading-5
            text-slate-950
            transition-colors
            hover:text-[#1769e0]
            focus:outline-none
            focus-visible:text-[#1769e0]
            sm:min-h-[44px]
            sm:text-[15px]
            sm:leading-[22px]
            lg:text-base
          "
        >
          {product.name}
        </Link>

        {/* PRIX */}

        <div className="mt-3">
          {hasPromotion ? (
            <div
              className="
                flex
                flex-wrap
                items-baseline
                gap-x-2
                gap-y-1
              "
            >
              <span
                className="
                  text-[15px]
                  font-black
                  text-[#b91c1c]
                  sm:text-base
                  lg:text-lg
                "
              >
                {formatPrice(
                  promotionalPrice
                )}
              </span>

              <span
                className="
                  text-[11px]
                  font-semibold
                  text-slate-400
                  line-through
                  sm:text-xs
                "
              >
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span
              className="
                text-[15px]
                font-black
                text-slate-950
                sm:text-base
                lg:text-lg
              "
            >
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* STOCK */}

        <div className="mt-2">
          {inStock ? (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                text-[10px]
                font-bold
                text-emerald-700
                sm:text-[11px]
              "
            >
              <span
                aria-hidden="true"
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-500
                "
              />

              Auf Lager
            </span>
          ) : (
            <span
              className="
                text-[10px]
                font-bold
                text-slate-500
                sm:text-[11px]
              "
            >
              Derzeit nicht verfügbar
            </span>
          )}
        </div>

        {/* CTA */}

        <div className="mt-auto pt-4">
          <Link
            href={getProductHref(product.slug)}
            className="
              group/button
              flex
              min-h-10
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#07111f]
              px-3
              py-2.5
              text-[11px]
              font-bold
              text-white
              transition-all
              duration-200
              hover:bg-[#1769e0]
              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#1769e0]/20
              sm:min-h-11
              sm:text-xs
              lg:text-sm
            "
          >
            <ShoppingBag
              aria-hidden="true"
              className="
                h-4
                w-4
                shrink-0
              "
              strokeWidth={2}
            />

            <span>Produkt ansehen</span>

            <ArrowRight
              aria-hidden="true"
              className="
                hidden
                h-4
                w-4
                shrink-0
                transition-transform
                duration-200
                group-hover/button:translate-x-0.5
                sm:block
              "
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ÉTAT VIDE
   ========================================================= */

function EmptyProducts() {
  return (
    <div
      className="
        flex
        min-h-[300px]
        w-full
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-slate-300
        bg-slate-50
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
          rounded-2xl
          bg-white
          text-slate-500
          shadow-sm
          ring-1
          ring-slate-200
        "
      >
        <PackageOpen
          aria-hidden="true"
          className="h-7 w-7"
          strokeWidth={1.8}
        />
      </div>

      <h3
        className="
          mt-5
          text-lg
          font-black
          text-slate-950
        "
      >
        Bald verfügbar
      </h3>

      <p
        className="
          mt-2
          max-w-md
          text-sm
          leading-6
          text-slate-500
        "
      >
        Neue Krampus-Masken und Kostüme werden
        vorbereitet.
      </p>
    </div>
  );
}

/* =========================================================
   SECTION PRINCIPALE
   ========================================================= */

export default function HomeProducts({
  products,
}: HomeProductsProps) {
  return (
    <section
      id="produkte"
      aria-labelledby="home-products-title"
      className="bg-white py-12 sm:py-14 lg:py-16 xl:py-20"
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-4
          sm:px-5
          lg:px-6
          xl:px-8
          2xl:px-10
        "
      >
        {/* =================================================
            EN-TÊTE
           ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div className="max-w-2xl">
            <p
              className="
                text-[11px]
                font-black
                uppercase
                tracking-[0.18em]
                text-[#1769e0]
                sm:text-xs
              "
            >
              NACHTKRONE Kollektion
            </p>

            <h2
              id="home-products-title"
              className="
                mt-2
                text-[28px]
                font-black
                leading-tight
                tracking-[-0.025em]
                text-slate-950
                sm:text-[34px]
                lg:text-[40px]
              "
            >
              Entdecke unsere Produkte
            </h2>

            <p
              className="
                mt-3
                max-w-xl
                text-sm
                leading-6
                text-slate-600
                sm:text-[15px]
                sm:leading-7
              "
            >
              Ausgewählte Masken, Kostüme und Sets
              für deine Krampus-Saison.
            </p>
          </div>

          {/* LIEN TOUS LES PRODUITS — DESKTOP */}

          <Link
            href={PUBLIC_ROUTES.products}
            className="
              group
              hidden
              shrink-0
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              hover:border-slate-300
              hover:bg-slate-50
              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#1769e0]/15
              sm:inline-flex
            "
          >
            <span>Alle Produkte</span>

            <ArrowRight
              aria-hidden="true"
              className="
                h-4
                w-4
                transition-transform
                group-hover:translate-x-0.5
              "
              strokeWidth={2}
            />
          </Link>
        </div>

        {/* =================================================
            PRODUITS
           ================================================= */}

        <div className="mt-8 lg:mt-10">
          {products.length > 0 ? (
            <div
              className="
                grid
                grid-cols-2
                gap-3
                sm:grid-cols-3
                sm:gap-4
                lg:grid-cols-4
                lg:gap-5
                xl:gap-6
              "
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <EmptyProducts />
          )}
        </div>

        {/* =================================================
            TOUS LES PRODUITS — MOBILE
           ================================================= */}

        {products.length > 0 ? (
          <div className="mt-7 sm:hidden">
            <Link
              href={PUBLIC_ROUTES.products}
              className="
                group
                flex
                min-h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                font-bold
                text-slate-900
                shadow-sm
                transition
                hover:bg-slate-50
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#1769e0]/15
              "
            >
              <span>Alle Produkte ansehen</span>

              <ArrowRight
                aria-hidden="true"
                className="
                  h-4
                  w-4
                  transition-transform
                  group-hover:translate-x-0.5
                "
                strokeWidth={2}
              />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}