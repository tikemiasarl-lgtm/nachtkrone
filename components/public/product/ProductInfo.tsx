import {
  CheckCircle2,
  PackageX,
  Tag,
} from "lucide-react";

import {
  getPublicCategoryLabel,
  type PublicProductCategory,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — PRODUCT INFO
   components/public/product/ProductInfo.tsx

   Informations principales de la fiche produit :

   - catégorie
   - nom
   - prix normal
   - prix promotionnel
   - réduction calculée
   - disponibilité
   - description courte

   Aucune information produit n'est inventée.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ProductPriceValue =
  | string
  | number
  | null
  | undefined;

type ProductInfoProps = {
  name: string;
  category: PublicProductCategory;
  price: ProductPriceValue;
  promotionalPrice?: ProductPriceValue;
  stock: number;
  shortDescription?: string | null;
};

/* =========================================================
   CONSTANTES
   ========================================================= */

const EURO_FORMATTER =
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* =========================================================
   HELPERS
   ========================================================= */

function toNumber(
  value: ProductPriceValue
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function formatPrice(
  value: number
): string {
  return EURO_FORMATTER.format(value);
}

function normalizeStock(
  stock: number
): number {
  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(stock)
  );
}

function normalizeText(
  value?: string | null
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductInfo({
  name,
  category,
  price,
  promotionalPrice,
  stock,
  shortDescription,
}: ProductInfoProps) {
  /* =======================================================
     NORMALISATION
     ======================================================= */

  const normalizedName =
    normalizeText(name);

  const normalizedDescription =
    normalizeText(shortDescription);

  const normalizedStock =
    normalizeStock(stock);

  const basePrice =
    toNumber(price);

  const promoPrice =
    toNumber(promotionalPrice);

  /* =======================================================
     PROMOTION

     Une promotion n'est considérée comme valide que si :
     - prix normal valide
     - prix promo valide
     - prix promo >= 0
     - prix promo < prix normal
     ======================================================= */

  const hasPromotion =
    basePrice !== null &&
    promoPrice !== null &&
    basePrice > 0 &&
    promoPrice >= 0 &&
    promoPrice < basePrice;

  const displayedPrice =
    hasPromotion
      ? promoPrice
      : basePrice;

  /* =======================================================
     POURCENTAGE DE RÉDUCTION
     ======================================================= */

  const discountPercentage =
    hasPromotion &&
    basePrice !== null &&
    promoPrice !== null
      ? Math.round(
          ((basePrice - promoPrice) /
            basePrice) *
            100
        )
      : null;

  const inStock =
    normalizedStock > 0;

  const categoryLabel =
    getPublicCategoryLabel(category);

  return (
    <div className="w-full">
      {/* =====================================================
          CATÉGORIE + PROMOTION
         ===================================================== */}

      <div
        className="
          mb-3
          flex
          flex-wrap
          items-center
          gap-2
        "
      >
        {/* CATÉGORIE */}

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-[#f5f0e7]
            px-3
            py-1.5
            text-[11px]
            font-extrabold
            uppercase
            tracking-[0.08em]
            text-[#805b2b]
            sm:text-xs
          "
        >
          <Tag
            aria-hidden="true"
            className="h-3.5 w-3.5"
            strokeWidth={2.2}
          />

          {categoryLabel}
        </span>

        {/* PROMOTION */}

        {hasPromotion &&
        discountPercentage !== null &&
        discountPercentage > 0 ? (
          <span
            className="
              inline-flex
              items-center
              rounded-full
              bg-[#faf0f1]
              px-3
              py-1.5
              text-[11px]
              font-black
              uppercase
              tracking-[0.06em]
              text-[#96243c]
              sm:text-xs
            "
          >
            -{discountPercentage}%
          </span>
        ) : null}
      </div>

      {/* =====================================================
          NOM DU PRODUIT
         ===================================================== */}

      <h1
        className="
          break-words
          text-[28px]
          font-black
          leading-[1.16]
          tracking-[-0.035em]
          text-slate-950
          sm:text-[30px]
          lg:text-[34px]
          xl:text-[38px]
        "
      >
        {normalizedName}
      </h1>

      {/* =====================================================
          PRIX
         ===================================================== */}

      {displayedPrice !== null ? (
        <div
          className="
            mt-5
            flex
            flex-wrap
            items-end
            gap-x-3
            gap-y-1.5
          "
        >
          {/* PRIX ACTUEL */}

          <span
            className={[
              "font-black",
              "tracking-[-0.025em]",
              "tabular-nums",
              "text-[32px]",
              "sm:text-[38px]",
              hasPromotion
                ? "text-[#96243c] rounded-xl border border-[#ead2d5] bg-[#faf0f1] px-3 py-1"
                : "text-[#805b2b]",
            ].join(" ")}
          >
            {formatPrice(
              displayedPrice
            )}
          </span>

          {/* ANCIEN PRIX */}

          {hasPromotion &&
          basePrice !== null ? (
            <span
              className="
                pb-1
                text-sm
                font-semibold
                tabular-nums
                text-slate-500
                line-through
                decoration-slate-400
                decoration-1
                sm:text-base
              "
            >
              {formatPrice(basePrice)}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* =====================================================
          DISPONIBILITÉ
         ===================================================== */}

      <div className="mt-5">
        {inStock ? (
          <div
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-emerald-700
            "
          >
            <CheckCircle2
              aria-hidden="true"
              className="
                h-[18px]
                w-[18px]
                shrink-0
              "
              strokeWidth={2.2}
            />

            <span>Auf Lager</span>
          </div>
        ) : (
          <div
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-[#96243c]
            "
          >
            <PackageX
              aria-hidden="true"
              className="
                h-[18px]
                w-[18px]
                shrink-0
              "
              strokeWidth={2.2}
            />

            <span>
              Nicht auf Lager
            </span>
          </div>
        )}
      </div>

      {/* =====================================================
          DESCRIPTION COURTE
         ===================================================== */}

      {normalizedDescription ? (
        <div
          className="
            mt-5
            border-t
            border-[#e8e3da]
            pt-5
          "
        >
          <p
            className="
              whitespace-pre-line
              break-words
              text-[14px]
              leading-7
              text-slate-600
              sm:text-[15px]
              sm:leading-7
            "
          >
            {normalizedDescription}
          </p>
        </div>
      ) : null}
    </div>
  );
}