import { PRODUCT_CATEGORY_LABELS, type ProductCategoryValue } from "@/lib/product-categories";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export type ProductCardCategory = ProductCategoryValue;

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: ProductCardCategory;

  /*
   * Les prix arrivent déjà convertis en number depuis
   * la page serveur / ProductsPage.
   *
   * On ne transmet pas directement Prisma.Decimal à
   * un composant client.
   */
  price: number;
  promotionalPrice: number | null;

  stock: number;
  mainImage: string;
};

type ProductCardProps = {
  product: ProductCardData;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function ProductCard({
  product,
}: ProductCardProps) {
  const {
    name,
    slug,
    shortDescription,
    category,
    price,
    promotionalPrice,
    stock,
    mainImage,
  } = product;

  const available = stock > 0;

  const hasPromotion =
    promotionalPrice !== null &&
    promotionalPrice >= 0 &&
    promotionalPrice < price;

  const effectivePrice = hasPromotion
    ? promotionalPrice
    : price;

  const categoryLabel = getCategoryLabel(category);

  const productHref = `/produkte/${encodeURIComponent(slug)}`;

  return (
    <article
      className="
        group
        flex
        h-full
        min-w-0
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
      "
    >
      {/* ===================================================
          IMAGE
      =================================================== */}

      <Link
        href={productHref}
        aria-label={`${name} ansehen`}
        className="
          relative
          block
          aspect-[4/3]
          w-full
          overflow-hidden
          bg-slate-100
        "
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={name}
            fill
            sizes="
              (max-width: 640px) 50vw,
              (max-width: 1024px) 33vw,
              25vw
            "
            className="
              object-cover
              transition-transform
              duration-300
              group-hover:scale-[1.02]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              px-4
              text-center
              text-sm
              font-medium
              text-slate-400
            "
          >
            Kein Bild verfügbar
          </div>
        )}

        {/* Promotion */}
        {hasPromotion && (
          <span
            className="
              absolute
              left-2.5
              top-2.5
              z-10
              rounded-md
              bg-red-600
              px-2.5
              py-1
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              text-white
              shadow-sm
              sm:left-3
              sm:top-3
              sm:text-xs
            "
          >
            Angebot
          </span>
        )}

        {/* Rupture de stock */}
        {!available && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-slate-950/35
              p-4
            "
          >
            <span
              className="
                rounded-md
                bg-white
                px-3
                py-1.5
                text-xs
                font-bold
                text-slate-950
                shadow
                sm:text-sm
              "
            >
              Ausverkauft
            </span>
          </div>
        )}
      </Link>

      {/* ===================================================
          INFORMATIONS
      =================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
          p-3
          sm:p-4
        "
      >
        {/* Catégorie */}
        <p
          className="
            mb-1.5
            text-[10px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-blue-700
            sm:text-xs
          "
        >
          {categoryLabel}
        </p>

        {/* Nom */}
        <h2
          className="
            line-clamp-2
            text-sm
            font-bold
            leading-snug
            text-slate-950
            sm:text-base
          "
        >
          <Link
            href={productHref}
            className="
              transition-colors
              hover:text-blue-700
            "
          >
            {name}
          </Link>
        </h2>

        {/* Description */}
        {shortDescription && (
          <p
            className="
              mt-2
              hidden
              line-clamp-2
              text-sm
              leading-5
              text-slate-600
              sm:block
            "
          >
            {shortDescription}
          </p>
        )}

        {/* =================================================
            PRIX
        ================================================= */}

        <div className="mt-auto pt-3 sm:pt-4">
          {hasPromotion ? (
            <div
              className="
                flex
                flex-wrap
                items-baseline
                gap-x-2
                gap-y-0.5
              "
            >
              <span
                className="
                  text-base
                  font-extrabold
                  text-red-600
                  sm:text-lg
                "
              >
                {formatPrice(effectivePrice)}
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-400
                  line-through
                  sm:text-sm
                "
              >
                {formatPrice(price)}
              </span>
            </div>
          ) : (
            <div
              className="
                text-base
                font-extrabold
                text-slate-950
                sm:text-lg
              "
            >
              {formatPrice(price)}
            </div>
          )}

          {/* Stock */}
          <div className="mt-1.5">
            {available ? (
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-emerald-700
                  sm:text-xs
                "
              >
                Auf Lager
              </p>
            ) : (
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-red-600
                  sm:text-xs
                "
              >
                Nicht verfügbar
              </p>
            )}
          </div>

          {/* ===============================================
              BOUTON
          =============================================== */}

          <Link
            href={productHref}
            className="
              mt-3
              flex
              min-h-10
              w-full
              items-center
              justify-center
              gap-1.5
              rounded-lg
              bg-slate-950
              px-2
              py-2.5
              text-center
              text-xs
              font-bold
              text-white
              transition
              hover:bg-blue-700
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-600
              focus-visible:ring-offset-2
              sm:min-h-11
              sm:gap-2
              sm:px-4
              sm:text-sm
            "
          >
            <span>Produkt ansehen</span>

            <ArrowRight
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   CATÉGORIE
========================================================= */

function getCategoryLabel(
  category: ProductCardCategory,
) {
  switch (category) {
    case "MASK":
      return "Maske";

    case "COSTUME":
      return "Kostüm";

    case "MASK_AND_COSTUME":
      return "Maske & Kostüm";

    default:
      return PRODUCT_CATEGORY_LABELS[category] ?? "Produkt";
  }
}

/* =========================================================
   FORMATAGE DU PRIX
========================================================= */

function formatPrice(value: number) {
  if (!Number.isFinite(value)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}